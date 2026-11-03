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
      .join('usuario as instructor', 'instructor.id_usuario', 's.id_usuario_instructor')
      .leftJoin('usuario as coordinador', 'coordinador.id_usuario', 's.id_usuario_aprobador')
      .leftJoin('lote_vigencia as lote', 'lote.id_lote', 'l.id_lote')
      .leftJoin('redes_conocimiento as red', 'red.id_red_conocimiento', 'p.id_red_conocimiento')
      .leftJoin('lineas_tematicas as linea', 'linea.id_linea_tematica', 'p.id_linea_tematica')
      .where('f.centro_formacion_id', scope.idCformacion)
      .where('s.vigencia', vigencia)
      .whereIn('s.estado', ['aprobada', 'parcial'])
      .whereIn('d.estado', ['aprobado', 'parcial'])
      .where('d.cantidad_aprobada', '>', 0)
      .select(
        's.id_solicitud_programa as solicitudId',
        's.vigencia as vigencia',
        's.estado as estadoSolicitud',
        's.observacion as observacionSolicitud',
        's.observacion_decision as observacionDecision',
        's.fecha_envio as fechaEnvio',
        's.fecha_decision as fechaDecision',
        'f.numero_ficha as numeroFicha',
        'instructor.nombres as instructorNombres',
        'instructor.apellidos as instructorApellidos',
        'coordinador.nombres as coordinadorNombres',
        'coordinador.apellidos as coordinadorApellidos',
        'p.codigo_programa as codigoPrograma',
        'p.nombre_programa as nombrePrograma',
        'red.red_conocimiento as red',
        'linea.linea_tematica as linea',
        'l.codigo_unspsc as codigoUnspsc',
        'l.producto as producto',
        'l.descripcion_tecnica as descripcionTecnica',
        'l.unidad_medida as unidadMedida',
        'l.valor_unitario as valorUnitario',
        'l.caracter as caracter',
        'l.cantidad_base as cantidadBase',
        'l.observaciones as observacionesMaterial',
        'lote.nombre as lote',
        'd.cantidad_maestra_referencia as cantidadMaestra',
        'd.cantidad_solicitada as cantidadSolicitada',
        'd.cantidad_aprobada as cantidadAprobada',
        'd.estado as estadoLinea',
        'd.observacion_coordinador as observacionCoordinador'
      )
      .orderBy('f.numero_ficha', 'asc')
      .orderBy('l.producto', 'asc')

    return rows.map((row) => {
      const valor = row.valorUnitario === null ? null : Number(row.valorUnitario)
      const pedida = Number(row.cantidadSolicitada)
      const aprobada = Number(row.cantidadAprobada)
      return {
        solicitudId: Number(row.solicitudId),
        vigencia: Number(row.vigencia),
        estadoSolicitud: row.estadoSolicitud as string,
        observacionSolicitud: (row.observacionSolicitud as string | null) ?? null,
        observacionDecision: (row.observacionDecision as string | null) ?? null,
        fechaEnvio: row.fechaEnvio ?? null,
        fechaDecision: row.fechaDecision ?? null,
        numeroFicha: row.numeroFicha as string,
        instructor: `${row.instructorNombres ?? ''} ${row.instructorApellidos ?? ''}`.trim(),
        coordinador: `${row.coordinadorNombres ?? ''} ${row.coordinadorApellidos ?? ''}`.trim() || null,
        codigoPrograma: row.codigoPrograma as string,
        nombrePrograma: row.nombrePrograma as string,
        red: (row.red as string | null) ?? null,
        linea: (row.linea as string | null) ?? null,
        codigoUnspsc: row.codigoUnspsc as string,
        producto: row.producto as string,
        descripcionTecnica: (row.descripcionTecnica as string | null) ?? null,
        unidadMedida: (row.unidadMedida as string | null) ?? null,
        valorUnitario: valor,
        caracter: (row.caracter as string | null) ?? null,
        cantidadBase: Number(row.cantidadBase ?? 0),
        observacionesMaterial: (row.observacionesMaterial as string | null) ?? null,
        lote: (row.lote as string | null) ?? null,
        cantidadMaestra: row.cantidadMaestra === null ? null : Number(row.cantidadMaestra),
        cantidadSolicitada: pedida,
        cantidadAprobada: aprobada,
        valorPedido: valor === null ? null : pedida * valor,
        valorAprobado: valor === null ? null : aprobada * valor,
        estadoLinea: row.estadoLinea as string,
        observacionCoordinador: (row.observacionCoordinador as string | null) ?? null,
      }
    })
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
    libro.creator = 'Plataforma de formación'
    const hoja = libro.addWorksheet('Pedido aprobado', {
      views: [{ state: 'frozen', ySplit: 5 }],
      pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, paperSize: 1 },
    })

    const columnas = [
      { header: 'Solicitud', ancho: 12 },
      { header: 'Ficha', ancho: 16 },
      { header: 'Programa', ancho: 32 },
      { header: 'Instructor', ancho: 24 },
      { header: 'Aprobó', ancho: 24 },
      { header: 'Producto', ancho: 32 },
      { header: 'Descripción técnica', ancho: 36 },
      { header: 'Unidad', ancho: 12 },
      { header: 'Pidió', ancho: 12 },
      { header: 'Aprobado', ancho: 12 },
      { header: 'Valor unitario', ancho: 16 },
      { header: 'Valor pedido', ancho: 16 },
      { header: 'Valor aprobado', ancho: 18 },
      { header: 'Estado', ancho: 14 },
      { header: 'Observación', ancho: 28 },
      { header: 'Código UNSPSC', ancho: 16 },
      { header: 'Lote', ancho: 16 },
      { header: 'Red', ancho: 22 },
    ]
    hoja.columns = columnas.map((columna) => ({ width: columna.ancho }))

    hoja.mergeCells(1, 1, 1, columnas.length)
    const titulo = hoja.getCell(1, 1)
    titulo.value = `Pedido aprobado ${vigencia}`
    titulo.font = { name: 'Calibri', size: 18, bold: true, color: { argb: 'FFFFFFFF' } }
    titulo.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B4332' } }
    titulo.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
    hoja.getRow(1).height = 28

    const totalPedido = filas.reduce((suma, fila) => suma + (fila.valorPedido ?? 0), 0)
    const totalAprobado = filas.reduce((suma, fila) => suma + (fila.valorAprobado ?? 0), 0)
    hoja.mergeCells(2, 1, 2, columnas.length)
    const resumen = hoja.getCell(2, 1)
    resumen.value = `${filas.length} materiales · valor pedido ${pesos(totalPedido)} · valor aprobado ${pesos(totalAprobado)}`
    resumen.font = { name: 'Calibri', size: 11, color: { argb: 'FF1B4332' } }
    resumen.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD8F3DC' } }
    resumen.alignment = { vertical: 'middle', indent: 1 }
    hoja.getRow(2).height = 20

    hoja.getRow(3).height = 8
    hoja.getRow(4).height = 6

    const encabezado = hoja.getRow(5)
    encabezado.values = columnas.map((columna) => columna.header)
    encabezado.height = 22
    encabezado.eachCell((celda) => {
      celda.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }
      celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D6A4F' } }
      celda.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    })

    filas.forEach((fila, indice) => {
      const row = hoja.addRow([
        fila.solicitudId,
        fila.numeroFicha,
        `${fila.codigoPrograma} ${fila.nombrePrograma}`.trim(),
        fila.instructor,
        fila.coordinador,
        fila.producto,
        fila.descripcionTecnica,
        fila.unidadMedida,
        fila.cantidadSolicitada,
        fila.cantidadAprobada,
        fila.valorUnitario,
        fila.valorPedido,
        fila.valorAprobado,
        fila.estadoLinea,
        fila.observacionCoordinador ?? fila.observacionDecision,
        fila.codigoUnspsc,
        fila.lote,
        fila.red,
      ])
      row.height = 20
      const fondo = indice % 2 === 0 ? 'FFFFFFFF' : 'FFF4F7F5'
      row.eachCell((celda, col) => {
        celda.font = { name: 'Calibri', size: 10, color: { argb: 'FF1A1A1A' } }
        celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fondo } }
        celda.alignment = {
          vertical: 'middle',
          horizontal: col >= 9 && col <= 13 ? 'right' : 'left',
          wrapText: col === 6 || col === 7,
        }
        if (col >= 11 && col <= 13) celda.numFmt = '"$"#,##0'
        if (col === 9 || col === 10) celda.numFmt = '#,##0'
      })
    })

    const totales = hoja.addRow([
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      'Total',
      filas.reduce((suma, fila) => suma + fila.cantidadSolicitada, 0),
      filas.reduce((suma, fila) => suma + fila.cantidadAprobada, 0),
      '',
      totalPedido,
      totalAprobado,
    ])
    totales.height = 22
    totales.eachCell((celda, col) => {
      celda.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF1B4332' } }
      celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD8F3DC' } }
      celda.alignment = { vertical: 'middle', horizontal: col >= 8 ? 'right' : 'left' }
      if (col === 12 || col === 13) celda.numFmt = '"$"#,##0'
      if (col === 9 || col === 10) celda.numFmt = '#,##0'
    })

    hoja.autoFilter = {
      from: { row: 5, column: 1 },
      to: { row: 5 + Math.max(filas.length, 1), column: columnas.length },
    }

    return Buffer.from(await libro.xlsx.writeBuffer())
  }

  async pdf(scope: AccessScope, vigencia: number) {
    const filas = await this.consolidado(scope, vigencia)
    const doc = new PDFDocument({ margin: 32, size: 'A4', layout: 'landscape' })
    const chunks: Buffer[] = []
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    const listo = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)))
    })

    const verde = '#1B4332'
    const verdeClaro = '#D8F3DC'
    const linea = '#C5D5CB'
    const margen = 32
    const ancho = doc.page.width - margen * 2
    const columnas: { label: string; w: number; align: 'left' | 'right' }[] = [
      { label: 'Producto', w: 210, align: 'left' },
      { label: 'Unidad', w: 58, align: 'left' },
      { label: 'Pidió', w: 52, align: 'right' },
      { label: 'Aprobado', w: 68, align: 'right' },
      { label: 'Valor unitario', w: 100, align: 'right' },
      { label: 'Valor pedido', w: 100, align: 'right' },
      { label: 'Valor aprobado', w: ancho - 588, align: 'right' },
    ]

    const totalPedido = filas.reduce((suma, fila) => suma + (fila.valorPedido ?? 0), 0)
    const totalAprobado = filas.reduce((suma, fila) => suma + (fila.valorAprobado ?? 0), 0)

    const encabezadoPagina = () => {
      doc.rect(0, 0, doc.page.width, 52).fill(verde)
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(16)
      doc.text(`Pedido aprobado ${vigencia}`, margen, 12, { width: ancho * 0.6 })
      doc.font('Helvetica').fontSize(9)
      doc.text(
        `${filas.length} materiales  ·  pedido ${pesos(totalPedido)}  ·  aprobado ${pesos(totalAprobado)}`,
        margen,
        32,
        { width: ancho }
      )
      doc.fillColor('#111111')
      doc.y = 68
    }

    const tablaHead = () => {
      const y = doc.y
      doc.rect(margen, y, ancho, 18).fill('#2D6A4F')
      let x = margen
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8)
      for (const columna of columnas) {
        doc.text(columna.label, x + 4, y + 5, {
          width: columna.w - 8,
          align: columna.align,
        })
        x += columna.w
      }
      doc.fillColor('#111111')
      doc.y = y + 18
    }

    const asegurar = (alto: number) => {
      if (doc.y + alto > doc.page.height - 36) {
        doc.addPage()
        encabezadoPagina()
        tablaHead()
      }
    }

    encabezadoPagina()

    if (!filas.length) {
      doc.font('Helvetica').fontSize(11).text('No hay materiales aprobados en esta vigencia.')
      doc.end()
      return listo
    }

    const grupos = new Map<number, typeof filas>()
    for (const fila of filas) {
      const grupo = grupos.get(fila.solicitudId) ?? []
      grupo.push(fila)
      grupos.set(fila.solicitudId, grupo)
    }

    for (const grupo of grupos.values()) {
      const primero = grupo[0]
      asegurar(46)
      const yGrupo = doc.y
      doc.rect(margen, yGrupo, ancho, 28).fill(verdeClaro)
      doc.fillColor(verde).font('Helvetica-Bold').fontSize(10)
      doc.text(
        `Solicitud ${primero.solicitudId}   ·   Ficha ${primero.numeroFicha}   ·   ${primero.codigoPrograma} ${primero.nombrePrograma}`,
        margen + 8,
        yGrupo + 4,
        { width: ancho - 16 }
      )
      doc.font('Helvetica').fontSize(8).fillColor('#245C45')
      doc.text(
        `Instructor ${primero.instructor}   ·   Aprobó ${primero.coordinador ?? 'sin registro'}`,
        margen + 8,
        yGrupo + 16,
        { width: ancho - 16 }
      )
      doc.y = yGrupo + 28
      doc.fillColor('#111111')
      tablaHead()

      grupo.forEach((fila, indice) => {
        const descripcion = fila.descripcionTecnica?.trim()
        const alto = descripcion ? 30 : 18
        asegurar(alto)
        const y = doc.y
        if (indice % 2 === 1) doc.rect(margen, y, ancho, alto).fill('#F7FAF8')
        const celdas = [
          fila.producto,
          fila.unidadMedida ?? '—',
          String(fila.cantidadSolicitada),
          String(fila.cantidadAprobada),
          pesos(fila.valorUnitario),
          pesos(fila.valorPedido),
          pesos(fila.valorAprobado),
        ]
        let x = margen
        doc.fillColor('#111111').font('Helvetica').fontSize(8)
        celdas.forEach((texto, i) => {
          doc.text(texto, x + 4, y + 4, {
            width: columnas[i].w - 8,
            height: 12,
            align: columnas[i].align,
            ellipsis: true,
          })
          x += columnas[i].w
        })
        if (descripcion) {
          doc.fillColor('#5C6B63').fontSize(7).text(descripcion, margen + 4, y + 16, {
            width: columnas[0].w + columnas[1].w - 8,
            height: 10,
            ellipsis: true,
          })
        }
        doc
          .moveTo(margen, y + alto)
          .lineTo(margen + ancho, y + alto)
          .strokeColor(linea)
          .lineWidth(0.4)
          .stroke()
        doc.y = y + alto
      })
      doc.moveDown(0.6)
    }

    asegurar(22)
    const yTotal = doc.y
    doc.rect(margen, yTotal, ancho, 20).fill(verde)
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(9)
    doc.text(
      `Total vigencia ${vigencia}     pidió ${filas.reduce((s, f) => s + f.cantidadSolicitada, 0)}     aprobado ${filas.reduce((s, f) => s + f.cantidadAprobada, 0)}     valor pedido ${pesos(totalPedido)}     valor aprobado ${pesos(totalAprobado)}`,
      margen + 8,
      yTotal + 6,
      { width: ancho - 16 }
    )

    doc.end()
    return listo
  }
}

function pesos(valor: number | null) {
  if (valor === null) return '—'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(valor)
}
