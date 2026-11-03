import { Exception } from '@adonisjs/core/exceptions'
import db from '@adonisjs/lucid/services/db'
import ExcelJS from 'exceljs'
import PDFDocument from 'pdfkit'
import ProcesoCompra from '#models/proceso_compra'
import ProcesoCompraOrigen from '#models/proceso_compra_origen'
import { assertCan, type AccessScope } from '#services/access_control'
import { rethrowDatabaseError } from '#services/database_error'

export default class ProcesoCompraService {
  async consolidado(scope: AccessScope, vigencia: number) {
    assertCan(scope, 'proceso_compra.ver')

    const rows = await db
      .from('detalle_solicitud_programa as d')
      .join(
        'solicitud_material_programa as s',
        's.id_solicitud_programa',
        'd.id_solicitud_programa'
      )
      .join('lista_maestra_material as l', 'l.id_lista_maestra', 'd.id_lista_maestra')
      .join('programa_formacion as p', 'p.id_programa_formacion', 's.id_programa_formacion')
      .join('ficha as f', 'f.id_ficha', 's.id_ficha')
      .where('f.centro_formacion_id', scope.idCformacion)
      .where('s.vigencia', vigencia)
      .whereIn('s.estado', ['aprobada', 'parcial'])
      .whereIn('d.estado', ['aprobado', 'parcial'])
      .select(
        'l.codigo_unspsc as codigoUnspsc',
        'l.producto as producto',
        'l.unidad_medida as unidadMedida',
        'l.valor_unitario as valorUnitario',
        'l.caracter as caracter',
        'p.codigo_programa as codigoPrograma',
        'p.nombre_programa as nombrePrograma'
      )
      .sum('d.cantidad_aprobada as cantidadAprobada')
      .groupBy(
        'l.codigo_unspsc',
        'l.producto',
        'l.unidad_medida',
        'l.valor_unitario',
        'l.caracter',
        'p.codigo_programa',
        'p.nombre_programa'
      )
      .orderBy('l.producto', 'asc')

    return rows.map((row) => ({
      codigoUnspsc: row.codigoUnspsc,
      producto: row.producto,
      unidadMedida: row.unidadMedida,
      valorUnitario: row.valorUnitario === null ? null : Number(row.valorUnitario),
      caracter: row.caracter,
      codigoPrograma: row.codigoPrograma,
      nombrePrograma: row.nombrePrograma,
      cantidadAprobada: Number(row.cantidadAprobada),
    }))
  }

  async generar(
    scope: AccessScope,
    payload: { vigencia: number; codigoProceso: string; descripcion?: string | null }
  ) {
    assertCan(scope, 'proceso_compra.crear')
    const consolidado = await this.consolidado(scope, payload.vigencia)
    if (!consolidado.length) {
      throw new Exception('No hay ítems aprobados para unificar en esa vigencia', {
        status: 422,
        code: 'E_SIN_APROBADOS',
      })
    }

    try {
      const proceso = await ProcesoCompra.create({
        vigencia: payload.vigencia,
        codigoProceso: payload.codigoProceso,
        descripcion: payload.descripcion ?? null,
        usuarioComprasId: scope.idUsuario,
        estado: 'generado',
      })

      const detalles = await db
        .from('detalle_solicitud_programa as d')
        .join(
          'solicitud_material_programa as s',
          's.id_solicitud_programa',
          'd.id_solicitud_programa'
        )
        .leftJoin(
          'proceso_compra_origen as o',
          'o.id_detalle_solicitud',
          'd.id_detalle_solicitud'
        )
        .join('ficha as f', 'f.id_ficha', 's.id_ficha')
        .where('f.centro_formacion_id', scope.idCformacion)
        .where('s.vigencia', payload.vigencia)
        .whereIn('s.estado', ['aprobada', 'parcial'])
        .whereIn('d.estado', ['aprobado', 'parcial'])
        .whereNull('o.id_proceso_origen')
        .select('d.id_detalle_solicitud as id')

      if (detalles.length) {
        await ProcesoCompraOrigen.createMany(
          detalles.map((detalle) => ({
            procesoId: proceso.id,
            detalleId: Number(detalle.id),
          }))
        )
      }

      return {
        id: proceso.id,
        vigencia: proceso.vigencia,
        codigoProceso: proceso.codigoProceso,
        descripcion: proceso.descripcion,
        estado: proceso.estado,
        items: consolidado,
      }
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo generar el proceso de compra')
    }
  }

  /**
   * Pedido ya aprobado por quien revisa solicitudes, de esa vigencia y de ese
   * centro. Quien tenga `proceso_compra.ver` lo descarga; no hace falta el
   * permiso de pedir.
   */
  async excel(scope: AccessScope, vigencia: number) {
    const filas = await this.consolidado(scope, vigencia)
    const libro = new ExcelJS.Workbook()
    const hoja = libro.addWorksheet('Aprobado')
    hoja.addRow(['Vigencia', vigencia])
    hoja.addRow([])
    hoja.addRow([
      'Código UNSPSC',
      'Producto',
      'Unidad',
      'Carácter',
      'Programa',
      'Cantidad aprobada',
      'Valor unitario',
    ])
    for (const fila of filas) {
      hoja.addRow([
        fila.codigoUnspsc,
        fila.producto,
        fila.unidadMedida,
        fila.caracter,
        `${fila.codigoPrograma} — ${fila.nombrePrograma}`,
        fila.cantidadAprobada,
        fila.valorUnitario,
      ])
    }
    return Buffer.from(await libro.xlsx.writeBuffer())
  }

  async pdf(scope: AccessScope, vigencia: number) {
    const filas = await this.consolidado(scope, vigencia)
    const doc = new PDFDocument({ margin: 40, size: 'A4' })
    const chunks: Buffer[] = []
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    const listo = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)))
    })
    doc.fontSize(16).text(`Pedido aprobado ${vigencia}`)
    doc.moveDown()
    doc.fontSize(10)
    for (const fila of filas) {
      doc.text(
        `${fila.producto} · ${fila.cantidadAprobada} ${fila.unidadMedida ?? ''} · ${fila.codigoPrograma} · ${fila.valorUnitario ?? 'sin precio'}`
      )
    }
    if (!filas.length) doc.text('No hay materiales aprobados en esta vigencia.')
    doc.end()
    return listo
  }
}
