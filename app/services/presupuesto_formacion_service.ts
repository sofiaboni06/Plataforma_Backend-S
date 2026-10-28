import { Exception } from '@adonisjs/core/exceptions'
import db from '@adonisjs/lucid/services/db'
import ExcelJS from 'exceljs'
import PDFDocument from 'pdfkit'
import Ficha from '#models/ficha'
import LoteVigencia from '#models/lote_vigencia'
import PresupuestoCoordinador from '#models/presupuesto_coordinador'
import PresupuestoFicha from '#models/presupuesto_ficha'
import Vigencia from '#models/vigencia'
import { assertCan, type AccessScope } from '#services/access_control'
import { rethrowDatabaseError } from '#services/database_error'

type Reparto = { fichaId: number; monto: number }

export default class PresupuestoFormacionService {
  async guardarMonto(scope: AccessScope, anio: number, monto: number) {
    assertCan(scope, 'solicitud_programa.editar')
    await this.assertVigencia(anio)
    const actual = await this.presupuestoDe(scope.idUsuario, anio)
    const repartido = actual ? await this.sumaFichas(actual.id) : 0
    if (monto < repartido) {
      throw new Exception('El monto no puede ser menor que lo ya repartido en las fichas', {
        status: 422,
        code: 'E_PRESUPUESTO',
      })
    }

    try {
      if (actual) {
        actual.monto = monto
        await actual.save()
        return this.resumen(scope, anio)
      }
      await PresupuestoCoordinador.create({ anio, idUsuario: scope.idUsuario, monto })
      return this.resumen(scope, anio)
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo guardar el presupuesto')
    }
  }

  async repartir(scope: AccessScope, anio: number, fichas: Reparto[]) {
    assertCan(scope, 'solicitud_programa.editar')
    const presupuesto = await this.presupuestoDe(scope.idUsuario, anio)
    if (!presupuesto) {
      throw new Exception('Primero registra el monto de la vigencia', {
        status: 422,
        code: 'E_PRESUPUESTO',
      })
    }

    const unicas = new Map<number, number>()
    for (const fila of fichas) unicas.set(fila.fichaId, fila.monto)
    const total = [...unicas.values()].reduce((suma, valor) => suma + valor, 0)
    if (total > Number(presupuesto.monto)) {
      throw new Exception('La suma de las fichas supera el monto de la vigencia', {
        status: 422,
        code: 'E_PRESUPUESTO',
      })
    }

    for (const [fichaId, monto] of unicas) {
      await this.assertFichaDelCoordinador(scope, fichaId)
      const gastado = await this.gastadoFicha(anio, fichaId)
      if (monto < gastado) {
        throw new Exception('No puedes dejar una ficha por debajo de lo ya aprobado', {
          status: 422,
          code: 'E_PRESUPUESTO',
        })
      }
    }

    const trx = await db.transaction()
    try {
      await PresupuestoFicha.query({ client: trx }).where('presupuestoId', presupuesto.id).delete()
      if (unicas.size) {
        await PresupuestoFicha.createMany(
          [...unicas.entries()].map(([fichaId, monto]) => ({
            presupuestoId: presupuesto.id,
            fichaId,
            monto,
          })),
          { client: trx }
        )
      }
      await trx.commit()
    } catch (error) {
      await trx.rollback()
      rethrowDatabaseError(error, 'No se pudo repartir el presupuesto')
    }

    return this.resumen(scope, anio)
  }

  async resumen(scope: AccessScope, anio: number) {
    assertCan(scope, 'solicitud_programa.ver')
    const presupuesto = await this.presupuestoDe(scope.idUsuario, anio)
    const asignaciones = presupuesto
      ? await PresupuestoFicha.query().where('presupuestoId', presupuesto.id).preload('ficha')
      : []

    const fichas = []
    for (const fila of asignaciones) {
      const gastado = await this.gastadoFicha(anio, fila.fichaId, scope.idUsuario)
      fichas.push({
        fichaId: fila.fichaId,
        numeroFicha: fila.ficha?.numeroFicha ?? String(fila.fichaId),
        monto: Number(fila.monto),
        gastado,
        disponible: Number(fila.monto) - gastado,
      })
    }

    const monto = presupuesto ? Number(presupuesto.monto) : 0
    const repartido = fichas.reduce((suma, fila) => suma + fila.monto, 0)
    const gastado = fichas.reduce((suma, fila) => suma + fila.gastado, 0)
    const porLote = await this.gastoPorLote(scope.idUsuario, anio)

    return {
      anio,
      monto,
      repartido,
      sinRepartir: monto - repartido,
      gastado,
      disponible: monto - gastado,
      fichas,
      porLote,
    }
  }

  async lotes(scope: AccessScope, anio: number) {
    assertCan(scope, 'solicitud_programa.ver')
    return LoteVigencia.query()
      .where('anio', anio)
      .where('idCformacion', scope.idCformacion)
      .where('estado', true)
      .orderBy('nombre', 'asc')
  }

  async crearLote(scope: AccessScope, anio: number, nombre: string) {
    assertCan(scope, 'solicitud_programa.editar')
    await this.assertVigencia(anio)
    try {
      return await LoteVigencia.create({
        anio,
        idCformacion: scope.idCformacion,
        nombre: nombre.trim(),
        estado: true,
      })
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo crear el lote')
    }
  }

  async reporte(scope: AccessScope, anio: number, filtros: { fichaId?: number; loteId?: number }) {
    const corte = await this.resumen(scope, anio)
    const detalle = await this.detalleAprobado(scope.idUsuario, anio, filtros)
    return { corte, detalle }
  }

  async excel(scope: AccessScope, anio: number, filtros: { fichaId?: number; loteId?: number }) {
    const { corte, detalle } = await this.reporte(scope, anio, filtros)
    const libro = new ExcelJS.Workbook()
    const hoja = libro.addWorksheet('Presupuesto')
    hoja.addRow(['Vigencia', corte.anio])
    hoja.addRow(['Monto', corte.monto])
    hoja.addRow(['Repartido', corte.repartido])
    hoja.addRow(['Sin repartir', corte.sinRepartir])
    hoja.addRow(['Aprobado', corte.gastado])
    hoja.addRow(['Disponible', corte.disponible])
    hoja.addRow([])
    hoja.addRow(['Ficha', 'Asignado', 'Aprobado', 'Disponible'])
    for (const ficha of corte.fichas) {
      hoja.addRow([ficha.numeroFicha, ficha.monto, ficha.gastado, ficha.disponible])
    }
    hoja.addRow([])
    hoja.addRow(['Lote', 'Aprobado'])
    for (const lote of corte.porLote) hoja.addRow([lote.nombre, lote.gastado])
    hoja.addRow([])
    hoja.addRow(['Ficha', 'Producto', 'Lote', 'Cantidad', 'Valor unitario', 'Total'])
    for (const linea of detalle) {
      hoja.addRow([
        linea.numeroFicha,
        linea.producto,
        linea.lote,
        linea.cantidad,
        linea.valorUnitario,
        linea.total,
      ])
    }
    return Buffer.from(await libro.xlsx.writeBuffer())
  }

  async pdf(scope: AccessScope, anio: number, filtros: { fichaId?: number; loteId?: number }) {
    const { corte, detalle } = await this.reporte(scope, anio, filtros)
    const doc = new PDFDocument({ margin: 40, size: 'A4' })
    const chunks: Buffer[] = []
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    const listo = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)))
    })

    doc.fontSize(16).text(`Presupuesto ${corte.anio}`)
    doc.moveDown(0.5)
    doc.fontSize(11)
    doc.text(`Monto: ${corte.monto}`)
    doc.text(`Repartido: ${corte.repartido}  Sin repartir: ${corte.sinRepartir}`)
    doc.text(`Aprobado: ${corte.gastado}  Disponible: ${corte.disponible}`)
    doc.moveDown()
    doc.text('Fichas')
    for (const ficha of corte.fichas) {
      doc.text(
        `${ficha.numeroFicha}: asignado ${ficha.monto}, aprobado ${ficha.gastado}, queda ${ficha.disponible}`
      )
    }
    doc.moveDown()
    doc.text('Por lote')
    for (const lote of corte.porLote) doc.text(`${lote.nombre}: ${lote.gastado}`)
    doc.moveDown()
    doc.text('Materiales aprobados')
    for (const linea of detalle) {
      doc.text(
        `${linea.numeroFicha} · ${linea.producto} · ${linea.lote ?? 'sin lote'} · ${linea.cantidad} x ${linea.valorUnitario} = ${linea.total}`
      )
    }
    doc.end()
    return listo
  }

  /**
   * Solo consumo. Lo llama la decisión del coordinador antes de guardar.
   */
  async assertCabe(input: {
    idUsuario: number
    anio: number
    fichaId: number
    costoNuevo: number
    producto: string
  }) {
    if (input.costoNuevo <= 0) return
    const presupuesto = await this.presupuestoDe(input.idUsuario, input.anio)
    const asignacion = presupuesto
      ? await PresupuestoFicha.query()
          .where('presupuestoId', presupuesto.id)
          .where('fichaId', input.fichaId)
          .first()
      : null

    if (!asignacion) {
      throw new Exception('Asigna presupuesto a esta ficha antes de aprobar consumo', {
        status: 422,
        code: 'E_PRESUPUESTO',
      })
    }

    const gastado = await this.gastadoFicha(input.anio, input.fichaId, input.idUsuario)
    const queda = Number(asignacion.monto) - gastado
    if (input.costoNuevo > queda) {
      throw new Exception(
        `El presupuesto de la ficha no alcanza para ${input.producto}. Quedan ${queda}.`,
        { status: 422, code: 'E_PRESUPUESTO' }
      )
    }
  }

  private async presupuestoDe(idUsuario: number, anio: number) {
    return PresupuestoCoordinador.query().where('idUsuario', idUsuario).where('anio', anio).first()
  }

  private async sumaFichas(presupuestoId: number) {
    const filas = await PresupuestoFicha.query().where('presupuestoId', presupuestoId)
    return filas.reduce((suma, fila) => suma + Number(fila.monto), 0)
  }

  private async assertVigencia(anio: number) {
    const vigencia = await Vigencia.find(anio)
    if (!vigencia) {
      throw new Exception('La vigencia no existe', { status: 404, code: 'E_ROW_NOT_FOUND' })
    }
  }

  private async assertFichaDelCoordinador(scope: AccessScope, fichaId: number) {
    const ficha = await Ficha.query().where('id', fichaId).preload('programa').firstOrFail()
    if (ficha.centroFormacionId !== scope.idCformacion && !scope.isAdmin) {
      throw new Exception('La ficha no es de tu centro', { status: 403, code: 'E_FORBIDDEN' })
    }
  }

  private async gastadoFicha(anio: number, fichaId: number, idUsuario?: number) {
    const consulta = db
      .from('detalle_solicitud_programa as d')
      .join('solicitud_material_programa as s', 's.id_solicitud_programa', 'd.id_solicitud_programa')
      .join('lista_maestra_material as l', 'l.id_lista_maestra', 'd.id_lista_maestra')
      .where('s.id_ficha', fichaId)
      .where('s.vigencia', anio)
      .whereNot('s.estado', 'anulada')
      .where('l.caracter', 'consumo')
      .where('d.cantidad_aprobada', '>', 0)

    if (idUsuario) consulta.where('s.id_usuario_aprobador', idUsuario)

    const fila = await consulta.sum({ total: db.raw('d.cantidad_aprobada * l.valor_unitario') }).first()
    return Number(fila?.total ?? 0)
  }

  private async gastoPorLote(idUsuario: number, anio: number) {
    const filas = await db
      .from('detalle_solicitud_programa as d')
      .join('solicitud_material_programa as s', 's.id_solicitud_programa', 'd.id_solicitud_programa')
      .join('lista_maestra_material as l', 'l.id_lista_maestra', 'd.id_lista_maestra')
      .leftJoin('lote_vigencia as lote', 'lote.id_lote', 'l.id_lote')
      .where('s.vigencia', anio)
      .where('s.id_usuario_aprobador', idUsuario)
      .whereNot('s.estado', 'anulada')
      .where('l.caracter', 'consumo')
      .groupBy('lote.nombre')
      .select('lote.nombre as nombre')
      .sum({ gastado: db.raw('d.cantidad_aprobada * l.valor_unitario') })

    return filas.map((fila) => ({
      nombre: (fila.nombre as string | null) ?? 'Sin lote',
      gastado: Number(fila.gastado ?? 0),
    }))
  }

  private async detalleAprobado(
    idUsuario: number,
    anio: number,
    filtros: { fichaId?: number; loteId?: number }
  ) {
    const consulta = db
      .from('detalle_solicitud_programa as d')
      .join('solicitud_material_programa as s', 's.id_solicitud_programa', 'd.id_solicitud_programa')
      .join('lista_maestra_material as l', 'l.id_lista_maestra', 'd.id_lista_maestra')
      .join('ficha as f', 'f.id_ficha', 's.id_ficha')
      .leftJoin('lote_vigencia as lote', 'lote.id_lote', 'l.id_lote')
      .where('s.vigencia', anio)
      .where('s.id_usuario_aprobador', idUsuario)
      .whereNot('s.estado', 'anulada')
      .where('l.caracter', 'consumo')
      .where('d.cantidad_aprobada', '>', 0)
      .select(
        'f.numero_ficha as numeroFicha',
        'l.producto as producto',
        'lote.nombre as lote',
        'd.cantidad_aprobada as cantidad',
        'l.valor_unitario as valorUnitario'
      )
      .orderBy('f.numero_ficha', 'asc')

    if (filtros.fichaId) consulta.where('s.id_ficha', filtros.fichaId)
    if (filtros.loteId) consulta.where('l.id_lote', filtros.loteId)

    const filas = await consulta
    return filas.map((fila) => {
      const cantidad = Number(fila.cantidad ?? 0)
      const valorUnitario = Number(fila.valorUnitario ?? 0)
      return {
        numeroFicha: String(fila.numeroFicha),
        producto: String(fila.producto),
        lote: (fila.lote as string | null) ?? null,
        cantidad,
        valorUnitario,
        total: cantidad * valorUnitario,
      }
    })
  }
}
