import { Exception } from '@adonisjs/core/exceptions'
import ClasificacionElemento from '#models/clasificacion_elemento'
import {
  assertCan,
  assertOwnedByCenter,
  centerIdFor,
  type AccessScope,
} from '#services/access_control'
import { rethrowDatabaseError } from '#services/database_error'

type ClasificacionPayload = {
  idCformacion?: number
  nombre: string
  estado?: boolean
}

export default class ClasificacionElementoService {
  async index(scope: AccessScope, options: { estado?: boolean; idCformacion?: number } = {}) {
    return ClasificacionElemento.query()
      .where('id_cformacion', centerIdFor(scope, options.idCformacion))
      .where('estado', options.estado ?? true)
      .orderBy('nombre', 'asc')
  }

  async show(scope: AccessScope, id: number) {
    const clasificacion = await ClasificacionElemento.findOrFail(id)
    assertOwnedByCenter(
      scope,
      clasificacion.idCformacion,
      'Esa clasificación no pertenece a tu centro de formación'
    )

    return clasificacion
  }

  async store(scope: AccessScope, payload: ClasificacionPayload) {
    try {
      return await ClasificacionElemento.create({
        idCformacion: centerIdFor(scope, payload.idCformacion),
        nombre: payload.nombre,
        estado: payload.estado ?? true,
      })
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo crear la clasificación')
    }
  }

  async update(scope: AccessScope, id: number, payload: Partial<ClasificacionPayload>) {
    const clasificacion = await this.show(scope, id)

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
  async remove(scope: AccessScope, id: number) {
    const clasificacion = await this.show(scope, id)

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
