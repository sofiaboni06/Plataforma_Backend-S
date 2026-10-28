import { Exception } from '@adonisjs/core/exceptions'
import { DateTime } from 'luxon'
import Vigencia from '#models/vigencia'
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

  private assertFechas(apertura: DateTime | null, cierre: DateTime | null) {
    if (apertura && cierre && cierre < apertura) {
      throw new Exception('La fecha de cierre no puede ser anterior a la de apertura', {
        status: 422,
        code: 'E_VALIDATION_ERROR',
      })
    }
  }
}
