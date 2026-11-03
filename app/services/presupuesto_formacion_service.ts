import { Exception } from '@adonisjs/core/exceptions'
import db from '@adonisjs/lucid/services/db'
import ExcelJS from 'exceljs'
import PDFDocument from 'pdfkit'
import Ficha from '#models/ficha'
import LoteVigencia from '#models/lote_vigencia'
import PresupuestoAsignacion from '#models/presupuesto_asignacion'
import PresupuestoAsignacionArea from '#models/presupuesto_asignacion_area'
import PresupuestoAsignacionFicha from '#models/presupuesto_asignacion_ficha'
import PresupuestoCoordinador from '#models/presupuesto_coordinador'
import PresupuestoPrograma from '#models/presupuesto_programa'
import ProgramaFormacion from '#models/programa_formacion'
import User from '#models/usuario'
import Vigencia from '#models/vigencia'
import { assertCan, type AccessScope } from '#services/access_control'
import { rethrowDatabaseError } from '#services/database_error'

type Reparto = { programaId: number; monto: number }

export default class PresupuestoFormacionService {
  async guardarMonto(scope: AccessScope, anio: number, monto: number) {
    assertCan(scope, 'solicitud_programa.editar')
    if (!scope.asignaPresupuesto) {
      throw new Exception('Solo la subdirectora asigna el presupuesto de la vigencia', {
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

  async repartir(scope: AccessScope, anio: number, programas: Reparto[]) {
    assertCan(scope, 'solicitud_programa.editar')
    const presupuesto = await this.presupuestoDe(scope.idCformacion, anio)
    if (!presupuesto) {
      throw new Exception('La subdirectora aún no asignó el monto del centro en esta vigencia', {
        status: 422,
        code: 'E_PRESUPUESTO',
      })
    }

    const unicas = new Map<number, number>()
    for (const fila of programas) unicas.set(fila.programaId, fila.monto)
    const total = [...unicas.values()].reduce((suma, valor) => suma + valor, 0)
    if (total > Number(presupuesto.monto)) {
      throw new Exception('La suma de las áreas supera el monto de la vigencia', {
        status: 422,
        code: 'E_PRESUPUESTO',
      })
    }

    for (const [programaId, monto] of unicas) {
      await this.assertProgramaDelCoordinador(scope, programaId)
      const aprobado = await this.aprobadoPrograma(anio, programaId, scope.idCformacion)
      if (monto < aprobado) {
        throw new Exception('No puedes dejar un área por debajo de lo ya aprobado', {
          status: 422,
          code: 'E_PRESUPUESTO',
        })
      }
    }

    const trx = await db.transaction()
    try {
      await PresupuestoPrograma.query({ client: trx })
        .where('presupuestoId', presupuesto.id)
        .delete()
      if (unicas.size) {
        await PresupuestoPrograma.createMany(
          [...unicas.entries()].map(([programaId, monto]) => ({
            presupuestoId: presupuesto.id,
            programaId,
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

  async asignarCoordinador(scope: AccessScope, anio: number, idUsuario: number, monto: number) {
    assertCan(scope, 'solicitud_programa.editar')
    if (!scope.asignaPresupuesto) {
      throw new Exception('Solo la subdirectora reparte el presupuesto entre coordinadores', {
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

  async asignarArea(scope: AccessScope, anio: number, programaId: number, monto: number) {
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
    await this.assertProgramaDelCoordinador(scope, programaId)

    const actual = await PresupuestoAsignacionArea.query()
      .where('asignacionId', asignacion.id)
      .where('programaId', programaId)
      .first()
    const otros = (await this.sumaAreas(asignacion.id)) - (actual ? Number(actual.monto) : 0)
    const queda = Number(asignacion.monto) - otros
    if (monto > queda) {
      throw new Exception(`Supera lo que te queda. Quedan ${queda}.`, {
        status: 422,
        code: 'E_PRESUPUESTO',
      })
    }
    const aprobado = await this.aprobadoPrograma(anio, programaId, scope.idCformacion)
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
        await PresupuestoAsignacionArea.create({
          asignacionId: asignacion.id,
          programaId,
          monto,
        })
      }
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo asignar el presupuesto al área')
    }

    return this.vistaAreas(scope, anio)
  }

  async asignarFicha(scope: AccessScope, anio: number, fichaId: number, monto: number) {
    assertCan(scope, 'solicitud_programa.editar')
    if (scope.asignaPresupuesto) {
      throw new Exception('El reparto por ficha lo hace el coordinador con su monto', {
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
    await this.assertFichaDelCoordinador(scope, fichaId)

    const actual = await PresupuestoAsignacionFicha.query()
      .where('asignacionId', asignacion.id)
      .where('fichaId', fichaId)
      .first()
    const otros = (await this.sumaFichas(asignacion.id)) - (actual ? Number(actual.monto) : 0)
    const queda = Number(asignacion.monto) - otros
    if (monto > queda) {
      throw new Exception(`Supera lo que te queda. Quedan ${queda}.`, {
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
        await PresupuestoAsignacionFicha.create({
          asignacionId: asignacion.id,
          fichaId,
          monto,
        })
      }
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo asignar el presupuesto a la ficha')
    }

    return this.vistaFichas(scope, anio)
  }

  async resumen(scope: AccessScope, anio: number) {
    assertCan(scope, 'solicitud_programa.ver')
    if (!scope.asignaPresupuesto) return this.resumenCoordinador(scope, anio)
    const corte = await this.resumenDe(scope.idCformacion, anio)
    return { ...corte, areas: corte.areas ?? [], fichas: [] }
  }

  private async resumenDe(idCformacion: number, anio: number) {
    const presupuesto = await this.presupuestoDe(idCformacion, anio)
    const asignaciones = presupuesto
      ? await PresupuestoPrograma.query()
          .where('presupuestoId', presupuesto.id)
          .preload('programa')
      : []

    const programas = []
    for (const fila of asignaciones) {
      const pedido = await this.pedidoPrograma(anio, fila.programaId, idCformacion)
      const aprobado = await this.aprobadoPrograma(anio, fila.programaId, idCformacion)
      const monto = Number(fila.monto)
      programas.push({
        programaId: fila.programaId,
        codigo: fila.programa?.codigo ?? null,
        nombre: fila.programa?.nombre ?? String(fila.programaId),
        monto,
        pedido,
        aprobado,
        disponible: monto - pedido,
        sePasa: pedido > monto,
      })
    }

    const monto = presupuesto ? Number(presupuesto.monto) : 0
    const coordinadores = await this.filasCoordinadores(idCformacion, presupuesto?.id ?? null)
    const repartido = coordinadores.reduce((suma, fila) => suma + fila.monto, 0)
    const pedido = programas.reduce((suma, fila) => suma + fila.pedido, 0)
    const aprobado = programas.reduce((suma, fila) => suma + fila.aprobado, 0)
    const porLote = await this.gastoPorLote(idCformacion, anio)

    return {
      anio,
      idCformacion,
      monto,
      repartido,
      sinRepartir: monto - repartido,
      pedido,
      aprobado,
      disponible: monto - pedido,
      sePasa: pedido > monto,
      programas,
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
      programas: [],
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
    const ids = await this.idsAreasDelCoordinador(scope)
    const programas = await ProgramaFormacion.query()
      .whereIn('id', ids.length ? ids : [0])
      .orderBy('nombre', 'asc')
    const montos = asignacionId
      ? await PresupuestoAsignacionArea.query().where('asignacionId', asignacionId)
      : []
    const porPrograma = new Map(montos.map((fila) => [fila.programaId, Number(fila.monto)]))
    return programas.map((programa) => ({
      id: programa.id,
      nombre: programa.nombre,
      codigo: programa.codigo,
      monto: porPrograma.get(programa.id) ?? 0,
    }))
  }

  private async vistaFichas(scope: AccessScope, anio: number) {
    const asignacion = await this.asignacionDe(scope.idCformacion, scope.idUsuario, anio)
    const monto = asignacion ? Number(asignacion.monto) : 0
    const fichas = await this.filasFichas(scope, asignacion?.id ?? null)
    const repartido = fichas.reduce((suma, fila) => suma + fila.monto, 0)
    return {
      anio,
      monto,
      repartido,
      sinRepartir: monto - repartido,
      fichas,
    }
  }

  private async filasFichas(scope: AccessScope, asignacionId: number | null) {
    const fichas = await Ficha.query()
      .where('centroFormacionId', scope.idCformacion)
      .where('estado', true)
      .whereIn('programaId', this.programasDelCoordinador(scope.idUsuario))
      .preload('programa')
      .orderBy('numeroFicha', 'asc')
    const montos = asignacionId
      ? await PresupuestoAsignacionFicha.query().where('asignacionId', asignacionId)
      : []
    const porFicha = new Map(montos.map((fila) => [fila.fichaId, Number(fila.monto)]))
    return fichas.map((ficha) => ({
      id: ficha.id,
      numeroFicha: ficha.numeroFicha,
      programa: ficha.programa?.nombre ?? '',
      monto: porFicha.get(ficha.id) ?? 0,
    }))
  }

  private async idsAreasDelCoordinador(scope: AccessScope) {
    const alcance = await db
      .from('usuario_red_conocimiento')
      .where('id_usuario', scope.idUsuario)
      .where('estado', true)
      .select('id_red_conocimiento', 'id_linea_tematica')

    if (alcance.length) {
      const query = ProgramaFormacion.query()
        .where('estado', true)
        .whereHas('fichas', (fichas) => {
          fichas.where('centroFormacionId', scope.idCformacion).where('estado', true)
        })
      query.where((grupo) => {
        for (const fila of alcance) {
          grupo.orWhere((row) => {
            row.where('id_red_conocimiento', Number(fila.id_red_conocimiento))
            if (fila.id_linea_tematica !== null && fila.id_linea_tematica !== undefined) {
              row.where('id_linea_tematica', Number(fila.id_linea_tematica))
            }
          })
        }
      })
      const programas = await query
      return programas.map((programa) => programa.id)
    }

    const rows = await db
      .from('usuario_programa_formacion as upf')
      .join('ficha as f', 'f.programa_id', 'upf.id_programa_formacion')
      .where('upf.id_usuario', scope.idUsuario)
      .where('upf.estado', true)
      .where('f.centro_formacion_id', scope.idCformacion)
      .where('f.estado', true)
      .distinct('upf.id_programa_formacion')
    return rows.map((row) => Number(row.id_programa_formacion))
  }

  private programasDelCoordinador(idUsuario: number) {
    return db
      .from('usuario_programa_formacion')
      .select('id_programa_formacion')
      .where('id_usuario', idUsuario)
      .where('estado', true)
  }

  private async asignacionDe(idCformacion: number, idUsuario: number, anio: number) {
    const presupuesto = await this.presupuestoDe(idCformacion, anio)
    if (!presupuesto) return null
    return PresupuestoAsignacion.query()
      .where('presupuestoId', presupuesto.id)
      .where('idUsuario', idUsuario)
      .first()
  }

  private async assertFichaDelCoordinador(scope: AccessScope, fichaId: number) {
    const ficha = await Ficha.query()
      .where('id', fichaId)
      .where('centroFormacionId', scope.idCformacion)
      .where('estado', true)
      .whereIn('programaId', this.programasDelCoordinador(scope.idUsuario))
      .first()
    if (!ficha) {
      throw new Exception('Esa ficha no está en tus programas', {
        status: 422,
        code: 'E_PRESUPUESTO',
      })
    }
  }

  private async sumaAreas(asignacionId: number) {
    const filas = await PresupuestoAsignacionArea.query().where('asignacionId', asignacionId)
    return filas.reduce((suma, fila) => suma + Number(fila.monto), 0)
  }

  private async sumaFichas(asignacionId: number) {
    const filas = await PresupuestoAsignacionFicha.query().where('asignacionId', asignacionId)
    return filas.reduce((suma, fila) => suma + Number(fila.monto), 0)
  }

  private async sumaAsignaciones(presupuestoId: number) {
    const filas = await PresupuestoAsignacion.query().where('presupuestoId', presupuestoId)
    return filas.reduce((suma, fila) => suma + Number(fila.monto), 0)
  }

  async alertas(scope: AccessScope, anio: number) {
    assertCan(scope, 'solicitud_programa.ver')
    const ids = await this.idsAreasDelCoordinador(scope)
    const programas = await ProgramaFormacion.query()
      .whereIn('id', ids.length ? ids : [0])
      .orderBy('nombre', 'asc')
    const filas = []
    for (const programa of programas) {
      const area = await this.areaAsignada(scope.idCformacion, anio, programa.id)
      const asignado = area ? Number(area.monto) : 0
      const pedido = await this.pedidoPrograma(anio, programa.id, scope.idCformacion)
      if (pedido <= 0) continue
      const tipo = pedido > asignado ? 'se_pasa' : pedido / (asignado || 1) >= 0.8 ? 'cerca' : null
      if (!tipo) continue
      filas.push({
        programaId: programa.id,
        nombre: programa.nombre,
        codigo: programa.codigo,
        anio,
        asignado,
        pedido,
        tipo,
      })
    }
    return filas
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

    const fila = await this.areaAsignada(input.idCformacion, input.anio, ficha.programaId)
    if (!fila) {
      throw new Exception('Asigna presupuesto a esta área antes de aprobar consumo', {
        status: 422,
        code: 'E_PRESUPUESTO',
      })
    }

    const aprobado = await this.aprobadoPrograma(input.anio, ficha.programaId, input.idCformacion)
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
      const area = programaId
        ? await this.areaAsignada(scope.idCformacion, anio, programaId)
        : null
      const asignado = area ? Number(area.monto) : 0
      const pedido = programaId
        ? await this.pedidoPrograma(anio, programaId, scope.idCformacion)
        : 0
      const aprobado = programaId
        ? await this.aprobadoPrograma(anio, programaId, scope.idCformacion)
        : 0
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

  private async assertProgramaDelCoordinador(scope: AccessScope, programaId: number) {
    const programa = await ProgramaFormacion.query()
      .where('id', programaId)
      .where('estado_programa', true)
      .whereHas('fichas', (fichas) => {
        fichas.where('centroFormacionId', scope.idCformacion).where('estado', true)
      })
      .first()
    if (!programa) {
      throw new Exception('Esa área no tiene fichas activas en tu centro', {
        status: 422,
        code: 'E_PRESUPUESTO',
      })
    }
  }

  private async areaAsignada(idCformacion: number, anio: number, programaId: number) {
    const presupuesto = await this.presupuestoDe(idCformacion, anio)
    if (!presupuesto) return null
    const filas = await PresupuestoAsignacionArea.query()
      .where('programaId', programaId)
      .whereIn(
        'asignacionId',
        PresupuestoAsignacion.query().where('presupuestoId', presupuesto.id).select('id')
      )
    if (!filas.length) return null
    return {
      monto: filas.reduce((suma, fila) => suma + Number(fila.monto), 0),
    }
  }

  private async fichaAsignada(
    idCformacion: number,
    idUsuario: number,
    anio: number,
    fichaId: number
  ) {
    const asignacion = await this.asignacionDe(idCformacion, idUsuario, anio)
    if (!asignacion) return null
    return PresupuestoAsignacionFicha.query()
      .where('asignacionId', asignacion.id)
      .where('fichaId', fichaId)
      .first()
  }

  private async pedidoFicha(anio: number, fichaId: number, idCformacion: number) {
    const fila = await db
      .from('detalle_solicitud_programa as d')
      .join('solicitud_material_programa as s', 's.id_solicitud_programa', 'd.id_solicitud_programa')
      .join('lista_maestra_material as l', 'l.id_lista_maestra', 'd.id_lista_maestra')
      .join('ficha as f', 'f.id_ficha', 's.id_ficha')
      .where('s.id_ficha', fichaId)
      .where('s.vigencia', anio)
      .where('f.centro_formacion_id', idCformacion)
      .whereNot('s.estado', 'anulada')
      .where('l.caracter', 'consumo')
      .sum({ total: db.raw('d.cantidad_solicitada * COALESCE(l.valor_unitario, 0)') })
      .first()
    return Number(fila?.total ?? 0)
  }

  private async aprobadoFicha(anio: number, fichaId: number, idCformacion: number) {
    const fila = await db
      .from('detalle_solicitud_programa as d')
      .join('solicitud_material_programa as s', 's.id_solicitud_programa', 'd.id_solicitud_programa')
      .join('lista_maestra_material as l', 'l.id_lista_maestra', 'd.id_lista_maestra')
      .join('ficha as f', 'f.id_ficha', 's.id_ficha')
      .where('s.id_ficha', fichaId)
      .where('s.vigencia', anio)
      .where('f.centro_formacion_id', idCformacion)
      .whereNot('s.estado', 'anulada')
      .where('l.caracter', 'consumo')
      .where('d.cantidad_aprobada', '>', 0)
      .sum({ total: db.raw('d.cantidad_aprobada * l.valor_unitario') })
      .first()
    return Number(fila?.total ?? 0)
  }

  private async pedidoPrograma(anio: number, programaId: number, idCformacion: number) {
    const fila = await db
      .from('detalle_solicitud_programa as d')
      .join('solicitud_material_programa as s', 's.id_solicitud_programa', 'd.id_solicitud_programa')
      .join('lista_maestra_material as l', 'l.id_lista_maestra', 'd.id_lista_maestra')
      .join('ficha as f', 'f.id_ficha', 's.id_ficha')
      .where('s.id_programa_formacion', programaId)
      .where('s.vigencia', anio)
      .where('f.centro_formacion_id', idCformacion)
      .whereNot('s.estado', 'anulada')
      .where('l.caracter', 'consumo')
      .sum({ total: db.raw('d.cantidad_solicitada * COALESCE(l.valor_unitario, 0)') })
      .first()
    return Number(fila?.total ?? 0)
  }

  private async aprobadoPrograma(anio: number, programaId: number, idCformacion: number) {
    const fila = await db
      .from('detalle_solicitud_programa as d')
      .join('solicitud_material_programa as s', 's.id_solicitud_programa', 'd.id_solicitud_programa')
      .join('lista_maestra_material as l', 'l.id_lista_maestra', 'd.id_lista_maestra')
      .join('ficha as f', 'f.id_ficha', 's.id_ficha')
      .where('s.id_programa_formacion', programaId)
      .where('s.vigencia', anio)
      .where('f.centro_formacion_id', idCformacion)
      .whereNot('s.estado', 'anulada')
      .where('l.caracter', 'consumo')
      .where('d.cantidad_aprobada', '>', 0)
      .sum({ total: db.raw('d.cantidad_aprobada * l.valor_unitario') })
      .first()
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
