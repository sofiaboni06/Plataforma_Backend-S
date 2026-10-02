import { Exception } from '@adonisjs/core/exceptions'
import db from '@adonisjs/lucid/services/db'
import CodigoEstandar from '#models/codigo_estandar'
import { assertPlatformCatalog, type AccessScope } from '#services/access_control'
import { rethrowDatabaseError } from '#services/database_error'

type CodigoEstandarPayload = {
  codigo: string
  nombre: string
}

export default class CodigoEstandarService {
  async index(_scope: AccessScope) {
    return CodigoEstandar.query().orderBy('codigo', 'asc')
  }

  async show(_scope: AccessScope, id: number) {
    return CodigoEstandar.findOrFail(id)
  }

  async store(scope: AccessScope, payload: CodigoEstandarPayload) {
    assertPlatformCatalog(scope)

    try {
      return await CodigoEstandar.create({
        codigo: payload.codigo,
        nombre: payload.nombre,
      })
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo crear el código UNSPSC')
    }
  }

  async update(scope: AccessScope, id: number, payload: Partial<CodigoEstandarPayload>) {
    assertPlatformCatalog(scope)
    const codigo = await this.show(scope, id)

    codigo.merge({
      ...(payload.codigo !== undefined ? { codigo: payload.codigo } : {}),
      ...(payload.nombre !== undefined ? { nombre: payload.nombre } : {}),
    })

    try {
      await codigo.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo actualizar el código UNSPSC')
    }

    return codigo
  }

  /**
   * Hard delete. The row goes away only when no elemento still points at it.
   */
  async remove(scope: AccessScope, id: number) {
    assertPlatformCatalog(scope)
    const codigo = await this.show(scope, id)
    const rows = await db
      .from('elemento')
      .where('id_codigo_estandar', codigo.id)
      .count('* as total')

    if (Number(rows[0].total) > 0) {
      throw new Exception(
        'No se puede eliminar el código UNSPSC porque hay elementos que lo usan',
        { status: 409, code: 'E_CODIGO_EN_USO' }
      )
    }

    try {
      await codigo.delete()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo eliminar el código UNSPSC')
    }

    return { message: 'Código UNSPSC eliminado correctamente' }
  }
}
