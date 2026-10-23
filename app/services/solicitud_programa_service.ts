import { Exception } from '@adonisjs/core/exceptions'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import DetalleSolicitudPrograma from '#models/detalle_solicitud_programa'
import Ficha from '#models/ficha'
import ProgramaFormacion from '#models/programa_formacion'
import ListaMaestraMaterial from '#models/lista_maestra_material'
import SolicitudHistorial from '#models/solicitud_historial'
import SolicitudMaterialPrograma from '#models/solicitud_material_programa'
import Vigencia from '#models/vigencia'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { assertCan, assertOwnedByCenter, can, type AccessScope } from '#services/access_control'
import { rethrowDatabaseError } from '#services/database_error'
import NotificacionService from '#services/notificacion_service'

type ItemPayload = { listaMaestraId: number; cantidadSolicitada: number }

type CreatePayload = {
  programaId: number
  fichaId: number
  vigencia?: number
  instructorId?: number
  observacion?: string | null
  items: ItemPayload[]
}

type AccionDecision = 'entregar' | 'pendiente' | 'rechazar'

type DecisionPayload = {
  observacionDecision?: string | null
  items: Array<{
    id: number
    accion: AccionDecision
    cantidadAprobada?: number
    observacionCoordinador?: string | null
  }>
}

export default class SolicitudProgramaService {
  private notificaciones = new NotificacionService()

  async index(scope: AccessScope, filters: { vigencia?: number; estado?: string } = {}) {
    assertCan(scope, 'solicitud_programa.ver')
    const query = this.baseQuery()

    if (!scope.isAdmin) {
      this.restringirAlCentro(query, scope)
      if (!can(scope, 'proceso_compra.ver')) {
        if (can(scope, 'solicitud_programa.editar') && !can(scope, 'solicitud_programa.crear')) {
          const programaIds = await this.programaIdsDelCoordinador(scope)
          query.whereIn('programaId', programaIds.length ? programaIds : [0])
        } else {
          query.where('instructorId', scope.idUsuario)
        }
      }
    }

    if (filters.vigencia) query.where('vigencia', filters.vigencia)
    if (filters.estado) query.where('estado', filters.estado)

    return query.orderBy('id', 'desc')
  }

  async show(scope: AccessScope, id: number) {
    assertCan(scope, 'solicitud_programa.ver')
    const solicitud = await this.baseQuery().where('id', id).firstOrFail()
    await this.assertVisible(scope, solicitud)
    return solicitud
  }

  async store(scope: AccessScope, payload: CreatePayload) {
    assertCan(scope, 'solicitud_programa.crear')
    const vigencia = await this.vigenciaObjetivo(payload.vigencia)
    const instructorId =
      scope.isAdmin && payload.instructorId ? payload.instructorId : scope.idUsuario
    if (scope.isAdmin) {
      await this.ensureAssignment(instructorId, payload.programaId)
    } else {
      await this.assertProgramaDelInstructor(scope, payload.programaId)
    }
    const ficha = await Ficha.findOrFail(payload.fichaId)
    if (ficha.programaId !== payload.programaId) {
      throw new Exception('La ficha no pertenece al programa seleccionado', {
        status: 422,
        code: 'E_VALIDATION_ERROR',
      })
    }
    if (!scope.isAdmin) {
      assertOwnedByCenter(
        scope,
        ficha.centroFormacionId,
        'Esa ficha no pertenece a tu centro de formación'
      )
    }

    const duplicada = await SolicitudMaterialPrograma.query()
      .where('instructorId', instructorId)
      .where('fichaId', payload.fichaId)
      .where('vigencia', vigencia.anio)
      .whereNot('estado', 'anulada')
      .first()

    if (duplicada) {
      throw new Exception('Ya hay una solicitud de este instructor para esa ficha en la vigencia', {
        status: 409,
        code: 'E_DUPLICATE',
      })
    }

    try {
      const solicitud = await SolicitudMaterialPrograma.create({
        instructorId,
        programaId: payload.programaId,
        fichaId: payload.fichaId,
        vigencia: vigencia.anio,
        estado: 'borrador',
        observacion: payload.observacion ?? null,
      })

      await this.replaceItems(solicitud, payload.items)
      await this.historial(solicitud.id, null, 'borrador', scope.idUsuario, payload.observacion)
      return this.show(scope, solicitud.id)
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo crear la solicitud de materiales de formación')
    }
  }

  async update(scope: AccessScope, id: number, payload: { observacion?: string | null; items?: ItemPayload[] }) {
    assertCan(scope, 'solicitud_programa.crear')
    const solicitud = await this.show(scope, id)
    if (solicitud.instructorId !== scope.idUsuario && !scope.isAdmin) {
      throw new Exception('Solo el instructor dueño puede editar el borrador', {
        status: 403,
        code: 'E_FORBIDDEN',
      })
    }
    if (solicitud.estado !== 'borrador') {
      throw new Exception('Solo se editan solicitudes en borrador', {
        status: 409,
        code: 'E_INVALID_STATE',
      })
    }

    if (payload.observacion !== undefined) solicitud.observacion = payload.observacion
    await solicitud.save()
    if (payload.items) await this.replaceItems(solicitud, payload.items)
    return this.show(scope, id)
  }

  async enviar(scope: AccessScope, id: number) {
    assertCan(scope, 'solicitud_programa.crear')
    const solicitud = await this.show(scope, id)
    if (solicitud.instructorId !== scope.idUsuario && !scope.isAdmin) {
      throw new Exception('Solo el instructor dueño puede enviar la solicitud', {
        status: 403,
        code: 'E_FORBIDDEN',
      })
    }
    if (solicitud.estado !== 'borrador') {
      throw new Exception('La solicitud ya fue enviada', { status: 409, code: 'E_INVALID_STATE' })
    }
    if (!(solicitud.detalles ?? []).length) {
      throw new Exception('No se puede enviar una solicitud sin materiales', {
        status: 422,
        code: 'E_SIN_ITEMS',
      })
    }

    const trx = await db.transaction()
    try {
      const anterior = solicitud.estado
      solicitud.estado = 'enviada'
      solicitud.fechaEnvio = DateTime.now()
      solicitud.useTransaction(trx)
      await solicitud.save()
      await this.historial(solicitud.id, anterior, 'enviada', scope.idUsuario, null, trx)
      const avisos = await this.notificaciones.pedidoFormacion(trx, {
        solicitudId: solicitud.id,
        instructorId: solicitud.instructorId,
        programaId: solicitud.programaId,
        programa: solicitud.programa
          ? `${solicitud.programa.codigo} — ${solicitud.programa.nombre}`
          : `programa ${solicitud.programaId}`,
        ficha: solicitud.ficha?.numeroFicha ?? String(solicitud.fichaId),
        red: solicitud.programa?.redConocimiento?.nombre ?? null,
        linea: solicitud.programa?.lineaTematica?.nombre ?? null,
        items: (solicitud.detalles ?? []).map((detalle) => ({
          producto: detalle.listaMaestra?.producto ?? `material ${detalle.listaMaestraId}`,
          cantidad: detalle.cantidadSolicitada,
        })),
      })
      await trx.commit()
      this.notificaciones.emitir(avisos)
    } catch (error) {
      await trx.rollback()
      if (error instanceof Exception) throw error
      rethrowDatabaseError(error, 'No se pudo enviar la solicitud de materiales de formación')
    }
    return this.show(scope, id)
  }

  async decidir(scope: AccessScope, id: number, payload: DecisionPayload) {
    assertCan(scope, 'solicitud_programa.editar')
    const solicitud = await this.show(scope, id)
    if (solicitud.estado !== 'enviada' && solicitud.estado !== 'parcial') {
      throw new Exception('Solo se revisan solicitudes enviadas o parciales', {
        status: 409,
        code: 'E_INVALID_STATE',
      })
    }

    const byId = new Map(payload.items.map((item) => [item.id, item]))
    const trx = await db.transaction()
    const entregados: Array<{ producto: string; cantidad: number; queda: number; motivo: string | null }> =
      []
    const ajustados: Array<{
      producto: string
      pedida: number
      autorizada: number
      queda: number
      motivo: string | null
    }> = []
    const rechazadosAhora: Array<{ producto: string; cantidad: number; motivo: string | null }> = []
    const tocados = new Set<number>()

    try {
      solicitud.useTransaction(trx)
      if (!scope.isAdmin) {
        await this.assertAlcanceCoordinador(scope, solicitud.programaId)
      }

      for (const detalle of solicitud.detalles ?? []) {
        const decision = byId.get(detalle.id)
        if (!decision || decision.accion === 'pendiente') continue
        if (detalle.estado !== 'pendiente') continue

        const ya = detalle.cantidadAprobada ?? 0
        const restante = detalle.cantidadSolicitada - ya
        if (restante <= 0) continue

        const producto = detalle.listaMaestra?.producto ?? `material ${detalle.listaMaestraId}`
        const motivo = decision.observacionCoordinador?.trim() || null

        detalle.useTransaction(trx)
        if (motivo) detalle.observacionCoordinador = motivo

        tocados.add(detalle.id)
        if (decision.accion === 'rechazar') {
          detalle.estado = ya > 0 ? 'parcial' : 'rechazado'
          await detalle.save()
          rechazadosAhora.push({ producto, cantidad: restante, motivo })
          continue
        }

        const cantidad = decision.cantidadAprobada ?? restante
        if (cantidad <= 0) {
          throw new Exception(`Indica cuánto autorizas de ${producto}`, {
            status: 422,
            code: 'E_VALIDATION_ERROR',
          })
        }
        if (cantidad > restante) {
          throw new Exception(`No puedes autorizar más de ${restante} de ${producto}`, {
            status: 422,
            code: 'E_VALIDATION_ERROR',
          })
        }

        detalle.cantidadAprobada = ya + cantidad
        const queda = detalle.cantidadSolicitada - detalle.cantidadAprobada
        detalle.estado = queda <= 0 ? 'aprobado' : 'pendiente'
        await detalle.save()

        if (cantidad < restante) {
          ajustados.push({
            producto,
            pedida: restante,
            autorizada: cantidad,
            queda,
            motivo,
          })
        } else {
          entregados.push({ producto, cantidad, queda, motivo })
        }
      }

      if (!entregados.length && !ajustados.length && !rechazadosAhora.length) {
        throw new Exception(
          'Selecciona qué autorizas ahora, qué dejas pendiente o qué no autorizas',
          { status: 422, code: 'E_VALIDATION_ERROR' }
        )
      }

      const lineas = solicitud.detalles ?? []
      const pendientes = lineas.filter((item) => item.estado === 'pendiente')
      const aprobados = lineas.filter((item) => item.estado === 'aprobado')
      const parciales = lineas.filter((item) => item.estado === 'parcial')
      const rechazados = lineas.filter((item) => item.estado === 'rechazado')

      const hayAvance = lineas.some(
        (item) => (item.cantidadAprobada ?? 0) > 0 || item.estado !== 'pendiente'
      )
      const anterior = solicitud.estado
      if (pendientes.length && hayAvance) {
        solicitud.estado = 'parcial'
      } else if (pendientes.length) {
        solicitud.estado = 'enviada'
      } else if (rechazados.length && !aprobados.length && !parciales.length) {
        solicitud.estado = 'rechazada'
      } else if (parciales.length || rechazados.length) {
        solicitud.estado = 'parcial'
      } else {
        solicitud.estado = 'aprobada'
      }

      solicitud.aprobadorId = scope.idUsuario
      solicitud.observacionDecision = payload.observacionDecision ?? solicitud.observacionDecision
      solicitud.fechaDecision = DateTime.now()
      await solicitud.save()
      await this.historial(
        solicitud.id,
        anterior,
        solicitud.estado,
        scope.idUsuario,
        payload.observacionDecision,
        trx
      )

      const avisos = await this.notificaciones.decisionFormacion(trx, {
        solicitudId: solicitud.id,
        instructorId: solicitud.instructorId,
        coordinadorId: scope.idUsuario,
        programa: solicitud.programa
          ? `${solicitud.programa.codigo} — ${solicitud.programa.nombre}`
          : `programa ${solicitud.programaId}`,
        ficha: solicitud.ficha?.numeroFicha ?? String(solicitud.fichaId),
        observacion: payload.observacionDecision ?? null,
        entregados,
        ajustados,
        rechazados: rechazadosAhora,
        pendientes: pendientes
          .filter((item) => !tocados.has(item.id))
          .map((item) => ({
            producto: item.listaMaestra?.producto ?? `material ${item.listaMaestraId}`,
            cantidad: item.cantidadSolicitada - (item.cantidadAprobada ?? 0),
          })),
      })
      await trx.commit()
      this.notificaciones.emitir(avisos)
    } catch (error) {
      await trx.rollback()
      if (error instanceof Exception) throw error
      rethrowDatabaseError(error, 'No se pudo registrar la decisión de coordinación')
    }
    return this.show(scope, id)
  }

  async anular(scope: AccessScope, id: number) {
    assertCan(scope, 'solicitud_programa.eliminar')
    const solicitud = await this.show(scope, id)
    if (solicitud.estado === 'anulada') {
      throw new Exception('La solicitud ya está anulada', { status: 409, code: 'E_INVALID_STATE' })
    }
    const anterior = solicitud.estado
    solicitud.estado = 'anulada'
    await solicitud.save()
    await this.historial(solicitud.id, anterior, 'anulada', scope.idUsuario, null)
    return this.show(scope, id)
  }

  private async replaceItems(solicitud: SolicitudMaterialPrograma, items: ItemPayload[]) {
    await DetalleSolicitudPrograma.query().where('solicitudId', solicitud.id).delete()

    for (const item of items) {
      const material = await ListaMaestraMaterial.findOrFail(item.listaMaestraId)
      if (material.programaId !== solicitud.programaId || !material.estado) {
        throw new Exception('El material no pertenece a la lista maestra de ese programa', {
          status: 422,
          code: 'E_VALIDATION_ERROR',
        })
      }

      await DetalleSolicitudPrograma.create({
        solicitudId: solicitud.id,
        programaId: solicitud.programaId,
        listaMaestraId: material.id,
        cantidadMaestraReferencia: material.cantidadBase,
        cantidadSolicitada: item.cantidadSolicitada,
        estado: 'pendiente',
      })
    }
  }

  private baseQuery() {
    return SolicitudMaterialPrograma.query()
      .preload('instructor')
      .preload('programa', (programa) => {
        programa.preload('redConocimiento').preload('lineaTematica')
      })
      .preload('ficha')
      .preload('detalles', (detalles) => detalles.preload('listaMaestra'))
  }

  private async vigenciaObjetivo(anio?: number) {
    const vigencia = anio
      ? await Vigencia.findOrFail(anio)
      : await Vigencia.query().where('activa', true).first()

    if (!vigencia || !vigencia.activa) {
      throw new Exception('No hay una vigencia activa para solicitar materiales', {
        status: 422,
        code: 'E_VIGENCIA_INACTIVA',
      })
    }

    return vigencia
  }

  private async assertAlcanceCoordinador(scope: AccessScope, programaId: number) {
    const cubiertos = await this.programaIdsDelCoordinador(scope)
    if (!cubiertos.includes(programaId)) {
      throw new Exception(
        'Esta solicitud no es de tu red de conocimiento. Solo puedes decidir pedidos de tus programas.',
        { status: 403, code: 'E_FORBIDDEN' },
      )
    }
  }

  private async ensureAssignment(userId: number, programaId: number) {
    const assigned = await db
      .from('usuario_programa_formacion')
      .where('id_usuario', userId)
      .where('id_programa_formacion', programaId)
      .first()

    if (assigned) {
      if (!assigned.estado) {
        await db
          .from('usuario_programa_formacion')
          .where('id_usuario_programa', assigned.id_usuario_programa)
          .update({ estado: true })
      }
      return
    }

    await db.table('usuario_programa_formacion').insert({
      id_usuario: userId,
      id_programa_formacion: programaId,
      estado: true,
    })
  }

  private async assertProgramaDelInstructor(scope: AccessScope, programaId: number) {
    if (scope.isAdmin) return
    const assigned = await db
      .from('usuario_programa_formacion')
      .where('id_usuario', scope.idUsuario)
      .where('id_programa_formacion', programaId)
      .where('estado', true)
      .first()

    if (!assigned) {
      throw new Exception(
        'No tienes este programa de formación asignado. Pídele al administrador que te lo asigne.',
        {
          status: 403,
          code: 'E_FORBIDDEN',
        }
      )
    }
  }

  private async assertVisible(scope: AccessScope, solicitud: SolicitudMaterialPrograma) {
    const ficha = solicitud.ficha ?? (await Ficha.findOrFail(solicitud.fichaId))
    if (!scope.isAdmin) {
      assertOwnedByCenter(
        scope,
        ficha.centroFormacionId,
        'Esta solicitud no pertenece a tu centro de formación'
      )
    }
    if (scope.isAdmin || can(scope, 'proceso_compra.ver')) return
    if (solicitud.instructorId === scope.idUsuario) return
    if (can(scope, 'solicitud_programa.editar')) {
      const cubiertos = await this.programaIdsDelCoordinador(scope)
      if (cubiertos.includes(solicitud.programaId)) return
    }
    throw new Exception('No puedes ver esta solicitud', { status: 403, code: 'E_FORBIDDEN' })
  }

  /**
   * Coordinador: red Informática + línea Software ⇒ todos los programas de esa
   * línea (ADSO, etc.). Sin fila de red, se usan los programas que le asignaron.
   */
  private async programaIdsDelCoordinador(scope: AccessScope) {
    const alcance = await db
      .from('usuario_red_conocimiento')
      .where('id_usuario', scope.idUsuario)
      .where('estado', true)
      .select('id_red_conocimiento', 'id_linea_tematica')

    if (alcance.length) {
      const query = ProgramaFormacion.query()
        .where('estado_programa', true)
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
      const programas = await query.select('id_programa_formacion')
      return programas.map((programa) => programa.id)
    }

    const rows = await db
      .from('usuario_programa_formacion as upf')
      .join('ficha as f', 'f.programa_id', 'upf.id_programa_formacion')
      .where('upf.id_usuario', scope.idUsuario)
      .where('upf.estado', true)
      .where('f.centro_formacion_id', scope.idCformacion)
      .where('f.estado', true)
      .select('upf.id_programa_formacion')
      .distinct('upf.id_programa_formacion')
    return rows.map((row) => Number(row.id_programa_formacion))
  }

  private restringirAlCentro(
    query: ReturnType<SolicitudProgramaService['baseQuery']>,
    scope: AccessScope
  ) {
    query.whereHas('ficha', (ficha) => {
      ficha.where('centroFormacionId', scope.idCformacion)
    })
  }

  private historial(
    solicitudId: number,
    anterior: string | null,
    siguiente: string,
    usuarioId: number,
    comentario: string | null | undefined,
    trx?: TransactionClientContract
  ) {
    return SolicitudHistorial.create(
      {
        solicitudId,
        estadoAnterior: anterior,
        estadoNuevo: siguiente,
        usuarioId,
        comentario: comentario ?? null,
      },
      trx ? { client: trx } : undefined
    )
  }
}
