import { Exception } from '@adonisjs/core/exceptions'
import ClasificacionElemento from '#models/clasificacion_elemento'
import { assertCan, type AccessScope } from '#services/access_control'
import { rethrowDatabaseError } from '#services/database_error'

type ClasificacionPayload = {
  nombre: string
  estado?: boolean
}

export default class ClasificacionElementoService {
  async index(options: { estado?: boolean } = {}) {
    return ClasificacionElemento.query()
      .where('estado', options.estado ?? true)
      .orderBy('nombre', 'asc')
  }

  async show(id: number) {
    return ClasificacionElemento.findOrFail(id)
  }

  async store(payload: ClasificacionPayload) {
    try {
      return await ClasificacionElemento.create({
        nombre: payload.nombre,
        estado: payload.estado ?? true,
      })
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo crear la clasificación')
    }
  }

  async update(scope: AccessScope, id: number, payload: Partial<ClasificacionPayload>) {
    const clasificacion = await ClasificacionElemento.findOrFail(id)

    if (payload.estado !== undefined && payload.estado !== clasificacion.estado) {
      assertCan(scope, 'clasificacion_elemento.eliminar')
    }

    clasificacion.merge({
      ...(payload.nombre !== undefined ? { nombre: payload.nombre } : {}),
      ...(payload.estado !== undefined ? { estado: payload.estado } : {}),
    })

    try {
      await clasificacion.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo actualizar la clasificación')
    }

    return clasificacion
  }

  /**
   * Soft delete. Elementos keep the foreign key, so the name stays on old
   * stock rows. The select only lists active classifications.
   */
  async remove(id: number) {
    const clasificacion = await ClasificacionElemento.findOrFail(id)

    if (clasificacion.estado === false) {
      throw new Exception('La clasificación ya está deshabilitada', {
        status: 409,
        code: 'E_ALREADY_DISABLED',
      })
    }

    clasificacion.estado = false

    try {
      await clasificacion.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo deshabilitar la clasificación')
    }

    return { message: 'Clasificación deshabilitada correctamente' }
  }
}
