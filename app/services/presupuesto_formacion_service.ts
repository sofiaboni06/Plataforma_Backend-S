import { Exception } from '@adonisjs/core/exceptions'
import db from '@adonisjs/lucid/services/db'
import ExcelJS from 'exceljs'
import PDFDocument from 'pdfkit'
import Ficha from '#models/ficha'
import LoteVigencia from '#models/lote_vigencia'
import PresupuestoAsignacion from '#models/presupuesto_asignacion'
import PresupuestoAsignacionRed from '#models/presupuesto_asignacion_red'
import RedConocimiento from '#models/red_conocimiento'
import PresupuestoCoordinador from '#models/presupuesto_coordinador'
import ProgramaFormacion from '#models/programa_formacion'
import User from '#models/usuario'
import Vigencia from '#models/vigencia'
import { assertCan, assertCanAny, type AccessScope } from '#services/access_control'
import { rethrowDatabaseError } from '#services/database_error'

type FilaPrograma = {
  nombre: string
  monto: number
  pedido: number
  aprobado: number
  disponible: number
  sePasa: boolean
}

export default class PresupuestoFormacionService {
  async guardarMonto(scope: AccessScope, anio: number, monto: number) {
    assertCan(scope, 'presupuesto.editar')
    if (!scope.asignaPresupuesto) {
      throw new Exception('Solo quien tiene el permiso de presupuesto asigna el de la vigencia', {
        status: 403,
        code: 'E_FORBIDDEN',
      })
    }
    await this.assertVigencia(anio)
    const actual = await this.presupuestoDe(scope.idCformacion, anio)
    const repartido = actual ? await this.sumaAsignaciones(actual.id) : 0
    if (monto < repartido) {
      throw new Exception('El monto no puede ser menor que lo ya repartido a los coordinadores', {
        status: 422,
        code: 'E_PRESUPUESTO',
      })
    }

    try {
      if (actual) {
        actual.monto = monto
        await actual.save()
      } else {
        await PresupuestoCoordinador.create({
          anio,
          idCformacion: scope.idCformacion,
          monto,
        })
      }
      return this.resumenDe(scope.idCformacion, anio)
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo guardar el presupuesto')
    }
  }

  async asignarCoordinador(scope: AccessScope, anio: number, idUsuario: number, monto: number) {
    assertCan(scope, 'presupuesto.editar')
    if (!scope.asignaPresupuesto) {
      throw new Exception('Solo quien tiene el permiso de presupuesto reparte entre coordinadores', {
        status: 403,
        code: 'E_FORBIDDEN',
      })
    }
    await this.assertVigencia(anio)
    const presupuesto = await this.presupuestoDe(scope.idCformacion, anio)
    if (!presupuesto) {
      throw new Exception('Primero asigna el monto del centro en esta vigencia', {
        status: 422,
        code: 'E_PRESUPUESTO',
      })
    }
    await this.assertCoordinadorDelCentro(scope.idCformacion, idUsuario)

    const actual = await PresupuestoAsignacion.query()
      .where('presupuestoId', presupuesto.id)
      .where('idUsuario', idUsuario)
      .first()
    const yaEnAreas = actual ? await this.sumaAreas(actual.id) : 0
    if (monto < yaEnAreas) {
      throw new Exception('No puedes dejar al coordinador por debajo de lo que ya repartió en áreas', {
        status: 422,
        code: 'E_PRESUPUESTO',
      })
    }
    const otros = (await this.sumaAsignaciones(presupuesto.id)) - (actual ? Number(actual.monto) : 0)
    const queda = Number(presupuesto.monto) - otros
    if (monto > queda) {
      throw new Exception(`Supera lo que queda del centro. Quedan ${queda}.`, {
        status: 422,
        code: 'E_PRESUPUESTO',
      })
    }

    try {
      if (monto === 0) {
        if (actual) await actual.delete()
      } else if (actual) {
        actual.monto = monto
        await actual.save()
      } else {
        await PresupuestoAsignacion.create({
          presupuestoId: presupuesto.id,
          idUsuario,
          monto,
        })
      }
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo asignar el presupuesto al coordinador')
    }

    return this.vistaCoordinadores(scope.idCformacion, anio)
  }

  async asignarArea(scope: AccessScope, anio: number, redId: number, monto: number) {
    assertCan(scope, 'solicitud_programa.editar')
    if (scope.asignaPresupuesto) {
      throw new Exception('El reparto por área lo hace el coordinador con su monto', {
        status: 403,
        code: 'E_FORBIDDEN',
      })
    }
    await this.assertVigencia(anio)
    const asignacion = await this.asignacionDe(scope.idCformacion, scope.idUsuario, anio)
    if (!asignacion) {
      throw new Exception('La subdirectora aún no te asignó monto en esta vigencia', {
        status: 422,
        code: 'E_PRESUPUESTO',
      })
    }
    await this.assertRedDelCoordinador(scope, redId)

    const actual = await PresupuestoAsignacionRed.query()
      .where('asignacionId', asignacion.id)
      .where('redId', redId)
      .first()
    const otros = (await this.sumaAreas(asignacion.id)) - (actual ? Number(actual.monto) : 0)
    const queda = Number(asignacion.monto) - otros
    if (monto > queda) {
      throw new Exception(`Supera lo que te queda. Quedan ${queda}.`, {
        status: 422,
        code: 'E_PRESUPUESTO',
      })
    }
    const aprobado = await this.aprobadoRed(anio, redId, scope.idCformacion)
    if (monto < aprobado) {
      throw new Exception('No puedes dejar el área por debajo de lo ya aprobado', {
        status: 422,
        code: 'E_PRESUPUESTO',
      })
    }

    try {
      if (monto === 0) {
        if (actual) await actual.delete()
      } else if (actual) {
        actual.monto = monto
        await actual.save()
      } else {
        await PresupuestoAsignacionRed.create({
          asignacionId: asignacion.id,
          redId,
          monto,
        })
      }
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo asignar el presupuesto al área')
    }

    return this.vistaAreas(scope, anio)
  }

  async resumen(scope: AccessScope, anio: number) {
    assertCanAny(scope, ['solicitud_programa.ver', 'presupuesto.ver', 'lote.ver'])
    if (!scope.asignaPresupuesto) return this.resumenCoordinador(scope, anio)
    const corte = await this.resumenDe(scope.idCformacion, anio)
    return { ...corte, areas: corte.areas ?? [], fichas: [] }
  }

  private async resumenDe(idCformacion: number, anio: number) {
    const presupuesto = await this.presupuestoDe(idCformacion, anio)
    const monto = presupuesto ? Number(presupuesto.monto) : 0
    const coordinadores = await this.filasCoordinadores(idCformacion, presupuesto?.id ?? null)
    const repartido = coordinadores.reduce((suma, fila) => suma + fila.monto, 0)
    const porLote = await this.gastoPorLote(idCformacion, anio)

    return {
      anio,
      idCformacion,
      monto,
      repartido,
      sinRepartir: monto - repartido,
      pedido: 0,
      aprobado: 0,
      disponible: monto,
      sePasa: false,
      programas: [] as FilaPrograma[],
      coordinadores,
      areas: [],
      fichas: [],
      porLote,
    }
  }

  async coordinadores(scope: AccessScope, anio: number) {
    if (!scope.asignaPresupuesto) {
      throw new Exception('Solo la subdirectora consulta los coordinadores del presupuesto', {
        status: 403,
        code: 'E_FORBIDDEN',
      })
    }
    return this.vistaCoordinadores(scope.idCformacion, anio)
  }

  private async vistaCoordinadores(idCformacion: number, anio: number) {
    const presupuesto = await this.presupuestoDe(idCformacion, anio)
    const monto = presupuesto ? Number(presupuesto.monto) : 0
    const coordinadores = await this.filasCoordinadores(idCformacion, presupuesto?.id ?? null)
    const repartido = coordinadores.reduce((suma, fila) => suma + fila.monto, 0)
    return {
      anio,
      idCformacion,
      monto,
      repartido,
      sinRepartir: monto - repartido,
      coordinadores,
    }
  }

  private async filasCoordinadores(idCformacion: number, presupuestoId: number | null) {
    const usuarios = await User.query()
      .where('estado', true)
      .where('idCformacion', idCformacion)
      .whereHas('perfil', (perfil) => {
        perfil.where('estado', true).whereILike('nombre', 'coordinador%')
      })
      .orderBy('nombres', 'asc')
    const asignaciones = presupuestoId
      ? await PresupuestoAsignacion.query().where('presupuestoId', presupuestoId)
      : []
    const porUsuario = new Map(asignaciones.map((fila) => [fila.idUsuario, Number(fila.monto)]))
    return usuarios.map((usuario) => ({
      id: usuario.id,
      fullName: `${usuario.nombres} ${usuario.apellidos}`.trim(),
      monto: porUsuario.get(usuario.id) ?? 0,
    }))
  }

  private async assertCoordinadorDelCentro(idCformacion: number, idUsuario: number) {
    const usuario = await User.query()
      .where('id', idUsuario)
      .where('estado', true)
      .where('idCformacion', idCformacion)
      .whereHas('perfil', (perfil) => {
        perfil.where('estado', true).whereILike('nombre', 'coordinador%')
      })
      .first()
    if (!usuario) {
      throw new Exception('Ese coordinador no pertenece a tu centro', {
        status: 422,
        code: 'E_PRESUPUESTO',
      })
    }
  }

  private async resumenCoordinador(scope: AccessScope, anio: number) {
    const vista = await this.vistaAreas(scope, anio)
    const porLote = await this.gastoPorLote(scope.idCformacion, anio)
    return {
      anio,
      idCformacion: scope.idCformacion,
      monto: vista.monto,
      repartido: vista.repartido,
      sinRepartir: vista.sinRepartir,
      pedido: 0,
      aprobado: 0,
      disponible: vista.sinRepartir,
      sePasa: vista.sinRepartir < 0,
      programas: [] as FilaPrograma[],
      coordinadores: [],
      areas: vista.areas,
      fichas: [],
      porLote,
    }
  }

  private async vistaAreas(scope: AccessScope, anio: number) {
    const asignacion = await this.asignacionDe(scope.idCformacion, scope.idUsuario, anio)
    const monto = asignacion ? Number(asignacion.monto) : 0
    const areas = await this.filasAreas(scope, asignacion?.id ?? null)
    const repartido = areas.reduce((suma, fila) => suma + fila.monto, 0)
    return {
      anio,
      monto,
      repartido,
      sinRepartir: monto - repartido,
      areas,
    }
  }

  private async filasAreas(scope: AccessScope, asignacionId: number | null) {
    const ids = await this.idsRedesDelCoordinador(scope.idUsuario)
    const redes = await RedConocimiento.query()
      .whereIn('id', ids.length ? ids : [0])
      .orderBy('nombre', 'asc')
    const montos = asignacionId
      ? await PresupuestoAsignacionRed.query().where('asignacionId', asignacionId)
      : []
    const porRed = new Map(montos.map((fila) => [fila.redId, Number(fila.monto)]))
    return redes.map((red) => ({
      id: red.id,
      nombre: red.nombre,
      codigo: null,
      monto: porRed.get(red.id) ?? 0,
    }))
  }

  private async asignacionDe(idCformacion: number, idUsuario: number, anio: number) {
    const presupuesto = await this.presupuestoDe(idCformacion, anio)
    if (!presupuesto) return null
    return PresupuestoAsignacion.query()
      .where('presupuestoId', presupuesto.id)
      .where('idUsuario', idUsuario)
      .first()
  }

  private async sumaAreas(asignacionId: number) {
    const filas = await PresupuestoAsignacionRed.query().where('asignacionId', asignacionId)
    return filas.reduce((suma, fila) => suma + Number(fila.monto), 0)
  }

  private async sumaAsignaciones(presupuestoId: number) {
    const filas = await PresupuestoAsignacion.query().where('presupuestoId', presupuestoId)
    return filas.reduce((suma, fila) => suma + Number(fila.monto), 0)
  }

  async alertas(scope: AccessScope, anio: number) {
    assertCan(scope, 'alerta_formacion.ver')
    const ids = scope.asignaPresupuesto
      ? await this.idsRedesConPedido(scope.idCformacion, anio)
      : await this.idsRedesDelCoordinador(scope.idUsuario)
    const redes = await RedConocimiento.query()
      .whereIn('id', ids.length ? ids : [0])
      .orderBy('nombre', 'asc')
    const filas = []
    for (const red of redes) {
      const asignado = await this.montoRed(scope.idCformacion, anio, red.id)
      const pedido = await this.pedidoRed(anio, red.id, scope.idCformacion)
      if (pedido <= 0) continue
      const tipo = pedido > asignado ? 'se_pasa' : pedido / (asignado || 1) >= 0.8 ? 'cerca' : null
      if (!tipo) continue
      filas.push({
        programaId: red.id,
        nombre: red.nombre,
        codigo: null,
        anio,
        asignado,
        pedido,
        tipo,
      })
    }
    return filas
  }

  async lotes(scope: AccessScope, anio: number) {
    assertCanAny(scope, ['lote.ver', 'lista_maestra.ver', 'solicitud_programa.ver'])
    return LoteVigencia.query()
      .where('anio', anio)
      .where('idCformacion', scope.idCformacion)
      .where('estado', true)
      .orderBy('nombre', 'asc')
  }

  async crearLote(scope: AccessScope, anio: number, nombre: string) {
    assertCan(scope, 'lote.crear')
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
    const detalle = await this.detalleAprobado(scope.idCformacion, anio, filtros)
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
    hoja.addRow(['Pedido', corte.pedido])
    hoja.addRow(['Aprobado', corte.aprobado])
    hoja.addRow(['Disponible', corte.disponible])
    hoja.addRow([])
    hoja.addRow(['Coordinador', 'Asignado'])
    for (const coordinador of corte.coordinadores) {
      hoja.addRow([coordinador.fullName, coordinador.monto])
    }
    hoja.addRow([])
    hoja.addRow(['Área', 'Asignado', 'Pedido', 'Aprobado', 'Disponible', 'Se pasa'])
    for (const area of corte.programas) {
      hoja.addRow([
        area.nombre,
        area.monto,
        area.pedido,
        area.aprobado,
        area.disponible,
        area.sePasa ? 'sí' : 'no',
      ])
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
    doc.text(`Pedido: ${corte.pedido}  Aprobado: ${corte.aprobado}  Disponible: ${corte.disponible}`)
    doc.moveDown()
    doc.text('Coordinadores')
    for (const coordinador of corte.coordinadores) {
      doc.text(`${coordinador.fullName}: ${coordinador.monto}`)
    }
    doc.moveDown()
    doc.text('Áreas')
    for (const area of corte.programas) {
      doc.text(
        `${area.nombre}: asignado ${area.monto}, pedido ${area.pedido}, aprobado ${area.aprobado}, queda ${area.disponible}`
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
    idCformacion: number
    anio: number
    fichaId: number
    costoNuevo: number
    producto: string
  }) {
    if (input.costoNuevo <= 0) return
    const ficha = await Ficha.query()
      .where('id', input.fichaId)
      .where('centroFormacionId', input.idCformacion)
      .first()
    if (!ficha) {
      throw new Exception('La ficha no pertenece a este centro', {
        status: 422,
        code: 'E_PRESUPUESTO',
      })
    }

    const especial = await this.especialDePrograma(input.idCformacion, input.anio, ficha.programaId)
    if (especial) {
      const redId = await this.redIdDe(ficha.programaId)
      const asignado = redId ? await this.montoRedEspecial(especial.id, redId) : 0
      if (!asignado) {
        throw new Exception('El coordinador todavía no distribuye esta área en la vigencia especial', {
          status: 422,
          code: 'E_PRESUPUESTO',
        })
      }
      const aprobado = redId ? await this.aprobadoEspecialRed(especial.id, redId) : 0
      const queda = asignado - aprobado
      if (input.costoNuevo > queda) {
        throw new Exception(
          `La vigencia especial se pasa del monto con ${input.producto}. Quedan ${queda}.`,
          { status: 422, code: 'E_PRESUPUESTO' }
        )
      }
      return
    }

    const fila = await this.areaAsignada(input.idCformacion, input.anio, ficha.programaId)
    if (!fila) {
      throw new Exception('Asigna presupuesto a esta área antes de aprobar consumo', {
        status: 422,
        code: 'E_PRESUPUESTO',
      })
    }

    const redId = await this.redIdDe(ficha.programaId)
    const aprobado = redId
      ? await this.aprobadoRed(input.anio, redId, input.idCformacion)
      : 0
    const queda = Number(fila.monto) - aprobado
    if (input.costoNuevo > queda) {
      throw new Exception(
        `El área se pasa del presupuesto con ${input.producto}. Quedan ${queda}. Ajusta las cantidades.`,
        { status: 422, code: 'E_PRESUPUESTO' }
      )
    }
  }

  async cortesFicha(
    scope: AccessScope,
    filas: Array<{ fichaId: number; vigencia: number }>
  ) {
    const claves = [...new Set(filas.map((fila) => `${fila.vigencia}:${fila.fichaId}`))]
    const cortes = new Map<string, {
      asignado: number
      pedido: number
      aprobado: number
      queda: number
      sePasa: boolean
    }>()
    for (const clave of claves) {
      const [anio, fichaId] = clave.split(':').map(Number)
      const ficha = await Ficha.query()
        .where('id', fichaId)
        .where('centroFormacionId', scope.idCformacion)
        .first()
      const programaId = ficha?.programaId
      const especial = programaId
        ? await this.especialDePrograma(scope.idCformacion, anio, programaId)
        : null
      if (especial) {
        const aprobado = await this.aprobadoEspecial(especial.id)
        const pedido = await this.pedidoEspecial(especial.id)
        cortes.set(clave, {
          asignado: Number(especial.monto),
          pedido,
          aprobado,
          queda: Number(especial.monto) - pedido,
          sePasa: pedido > Number(especial.monto),
        })
        continue
      }
      const area = programaId
        ? await this.areaAsignada(scope.idCformacion, anio, programaId)
        : null
      const asignado = area ? Number(area.monto) : 0
      const redId = programaId ? await this.redIdDe(programaId) : null
      const pedido = redId ? await this.pedidoRed(anio, redId, scope.idCformacion) : 0
      const aprobado = redId ? await this.aprobadoRed(anio, redId, scope.idCformacion) : 0
      cortes.set(clave, {
        asignado,
        pedido,
        aprobado,
        queda: asignado - pedido,
        sePasa: pedido > asignado,
      })
    }
    return cortes
  }

  private async presupuestoDe(idCformacion: number, anio: number) {
    return PresupuestoCoordinador.query()
      .where('idCformacion', idCformacion)
      .where('anio', anio)
      .first()
  }

  private async assertVigencia(anio: number) {
    const vigencia = await Vigencia.find(anio)
    if (!vigencia) {
      throw new Exception('La vigencia no existe', { status: 404, code: 'E_ROW_NOT_FOUND' })
    }
  }

  private async areaAsignada(idCformacion: number, anio: number, programaId: number) {
    const redId = await this.redIdDe(programaId)
    if (!redId) return null
    const presupuesto = await this.presupuestoDe(idCformacion, anio)
    if (!presupuesto) return null
    const filas = await PresupuestoAsignacionRed.query()
      .where('redId', redId)
      .whereIn(
        'asignacionId',
        PresupuestoAsignacion.query().where('presupuestoId', presupuesto.id).select('id')
      )
    if (!filas.length) return null
    return {
      monto: filas.reduce((suma, fila) => suma + Number(fila.monto), 0),
    }
  }

  private async redIdDe(programaId: number) {
    const programa = await ProgramaFormacion.find(programaId)
    return programa?.idRedConocimiento ?? null
  }

  private async idsRedesDelCoordinador(idUsuario: number) {
    const filas = await db
      .from('usuario_red_conocimiento')
      .where('id_usuario', idUsuario)
      .where('estado', true)
      .distinct('id_red_conocimiento')
    return filas.map((fila) => Number(fila.id_red_conocimiento))
  }

  private async idsRedesConPedido(idCformacion: number, anio: number) {
    const filas = await db
      .from('solicitud_material_programa as s')
      .join('ficha as f', 'f.id_ficha', 's.id_ficha')
      .join('programa_formacion as p', 'p.id_programa_formacion', 's.id_programa_formacion')
      .where('s.vigencia', anio)
      .where('f.centro_formacion_id', idCformacion)
      .whereNot('s.estado', 'anulada')
      .distinct('p.id_red_conocimiento')
    return filas.map((fila) => Number(fila.id_red_conocimiento))
  }

  private async assertRedDelCoordinador(scope: AccessScope, redId: number) {
    const ids = await this.idsRedesDelCoordinador(scope.idUsuario)
    if (!ids.includes(redId)) {
      throw new Exception('Esa área no está en tus redes', {
        status: 422,
        code: 'E_PRESUPUESTO',
      })
    }
  }

  private async montoRed(idCformacion: number, anio: number, redId: number) {
    const fila = await this.areaPorRed(idCformacion, anio, redId)
    return fila ? Number(fila.monto) : 0
  }

  private async areaPorRed(idCformacion: number, anio: number, redId: number) {
    const presupuesto = await this.presupuestoDe(idCformacion, anio)
    if (!presupuesto) return null
    const filas = await PresupuestoAsignacionRed.query()
      .where('redId', redId)
      .whereIn(
        'asignacionId',
        PresupuestoAsignacion.query().where('presupuestoId', presupuesto.id).select('id')
      )
    if (!filas.length) return null
    return {
      monto: filas.reduce((suma, fila) => suma + Number(fila.monto), 0),
    }
  }

  private async pedidoRed(anio: number, redId: number, idCformacion: number) {
    const fila = await db
      .from('detalle_solicitud_programa as d')
      .join('solicitud_material_programa as s', 's.id_solicitud_programa', 'd.id_solicitud_programa')
      .join('lista_maestra_material as l', 'l.id_lista_maestra', 'd.id_lista_maestra')
      .join('ficha as f', 'f.id_ficha', 's.id_ficha')
      .join('programa_formacion as p', 'p.id_programa_formacion', 's.id_programa_formacion')
      .where('p.id_red_conocimiento', redId)
      .where('s.vigencia', anio)
      .where('f.centro_formacion_id', idCformacion)
      .whereNot('s.estado', 'anulada')
      .where('l.caracter', 'consumo')
      .whereRaw(this.fueraDeVigenciaEspecial())
      .sum({ total: db.raw('d.cantidad_solicitada * COALESCE(l.valor_unitario, 0)') })
      .first()
    return Number(fila?.total ?? 0)
  }

  private async aprobadoRed(anio: number, redId: number, idCformacion: number) {
    const fila = await db
      .from('detalle_solicitud_programa as d')
      .join('solicitud_material_programa as s', 's.id_solicitud_programa', 'd.id_solicitud_programa')
      .join('lista_maestra_material as l', 'l.id_lista_maestra', 'd.id_lista_maestra')
      .join('ficha as f', 'f.id_ficha', 's.id_ficha')
      .join('programa_formacion as p', 'p.id_programa_formacion', 's.id_programa_formacion')
      .where('p.id_red_conocimiento', redId)
      .where('s.vigencia', anio)
      .where('f.centro_formacion_id', idCformacion)
      .whereNot('s.estado', 'anulada')
      .where('l.caracter', 'consumo')
      .where('d.cantidad_aprobada', '>', 0)
      .whereRaw(this.fueraDeVigenciaEspecial())
      .sum({ total: db.raw('d.cantidad_aprobada * l.valor_unitario') })
      .first()
    return Number(fila?.total ?? 0)
  }

  private fueraDeVigenciaEspecial() {
    return `NOT EXISTS (
      SELECT 1
      FROM vigencia_especial_programa ep
      JOIN vigencia_especial ve ON ve.id_vigencia_especial = ep.id_vigencia_especial
      WHERE ep.id_programa_formacion = s.id_programa_formacion
        AND ve.anio = s.vigencia
        AND ve.id_cformacion = f.centro_formacion_id
        AND ve.activa = TRUE
    )`
  }

  private async especialDePrograma(idCformacion: number, anio: number, programaId: number) {
    const fila = await db
      .from('vigencia_especial as ve')
      .join(
        'vigencia_especial_programa as ep',
        'ep.id_vigencia_especial',
        've.id_vigencia_especial'
      )
      .where('ve.anio', anio)
      .where('ve.id_cformacion', idCformacion)
      .where('ve.activa', true)
      .where('ep.id_programa_formacion', programaId)
      .select('ve.id_vigencia_especial as id', 've.monto')
      .first()
    if (!fila) return null
    return { id: Number(fila.id), monto: Number(fila.monto) }
  }

  private async montoRedEspecial(vigenciaEspecialId: number, redId: number) {
    const fila = await db
      .from('vigencia_especial_asignacion as a')
      .join(
        'vigencia_especial_asignacion_red as ar',
        'ar.id_asignacion_especial',
        'a.id_asignacion_especial'
      )
      .where('a.id_vigencia_especial', vigenciaEspecialId)
      .where('ar.id_red_conocimiento', redId)
      .sum({ total: 'ar.monto' })
      .first()
    return Number(fila?.total ?? 0)
  }

  private async aprobadoEspecialRed(vigenciaEspecialId: number, redId: number) {
    const fila = await db
      .from('detalle_solicitud_programa as d')
      .join('solicitud_material_programa as s', 's.id_solicitud_programa', 'd.id_solicitud_programa')
      .join('lista_maestra_material as l', 'l.id_lista_maestra', 'd.id_lista_maestra')
      .join('programa_formacion as p', 'p.id_programa_formacion', 's.id_programa_formacion')
      .join(
        'vigencia_especial_programa as ep',
        'ep.id_programa_formacion',
        's.id_programa_formacion'
      )
      .where('ep.id_vigencia_especial', vigenciaEspecialId)
      .where('p.id_red_conocimiento', redId)
      .whereNot('s.estado', 'anulada')
      .where('l.caracter', 'consumo')
      .where('d.cantidad_aprobada', '>', 0)
      .sum({ total: db.raw('d.cantidad_aprobada * l.valor_unitario') })
      .first()
    return Number(fila?.total ?? 0)
  }

  private async aprobadoEspecial(vigenciaEspecialId: number) {
    return this.gastoEspecial(vigenciaEspecialId, 'd.cantidad_aprobada * l.valor_unitario', true)
  }

  private async pedidoEspecial(vigenciaEspecialId: number) {
    return this.gastoEspecial(
      vigenciaEspecialId,
      'd.cantidad_solicitada * COALESCE(l.valor_unitario, 0)',
      false
    )
  }

  private async gastoEspecial(vigenciaEspecialId: number, expresion: string, soloAprobado: boolean) {
    const consulta = db
      .from('detalle_solicitud_programa as d')
      .join('solicitud_material_programa as s', 's.id_solicitud_programa', 'd.id_solicitud_programa')
      .join('lista_maestra_material as l', 'l.id_lista_maestra', 'd.id_lista_maestra')
      .join(
        'vigencia_especial_programa as ep',
        'ep.id_programa_formacion',
        's.id_programa_formacion'
      )
      .where('ep.id_vigencia_especial', vigenciaEspecialId)
      .whereNot('s.estado', 'anulada')
      .where('l.caracter', 'consumo')
    if (soloAprobado) consulta.where('d.cantidad_aprobada', '>', 0)
    const fila = await consulta.sum({ total: db.raw(expresion) }).first()
    return Number(fila?.total ?? 0)
  }

  private async gastoPorLote(idCformacion: number, anio: number) {
    const filas = await db
      .from('detalle_solicitud_programa as d')
      .join('solicitud_material_programa as s', 's.id_solicitud_programa', 'd.id_solicitud_programa')
      .join('lista_maestra_material as l', 'l.id_lista_maestra', 'd.id_lista_maestra')
      .join('ficha as f', 'f.id_ficha', 's.id_ficha')
      .leftJoin('lote_vigencia as lote', 'lote.id_lote', 'l.id_lote')
      .where('s.vigencia', anio)
      .where('f.centro_formacion_id', idCformacion)
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
    idCformacion: number,
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
      .where('f.centro_formacion_id', idCformacion)
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
