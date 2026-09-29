import { Exception } from '@adonisjs/core/exceptions'
import UsoPresupuestal from '#models/uso_presupuestal'
import { assertCan, type AccessScope } from '#services/access_control'
import { rethrowDatabaseError } from '#services/database_error'

type UsoPresupuestalPayload = {
  nombre: string
  estado?: boolean
}

export default class UsoPresupuestalService {
  async index(options: { estado?: boolean } = {}) {
    return UsoPresupuestal.query()
      .where('estado', options.estado ?? true)
      .orderBy('nombre', 'asc')
  }

  async show(id: number) {
    return UsoPresupuestal.findOrFail(id)
  }

  async store(payload: UsoPresupuestalPayload) {
    try {
      return await UsoPresupuestal.create({
        nombre: payload.nombre,
        estado: payload.estado ?? true,
      })
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo crear el uso presupuestal')
    }
  }

  async update(scope: AccessScope, id: number, payload: Partial<UsoPresupuestalPayload>) {
    const uso = await UsoPresupuestal.findOrFail(id)

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
  async remove(id: number) {
    const uso = await UsoPresupuestal.findOrFail(id)

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
