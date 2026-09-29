import db from '@adonisjs/lucid/services/db'
import { Exception } from '@adonisjs/core/exceptions'
import SubBodega from '#models/sub_bodega'
import Stand from '#models/stand'
import SubBodega from '#models/sub_bodega'
import {
  assertStandInScope,
  assertSubBodegaInScope,
  type AccessScope,
} from '#services/access_control'
import { rethrowDatabaseError } from '#services/database_error'

export type StandPayload = {
  idSubBodega?: number
  nombre?: string
  estado?: boolean
}

export default class StandService {
  async list(options: {
    idSubBodega: number
    page: number
    perPage: number
    search?: string
    estado?: boolean
  }) {
    await SubBodega.findOrFail(options.idSubBodega)

    const query = Stand.query()
      .where('id_sub_bodega', options.idSubBodega)
      .preload('subBodega')
  async list(
    scope: AccessScope,
    options: {
      idSubBodega: number
      page: number
      perPage: number
      search?: string
      estado?: boolean
    }
  ) {
    await SubBodega.findOrFail(options.idSubBodega)
    await assertSubBodegaInScope(scope, options.idSubBodega)

    const query = Stand.query()
      .where('id_sub_bodega', options.idSubBodega)
      .preload('subBodega', (subBodegaQuery) => subBodegaQuery.preload('bodega'))
      .orderBy('id_stand', 'asc')

    if (options.search) {
      query.whereILike('nombre', `%${options.search}%`)
    }

    if (options.estado !== undefined) {
      query.where('estado', options.estado)
    }

    return query.paginate(options.page, options.perPage)
  }

  async show(id: number) {
    return Stand.query()
      .where('id_stand', id)
      .preload('subBodega')
      .firstOrFail()
  }

  async create(idSubBodega: number, payload: StandPayload) {
    await SubBodega.findOrFail(idSubBodega)
  async show(scope: AccessScope, id: number) {
    await assertStandInScope(scope, id)

    return Stand.query()
      .where('id_stand', id)
      .preload('subBodega', (subBodegaQuery) => subBodegaQuery.preload('bodega'))
      .firstOrFail()
  }

  async create(
    scope: AccessScope,
    idSubBodega: number,
    payload: { nombre: string; estado?: boolean }
  ) {
    await SubBodega.findOrFail(idSubBodega)
    await assertSubBodegaInScope(scope, idSubBodega)

    try {
      const stand = await Stand.create({
        idSubBodega,
        nombre: payload.nombre,
        estado: payload.estado ?? true,
      })

      return this.show(scope, stand.id)
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo crear el stand')
    }
  }

  async update(scope: AccessScope, id: number, payload: StandPayload) {
    await assertStandInScope(scope, id)

    const stand = await Stand.findOrFail(id)

    if (payload.idSubBodega !== undefined) {
      await SubBodega.findOrFail(payload.idSubBodega)
    }

    stand.merge(payload)
    stand.merge({
      ...(payload.nombre !== undefined ? { nombre: payload.nombre } : {}),
      ...(payload.estado !== undefined ? { estado: payload.estado } : {}),
    })

    try {
      await stand.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo actualizar el stand')
    }

    return this.show(scope, id)
  }

  async remove(scope: AccessScope, id: number) {
    await assertStandInScope(scope, id)

    const stand = await Stand.findOrFail(id)

    const elementCount = await db
      .from('elemento')
      .where('id_stand', id)
      .count('* as total')

    const total = Number(elementCount[0].total)

    if (total > 0) {
      throw new Exception(
        'No se puede eliminar el stand porque tiene elementos asociados',
        {
          status: 409,
          code: 'E_STAND_HAS_ELEMENTS',
        }
      )
    }

    try {
      await stand.delete()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo eliminar el stand')
    }

    return { message: 'Stand eliminado correctamente' }
  }
}