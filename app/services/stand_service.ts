import db from '@adonisjs/lucid/services/db'
import { Exception } from '@adonisjs/core/exceptions'
import SubBodega from '#models/sub_bodega'
import Stand from '#models/stand'
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

    try {
      const stand = await Stand.create({
        idSubBodega,
        nombre: payload.nombre,
        estado: payload.estado ?? true,
      })

      return this.show(stand.id)
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo crear el stand')
    }
  }

  async update(id: number, payload: StandPayload) {
    const stand = await Stand.findOrFail(id)

    if (payload.idSubBodega !== undefined) {
      await SubBodega.findOrFail(payload.idSubBodega)
    }

    stand.merge(payload)

    try {
      await stand.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo actualizar el stand')
    }

    return this.show(id)
  }

  async remove(id: number) {
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