import { Exception } from '@adonisjs/core/exceptions'
import Bodega from '#models/bodega'
import Stand from '#models/stand'
import { rethrowDatabaseError } from '#services/database_error'

export type BodegaPayload = {
  nombre?: string
  idCformacion?: number
  estado?: boolean
}

export default class BodegaService {
  async list(options: {
    page: number
    perPage: number
    search?: string
    idCformacion?: number
    estado?: boolean
  }) {
    const query = Bodega.query()
      .preload('trainingCenter')
      .preload('stands', (standsQuery) => standsQuery.orderBy('id_stand', 'asc'))
      .orderBy('id_bodega', 'asc')

    if (options.search) {
      query.whereILike('nombre', `%${options.search}%`)
    }

    if (options.idCformacion) {
      query.where('id_cformacion', options.idCformacion)
    }

    if (options.estado !== undefined) {
      query.where('estado', options.estado)
    }

    return query.paginate(options.page, options.perPage)
  }

  async show(id: number) {
    return Bodega.query()
      .where('id_bodega', id)
      .preload('trainingCenter')
      .preload('stands', (query) => query.orderBy('id_stand', 'asc'))
      .firstOrFail()
  }

  async create(
    payload: Required<Pick<BodegaPayload, 'nombre' | 'idCformacion'>> & Pick<BodegaPayload, 'estado'>
  ) {
    try {
      const bodega = await Bodega.create({
        nombre: payload.nombre,
        idCformacion: payload.idCformacion,
        estado: payload.estado ?? true,
      })

      return this.show(bodega.id)
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo crear la bodega')
    }
  }

  async update(id: number, payload: BodegaPayload) {
    const bodega = await Bodega.findOrFail(id)

    bodega.merge(payload)

    try {
      await bodega.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo actualizar la bodega')
    }

    return this.show(id)
  }

  async remove(id: number) {
    const bodega = await Bodega.findOrFail(id)
    const standCount = await Stand.query().where('id_bodega', id).count('* as total')
    const total = Number(standCount[0].$extras.total)

    if (total > 0) {
      throw new Exception('No se puede eliminar la bodega porque tiene stands asociados', {
        status: 409,
        code: 'E_BODEGA_HAS_STANDS',
      })
    }

    try {
      await bodega.delete()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo eliminar la bodega')
    }

    return { message: 'Bodega eliminada correctamente' }
  }
}
