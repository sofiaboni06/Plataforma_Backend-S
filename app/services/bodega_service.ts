import db from '@adonisjs/lucid/services/db'
import { Exception } from '@adonisjs/core/exceptions'
import Bodega from '#models/bodega'
import Stand from '#models/stand'

export type BodegaPayload = {
  nombre?: string
  idCformacion?: number
  estado?: boolean
}

export type StandPayload = {
  nombre?: string
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
    payload: Required<Pick<BodegaPayload, 'nombre' | 'idCformacion'>> &
      Pick<BodegaPayload, 'estado'>
  ) {
    try {
      const bodega = await Bodega.create({
        nombre: payload.nombre,
        idCformacion: payload.idCformacion,
        estado: payload.estado ?? true,
      })

      return this.show(bodega.id)
    } catch (error) {
      this.rethrowDatabaseError(error, 'No se pudo crear la bodega')
    }
  }

  async update(id: number, payload: BodegaPayload) {
    const bodega = await Bodega.findOrFail(id)

    bodega.merge(payload)

    try {
      await bodega.save()
    } catch (error) {
      this.rethrowDatabaseError(error, 'No se pudo actualizar la bodega')
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
      this.rethrowDatabaseError(error, 'No se pudo eliminar la bodega')
    }

    return { message: 'Bodega eliminada correctamente' }
  }

  async listStands(options: {
   id_bodega: number
    page: number
    perPage: number
    search?: string
    estado?: boolean
  }) {
    await Bodega.findOrFail(options.id_bodega)

    const query = Stand.query().where('id_bodega', options.id_bodega).orderBy('id_stand', 'asc')

    if (options.search) {
      query.whereILike('nombre', `%${options.search}%`)
    }

    if (options.estado !== undefined) {
      query.where('estado', options.estado)
    }

    return query.paginate(options.page, options.perPage)
  }

  async showStand(id: number) {
    return Stand.query().where('id_stand', id).preload('bodega').firstOrFail()
  }

  async createStand(id_bodega: number, payload: StandPayload) {
    await Bodega.findOrFail(id_bodega)

    try {
      const stand = await Stand.create({
        id_bodega: id_bodega,
        nombre: payload.nombre,
        estado: payload.estado ?? true,
      })

      return this.showStand(stand.id)
    } catch (error) {
      this.rethrowDatabaseError(error, 'No se pudo crear el stand')
    }
  }

  async updateStand(id: number, payload: StandPayload) {
    const stand = await Stand.findOrFail(id)
    stand.merge(payload)

    try {
      await stand.save()
    } catch (error) {
      this.rethrowDatabaseError(error, 'No se pudo actualizar el stand')
    }

    return this.showStand(id)
  }

  async removeStand(id: number) {
    const stand = await Stand.findOrFail(id)
    const elementCount = await db.from('elemento').where('id_stand', id).count('* as total')
    const total = Number(elementCount[0].total)

    if (total > 0) {
      throw new Exception('No se puede eliminar el stand porque tiene elementos asociados', {
        status: 409,
        code: 'E_STAND_HAS_ELEMENTS',
      })
    }

    try {
      await stand.delete()
    } catch (error) {
      this.rethrowDatabaseError(error, 'No se pudo eliminar el stand')
    }

    return { message: 'Stand eliminado correctamente' }
  }

  private rethrowDatabaseError(error: unknown, fallbackMessage: string): never {
    const code = (error as { code?: string })?.code

    if (code === '23505') {
      throw new Exception('Ya existe un registro con ese nombre en el mismo ámbito', {
        status: 409,
        code: 'E_DUPLICATE_NAME',
      })
    }

    if (code === '23503') {
      throw new Exception('La relación indicada no existe o está siendo utilizada', {
        status: 409,
        code: 'E_RELATION_CONSTRAINT',
      })
    }

    throw error instanceof Exception
      ? error
      : new Exception(fallbackMessage, { status: 500, code: 'E_DATABASE_ERROR' })
  }
}
