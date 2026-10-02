import { Exception } from '@adonisjs/core/exceptions'
import UnidadMedida from '#models/unidad_medida'
import { assertCan, assertPlatformCatalog, type AccessScope } from '#services/access_control'
import { rethrowDatabaseError } from '#services/database_error'

type UnidadMedidaPayload = {
  nombre: string
  abreviatura: string
  estado?: boolean
}

export default class UnidadMedidaService {
  async index(_scope: AccessScope, options: { estado?: boolean } = {}) {
    const query = UnidadMedida.query().orderBy('nombre', 'asc')

    const estado = options.estado ?? true
    if (estado) {
      query.where((builder) => builder.where('estado', true).orWhereNull('estado'))
    } else {
      query.where('estado', false)
    }

    return query
  }

  async show(_scope: AccessScope, id: number) {
    return UnidadMedida.findOrFail(id)
  }

  async store(scope: AccessScope, payload: UnidadMedidaPayload) {
    assertPlatformCatalog(scope)

    try {
      return await UnidadMedida.create({
        nombre: payload.nombre,
        abreviatura: payload.abreviatura,
        estado: payload.estado ?? true,
      })
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo crear la unidad de medida')
    }
  }

  async update(scope: AccessScope, id: number, payload: Partial<UnidadMedidaPayload>) {
    assertPlatformCatalog(scope)
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
    assertPlatformCatalog(scope)
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
