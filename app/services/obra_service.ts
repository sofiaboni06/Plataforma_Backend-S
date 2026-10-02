import { Exception } from '@adonisjs/core/exceptions'
import Obra from '#models/obra'
import {
  assertCan,
  assertOwnedByCenter,
  centerIdFor,
  type AccessScope,
} from '#services/access_control'
import { rethrowDatabaseError } from '#services/database_error'

type ObraPayload = {
  idCformacion?: number
  nombre: string
  lugar?: string | null
  estado?: boolean
}

/**
 * Obra belongs to the training center of whoever creates it, never to a
 * bodega. It is the "center" of the material delivery flow: solicitud_material
 * and solicitud_equipo hang from it, but this service only touches the obra.
 */
export default class ObraService {
  async index(scope: AccessScope, options: { estado?: boolean; idCformacion?: number } = {}) {
    return Obra.query()
      .where('id_cformacion', centerIdFor(scope, options.idCformacion))
      .where('estado', options.estado ?? true)
      .orderBy('nombre', 'asc')
  }

  async show(scope: AccessScope, id: number) {
    const obra = await Obra.findOrFail(id)
    assertOwnedByCenter(scope, obra.idCformacion, 'Esa obra no pertenece a tu centro de formación')

    return obra
  }

  async store(scope: AccessScope, payload: ObraPayload) {
    try {
      return await Obra.create({
        idCformacion: centerIdFor(scope, payload.idCformacion),
        nombre: payload.nombre,
        lugar: payload.lugar ?? null,
        estado: payload.estado ?? true,
      })
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo crear la obra')
    }
  }

  async update(scope: AccessScope, id: number, payload: Partial<ObraPayload>) {
    const obra = await this.show(scope, id)

    if (payload.estado !== undefined && payload.estado !== obra.estado) {
      assertCan(scope, 'obra.eliminar')
    }

    obra.merge({
      ...(payload.nombre !== undefined ? { nombre: payload.nombre } : {}),
      ...(payload.lugar !== undefined ? { lugar: payload.lugar } : {}),
      ...(payload.estado !== undefined ? { estado: payload.estado } : {}),
    })

    try {
      await obra.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo actualizar la obra')
    }

    return obra
  }

  /**
   * "Apagar" is a soft delete: estado goes to false. The row stays so the
   * solicitudes that point to it keep their obra, and the list hides it.
   */
  async remove(scope: AccessScope, id: number) {
    const obra = await this.show(scope, id)

    if (obra.estado === false) {
      throw new Exception('La obra ya está deshabilitada', {
        status: 409,
        code: 'E_ALREADY_DISABLED',
      })
    }

    obra.estado = false

    try {
      await obra.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo deshabilitar la obra')
    }

    return { message: 'Obra deshabilitada correctamente' }
  }
}
