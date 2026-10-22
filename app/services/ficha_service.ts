import { Exception } from '@adonisjs/core/exceptions'
import { DateTime } from 'luxon'
import Ficha from '#models/ficha'
import Jornada from '#models/jornada'
import ProgramaFormacion from '#models/programa_formacion'
import TrainingCenter from '#models/training_center'
import { assertOwnedByCenter, centerIdFor, type AccessScope } from '#services/access_control'
import { rethrowDatabaseError } from '#services/database_error'

type CreateFichaPayload = {
  idPrograma: number
  idJornada?: number | null
  idCformacion?: number
  numeroFicha: string
  fechaInicio?: string | null
  fechaFin?: string | null
  cupoAprendices?: number
  estado?: boolean
}

type UpdateFichaPayload = Partial<CreateFichaPayload>

export default class FichaService {
  async index(
    scope: AccessScope,
    options: { estado?: boolean; idCformacion?: number; idPrograma?: number; search?: string } = {}
  ) {
    const query = Ficha.query()
      .preload('programa', (programa) => programa.preload('nivel'))
      .preload('jornada')
      .preload('centroFormacion', (centro) => centro.preload('regional'))
      .where('centro_formacion_id', centerIdFor(scope, options.idCformacion))
      .where('estado', options.estado ?? true)
      .orderBy('numero_ficha', 'asc')

    if (options.idPrograma) {
      query.where('programa_id', options.idPrograma)
    }

    if (options.search) {
      query.whereILike('numero_ficha', `%${options.search}%`)
    }

    return query
  }

  async show(scope: AccessScope, id: number) {
    const ficha = await Ficha.query()
      .where('id_ficha', id)
      .preload('programa', (programa) => programa.preload('nivel'))
      .preload('jornada')
      .preload('centroFormacion', (centro) => centro.preload('regional'))
      .firstOrFail()

    assertOwnedByCenter(
      scope,
      ficha.centroFormacionId,
      'Esa ficha no pertenece a tu centro de formación'
    )

    return ficha
  }

  async store(scope: AccessScope, payload: CreateFichaPayload) {
    const fechaInicio = payload.fechaInicio ? DateTime.fromISO(payload.fechaInicio) : null
    const fechaFin = payload.fechaFin ? DateTime.fromISO(payload.fechaFin) : null

    this.assertFechas(fechaInicio, fechaFin)

    try {
      const ficha = await Ficha.create({
        programaId: payload.idPrograma,
        jornadaId: payload.idJornada ?? null,
        centroFormacionId: centerIdFor(scope, payload.idCformacion),
        numeroFicha: payload.numeroFicha,
        fechaInicio,
        fechaFin,
        cupoAprendices: payload.cupoAprendices ?? 30,
        estado: payload.estado ?? true,
      })

      return this.show(scope, ficha.id)
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo crear la ficha')
    }
  }

  async update(scope: AccessScope, id: number, payload: UpdateFichaPayload) {
    const ficha = await Ficha.findOrFail(id)

    assertOwnedByCenter(
      scope,
      ficha.centroFormacionId,
      'Esa ficha no pertenece a tu centro de formación'
    )

    const fechaInicio =
      payload.fechaInicio !== undefined
        ? payload.fechaInicio
          ? DateTime.fromISO(payload.fechaInicio)
          : null
        : ficha.fechaInicio

    const fechaFin =
      payload.fechaFin !== undefined
        ? payload.fechaFin
          ? DateTime.fromISO(payload.fechaFin)
          : null
        : ficha.fechaFin

    this.assertFechas(fechaInicio, fechaFin)

    ficha.merge({
      ...(payload.idPrograma !== undefined ? { programaId: payload.idPrograma } : {}),
      ...(payload.idJornada !== undefined ? { jornadaId: payload.idJornada } : {}),
      ...(payload.idCformacion !== undefined
        ? { centroFormacionId: centerIdFor(scope, payload.idCformacion) }
        : {}),
      ...(payload.numeroFicha !== undefined ? { numeroFicha: payload.numeroFicha } : {}),
      fechaInicio,
      fechaFin,
      ...(payload.cupoAprendices !== undefined ? { cupoAprendices: payload.cupoAprendices } : {}),
      ...(payload.estado !== undefined ? { estado: payload.estado } : {}),
    })

    try {
      await ficha.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo actualizar la ficha')
    }

    return this.show(scope, id)
  }

  async remove(scope: AccessScope, id: number) {
    const ficha = await Ficha.findOrFail(id)

    assertOwnedByCenter(
      scope,
      ficha.centroFormacionId,
      'Esa ficha no pertenece a tu centro de formación'
    )

    if (ficha.estado === false) {
      throw new Exception('La ficha ya está deshabilitada', {
        status: 409,
        code: 'E_ALREADY_DISABLED',
      })
    }

    ficha.estado = false

    try {
      await ficha.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo deshabilitar la ficha')
    }

    return { message: 'Ficha deshabilitada correctamente' }
  }

  async options(scope: AccessScope) {
    const [programas, jornadas, centros] = await Promise.all([
      ProgramaFormacion.query()
        .where('estado_programa', true)
        .preload('nivel')
        .orderBy('nombre_programa', 'asc'),
      Jornada.query().orderBy('id_jornada', 'asc'),
      scope.isAdmin
        ? TrainingCenter.query().preload('regional').orderBy('nombre', 'asc')
        : TrainingCenter.query()
            .where('id_cformacion', scope.idCformacion)
            .preload('regional')
            .orderBy('nombre', 'asc'),
    ])

    return {
      programas: programas.map((programa) => ({
        id: programa.id,
        codigo: programa.codigo,
        nombre: programa.nombre,
        version: programa.version,
        nivel: programa.nivel ? { id: programa.nivel.id, nombre: programa.nivel.nombre } : null,
      })),
      jornadas: jornadas.map((jornada) => ({ id: jornada.id, nombre: jornada.nombre })),
      centros: centros.map((centro) => ({
        id: centro.id,
        nombre: centro.nombre,
        regional: centro.regional?.nombre ?? '',
      })),
    }
  }

  private assertFechas(fechaInicio: DateTime | null, fechaFin: DateTime | null) {
    if (fechaInicio && fechaFin && fechaFin.toMillis() < fechaInicio.toMillis()) {
      throw new Exception('La fecha de fin no puede ser anterior a la fecha de inicio', {
        status: 422,
        code: 'E_VALIDATION_ERROR',
      })
    }
  }
}
