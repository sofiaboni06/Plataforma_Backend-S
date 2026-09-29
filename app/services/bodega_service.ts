import { Exception } from '@adonisjs/core/exceptions'
import Bodega from '#models/bodega'
import SubBodega from '#models/sub_bodega'
import { assertBodegaInScope, type AccessScope } from '#services/access_control'
import { rethrowDatabaseError } from '#services/database_error'

export type BodegaPayload = {
  nombre?: string
  idCformacion?: number
  estado?: boolean
}

export default class BodegaService {
  async list(
    scope: AccessScope,
    options: {
      page: number
      perPage: number
      search?: string
      idCformacion?: number
      estado?: boolean
    }
  ) {
    const query = Bodega.query()
      .preload('trainingCenter')
      .preload('subBodegas', (subBodegasQuery) =>
        subBodegasQuery.orderBy('id_sub_bodega', 'asc')
      )
      .preload('subBodegas', (subBodegasQuery) => {
        subBodegasQuery
          .orderBy('id_sub_bodega', 'asc')
          .preload('stands', (standsQuery) => standsQuery.orderBy('id_stand', 'asc'))
      })
      .orderBy('id_bodega', 'asc')

    if (scope.isAdmin) {
      if (options.idCformacion) {
        query.where('id_cformacion', options.idCformacion)
      }
    } else {
      // Each center only sees its own bodega, and only if it was assigned.
      query.where('id_cformacion', scope.idCformacion).whereIn('id_bodega', scope.bodegaIds)
    }

    if (options.search) {
      query.whereILike('nombre', `%${options.search}%`)
    }

    if (options.estado !== undefined) {
      query.where('estado', options.estado)
    }

    return query.paginate(options.page, options.perPage)
  }

  async show(scope: AccessScope, id: number) {
    await assertBodegaInScope(scope, id)

    return Bodega.query()
      .where('id_bodega', id)
      .preload('trainingCenter')
      .preload('subBodegas', (subBodegasQuery) =>
        subBodegasQuery.orderBy('id_sub_bodega', 'asc')
      )
      .preload('subBodegas', (subBodegasQuery) => {
        subBodegasQuery
          .orderBy('id_sub_bodega', 'asc')
          .preload('stands', (standsQuery) => standsQuery.orderBy('id_stand', 'asc'))
      })
      .firstOrFail()
  }

  async create(
    payload: Required<Pick<BodegaPayload, 'nombre' | 'idCformacion'>> &
      Pick<BodegaPayload, 'estado'>
    scope: AccessScope,
    payload: Pick<BodegaPayload, 'estado'> & { nombre: string; idCformacion?: number }
  ) {
    const idCformacion = scope.isAdmin
      ? (payload.idCformacion ?? scope.idCformacion)
      : scope.idCformacion

    try {
      const bodega = await Bodega.create({
        nombre: payload.nombre,
        idCformacion,
        estado: payload.estado ?? true,
      })

      return this.show(scope, bodega.id)
    } catch (error) {
      rethrowDatabaseError(
        error,
        'No se pudo crear la bodega'
      )
    }
  }

  async update(scope: AccessScope, id: number, payload: BodegaPayload) {
    await assertBodegaInScope(scope, id)

    const bodega = await Bodega.findOrFail(id)

    bodega.merge({
      ...(payload.nombre !== undefined ? { nombre: payload.nombre } : {}),
      ...(payload.estado !== undefined ? { estado: payload.estado } : {}),
      // Moving a bodega between training centers is an admin-only operation.
      ...(payload.idCformacion !== undefined && scope.isAdmin
        ? { idCformacion: payload.idCformacion }
        : {}),
    })

    try {
      await bodega.save()
    } catch (error) {
      rethrowDatabaseError(
        error,
        'No se pudo actualizar la bodega'
      )
    }

    return this.show(scope, id)
  }

  async remove(scope: AccessScope, id: number) {
    await assertBodegaInScope(scope, id)

    const bodega = await Bodega.findOrFail(id)

    const subBodegaCount = await SubBodega
      .query()
      .where('id_bodega', id)
      .count('* as total')

    const total = Number(subBodegaCount[0].$extras.total)

    if (total > 0) {
      throw new Exception(
        'No se puede eliminar la bodega porque tiene sub-bodegas asociadas',
        {
          status: 409,
          code: 'E_BODEGA_HAS_SUB_BODEGAS',
        }
      )
    const subBodegaCount = await SubBodega.query().where('id_bodega', id).count('* as total')
    const total = Number(subBodegaCount[0].$extras.total)

    if (total > 0) {
      throw new Exception('No se puede eliminar la bodega porque tiene sub-bodegas asociadas', {
        status: 409,
        code: 'E_BODEGA_HAS_SUB_BODEGAS',
      })
    }

    try {
      await bodega.delete()
    } catch (error) {
      rethrowDatabaseError(
        error,
        'No se pudo eliminar la bodega'
      )
    }

    return {
      message: 'Bodega eliminada correctamente',
    }
  }
}