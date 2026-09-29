import { Exception } from '@adonisjs/core/exceptions'
import UnidadMedida from '#models/unidad_medida'
import {
  assertCan,
  assertOwnedByCenter,
  centerIdFor,
  type AccessScope,
} from '#services/access_control'
import { rethrowDatabaseError } from '#services/database_error'

type UnidadMedidaPayload = {
  idCformacion?: number
  nombre: string
  abreviatura: string
  estado?: boolean
}

export default class UnidadMedidaService {
  async index(scope: AccessScope, options: { estado?: boolean; idCformacion?: number } = {}) {
    const query = UnidadMedida.query()
      .where('id_cformacion', centerIdFor(scope, options.idCformacion))
      .orderBy('nombre', 'asc')

    const estado = options.estado ?? true
    if (estado) {
      query.where((builder) => builder.where('estado', true).orWhereNull('estado'))
    } else {
      query.where('estado', false)
    }

    return query
  }

  async show(scope: AccessScope, id: number) {
    const unidad = await UnidadMedida.findOrFail(id)
    assertOwnedByCenter(
      scope,
      unidad.idCformacion,
      'Esa unidad de medida no pertenece a tu centro de formación'
    )

    return unidad
  }

  async store(scope: AccessScope, payload: UnidadMedidaPayload) {
    try {
      return await UnidadMedida.create({
        idCformacion: centerIdFor(scope, payload.idCformacion),
        nombre: payload.nombre,
        abreviatura: payload.abreviatura,
        estado: payload.estado ?? true,
      })
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo crear la unidad de medida')
    }
  }

  async update(scope: AccessScope, id: number, payload: Partial<UnidadMedidaPayload>) {
    const unidad = await this.show(scope, id)

    if (payload.estado !== undefined && payload.estado !== unidad.estado) {
      assertCan(scope, 'unidad_medida.eliminar')
    }

    unidad.merge({
      ...(payload.nombre !== undefined ? { nombre: payload.nombre } : {}),
      ...(payload.abreviatura !== undefined ? { abreviatura: payload.abreviatura } : {}),
      ...(payload.estado !== undefined ? { estado: payload.estado } : {}),
    })

    try {
      await unidad.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo actualizar la unidad de medida')
    }

    return unidad
  }

  /**
   * Soft delete. Elementos keep the foreign key. The select only lists active
   * units, treating a null estado from the original dump as active.
   */
  async remove(scope: AccessScope, id: number) {
    const unidad = await this.show(scope, id)

    if (unidad.estado === false) {
      throw new Exception('La unidad de medida ya está deshabilitada', {
        status: 409,
        code: 'E_ALREADY_DISABLED',
      })
    }

    unidad.estado = false

    try {
      await unidad.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo deshabilitar la unidad de medida')
    }

    return { message: 'Unidad de medida deshabilitada correctamente' }
  }
}
