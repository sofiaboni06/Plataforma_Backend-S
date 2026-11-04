import { Exception } from '@adonisjs/core/exceptions'
import { DateTime } from 'luxon'
import Vigencia from '#models/vigencia'
import VigenciaEspecial from '#models/vigencia_especial'
import VigenciaEspecialPrograma from '#models/vigencia_especial_programa'
import { assertCan, type AccessScope } from '#services/access_control'
import { rethrowDatabaseError } from '#services/database_error'

type VigenciaPayload = {
  anio: number
  activa?: boolean
  fechaApertura?: DateTime | null
  fechaCierre?: DateTime | null
}

export default class VigenciaService {
  async index(scope: AccessScope) {
    assertCan(scope, 'vigencia.ver')
    return Vigencia.query().orderBy('anio', 'desc')
  }

  async activa(scope: AccessScope) {
    assertCan(scope, 'vigencia.ver')
    return Vigencia.query().where('activa', true).first()
  }

  async store(scope: AccessScope, payload: VigenciaPayload) {
    assertCan(scope, 'vigencia.crear')
    this.assertFechas(payload.fechaApertura ?? null, payload.fechaCierre ?? null)

    try {
      if (payload.activa) {
        await Vigencia.query().update({ activa: false })
      }

      return await Vigencia.create({
        anio: payload.anio,
        activa: payload.activa ?? false,
        fechaApertura: payload.fechaApertura ?? null,
        fechaCierre: payload.fechaCierre ?? null,
      })
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo crear la vigencia')
    }
  }

  async update(scope: AccessScope, anio: number, payload: Omit<VigenciaPayload, 'anio'>) {
    assertCan(scope, 'vigencia.editar')
    const vigencia = await Vigencia.findOrFail(anio)
    const apertura = payload.fechaApertura !== undefined ? payload.fechaApertura : vigencia.fechaApertura
    const cierre = payload.fechaCierre !== undefined ? payload.fechaCierre : vigencia.fechaCierre
    this.assertFechas(apertura, cierre)

    try {
      if (payload.activa === true) {
        await Vigencia.query().whereNot('anio', anio).update({ activa: false })
      }

      vigencia.merge({
        ...(payload.activa !== undefined ? { activa: payload.activa } : {}),
        ...(payload.fechaApertura !== undefined ? { fechaApertura: payload.fechaApertura } : {}),
        ...(payload.fechaCierre !== undefined ? { fechaCierre: payload.fechaCierre } : {}),
      })
      await vigencia.save()
      return vigencia
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo actualizar la vigencia')
    }
  }

  async remove(scope: AccessScope, anio: number) {
    assertCan(scope, 'vigencia.eliminar')
    const vigencia = await Vigencia.findOrFail(anio)
    try {
      await vigencia.delete()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo eliminar la vigencia porque hay solicitudes asociadas')
    }
    return { message: 'Vigencia eliminada' }
  }

  async especiales(scope: AccessScope, anio: number) {
    assertCan(scope, 'vigencia.ver')
    await Vigencia.findOrFail(anio)
    return VigenciaEspecial.query()
      .where('anio', anio)
      .where('idCformacion', scope.idCformacion)
      .preload('programas', (query) => query.preload('programa'))
      .orderBy('id', 'desc')
  }

  async crearEspecial(
    scope: AccessScope,
    anio: number,
    payload: { nombre: string; monto?: number }
  ) {
    assertCan(scope, 'vigencia.crear')
    await Vigencia.findOrFail(anio)
    try {
      return await VigenciaEspecial.create({
        anio,
        idCformacion: scope.idCformacion,
        nombre: payload.nombre,
        monto: payload.monto ?? 0,
        activa: true,
      })
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo crear la vigencia especial')
    }
  }

  async actualizarEspecial(
    scope: AccessScope,
    anio: number,
    id: number,
    payload: { nombre?: string; monto?: number; activa?: boolean }
  ) {
    assertCan(scope, 'vigencia.editar')
    const especial = await this.especialDelCentro(scope, anio, id)
    especial.merge({
      ...(payload.nombre !== undefined ? { nombre: payload.nombre } : {}),
      ...(payload.monto !== undefined ? { monto: payload.monto } : {}),
      ...(payload.activa !== undefined ? { activa: payload.activa } : {}),
    })
    try {
      await especial.save()
      return especial
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo actualizar la vigencia especial')
    }
  }

  async agregarPrograma(scope: AccessScope, anio: number, id: number, programaId: number) {
    assertCan(scope, 'vigencia.editar')
    const especial = await this.especialDelCentro(scope, anio, id)
    const ocupado = await VigenciaEspecialPrograma.query()
      .where('programaId', programaId)
      .whereIn(
        'vigenciaEspecialId',
        VigenciaEspecial.query()
          .where('anio', anio)
          .where('idCformacion', scope.idCformacion)
          .select('id')
      )
      .first()
    if (ocupado) {
      throw new Exception('Ese programa ya está en una vigencia especial de este año', {
        status: 409,
        code: 'E_CONFLICT',
      })
    }

    try {
      await VigenciaEspecialPrograma.create({
        vigenciaEspecialId: especial.id,
        programaId,
      })
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo agregar el programa a la vigencia especial')
    }

    await especial.load('programas', (query) => query.preload('programa'))
    return especial
  }

  async quitarPrograma(scope: AccessScope, anio: number, id: number, programaId: number) {
    assertCan(scope, 'vigencia.editar')
    await this.especialDelCentro(scope, anio, id)
    const fila = await VigenciaEspecialPrograma.query()
      .where('vigenciaEspecialId', id)
      .where('programaId', programaId)
      .first()
    if (!fila) {
      throw new Exception('El programa no está en esta vigencia especial', {
        status: 404,
        code: 'E_ROW_NOT_FOUND',
      })
    }
    await fila.delete()
    return { message: 'Programa retirado de la vigencia especial' }
  }

  private async especialDelCentro(scope: AccessScope, anio: number, id: number) {
    const especial = await VigenciaEspecial.query()
      .where('id', id)
      .where('anio', anio)
      .where('idCformacion', scope.idCformacion)
      .first()
    if (!especial) {
      throw new Exception('La vigencia especial no existe en este centro', {
        status: 404,
        code: 'E_ROW_NOT_FOUND',
      })
    }
    return especial
  }

  private assertFechas(apertura: DateTime | null, cierre: DateTime | null) {
    if (apertura && cierre && cierre < apertura) {
      throw new Exception('La fecha de cierre no puede ser anterior a la de apertura', {
        status: 422,
        code: 'E_VALIDATION_ERROR',
      })
    }
  }
}
