import { Exception } from '@adonisjs/core/exceptions'
import db from '@adonisjs/lucid/services/db'
import CodigoEstandar from '#models/codigo_estandar'
import { assertOwnedByCenter, centerIdFor, type AccessScope } from '#services/access_control'
import { rethrowDatabaseError } from '#services/database_error'

type CodigoEstandarPayload = {
  idCformacion?: number
  codigo: string
  nombre: string
}

export default class CodigoEstandarService {
  async index(scope: AccessScope, options: { idCformacion?: number } = {}) {
    return CodigoEstandar.query()
      .where('id_cformacion', centerIdFor(scope, options.idCformacion))
      .orderBy('codigo', 'asc')
  }

  async show(scope: AccessScope, id: number) {
    const codigo = await CodigoEstandar.findOrFail(id)
    assertOwnedByCenter(
      scope,
      codigo.idCformacion,
      'Ese código UNSPSC no pertenece a tu centro de formación'
    )

    return codigo
  }

  async store(scope: AccessScope, payload: CodigoEstandarPayload) {
    try {
      return await CodigoEstandar.create({
        idCformacion: centerIdFor(scope, payload.idCformacion),
        codigo: payload.codigo,
        nombre: payload.nombre,
      })
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo crear el código UNSPSC')
    }
  }

  async update(scope: AccessScope, id: number, payload: Partial<CodigoEstandarPayload>) {
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
