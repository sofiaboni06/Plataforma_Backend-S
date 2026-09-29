import { Exception } from '@adonisjs/core/exceptions'
import UsoPresupuestal from '#models/uso_presupuestal'
import {
  assertCan,
  assertOwnedByCenter,
  centerIdFor,
  type AccessScope,
} from '#services/access_control'
import { rethrowDatabaseError } from '#services/database_error'

type UsoPresupuestalPayload = {
  idCformacion?: number
  nombre: string
  estado?: boolean
}

export default class UsoPresupuestalService {
  async index(scope: AccessScope, options: { estado?: boolean; idCformacion?: number } = {}) {
    return UsoPresupuestal.query()
      .where('id_cformacion', centerIdFor(scope, options.idCformacion))
      .where('estado', options.estado ?? true)
      .orderBy('nombre', 'asc')
  }

  async show(scope: AccessScope, id: number) {
    const uso = await UsoPresupuestal.findOrFail(id)
    assertOwnedByCenter(
      scope,
      uso.idCformacion,
      'Ese uso presupuestal no pertenece a tu centro de formación'
    )

    return uso
  }

  async store(scope: AccessScope, payload: UsoPresupuestalPayload) {
    try {
      return await UsoPresupuestal.create({
        idCformacion: centerIdFor(scope, payload.idCformacion),
        nombre: payload.nombre,
        estado: payload.estado ?? true,
      })
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo crear el uso presupuestal')
    }
  }

  async update(scope: AccessScope, id: number, payload: Partial<UsoPresupuestalPayload>) {
    const uso = await this.show(scope, id)

    if (payload.estado !== undefined && payload.estado !== uso.estado) {
      assertCan(scope, 'uso_presupuestal.eliminar')
    }

    uso.merge({
      ...(payload.nombre !== undefined ? { nombre: payload.nombre } : {}),
      ...(payload.estado !== undefined ? { estado: payload.estado } : {}),
    })

    try {
      await uso.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo actualizar el uso presupuestal')
    }

    return uso
  }

  /**
   * Soft delete. Elementos keep the foreign key, so the name stays on old
   * stock rows. The select only lists active budget uses.
   */
  async remove(scope: AccessScope, id: number) {
    const uso = await this.show(scope, id)

    if (uso.estado === false) {
      throw new Exception('El uso presupuestal ya está deshabilitado', {
        status: 409,
        code: 'E_ALREADY_DISABLED',
      })
    }

    uso.estado = false

    try {
      await uso.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo deshabilitar el uso presupuestal')
    }

    return { message: 'Uso presupuestal deshabilitado correctamente' }
  }
}
