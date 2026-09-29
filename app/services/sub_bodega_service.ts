import db from '@adonisjs/lucid/services/db'
import { Exception } from '@adonisjs/core/exceptions'
import Bodega from '#models/bodega'
import SubBodega from '#models/sub_bodega'
import { rethrowDatabaseError } from '#services/database_error'

export default class SubBodegaService {
  async index(idBodega: number) {
    await Bodega.findOrFail(idBodega)

    return SubBodega.query()
      .where('id_bodega', idBodega)
      .preload('bodega')
      .preload('stands', (query) =>
        query.orderBy('id_stand', 'asc')
      )
      .orderBy('id_sub_bodega', 'asc')
  }

  async show(id: number) {
    return SubBodega.query()
      .where('id_sub_bodega', id)
      .preload('bodega')
      .preload('stands')
      .firstOrFail()
  }

  async store(payload: {
    idBodega: number
    nombre: string
    estado?: boolean
  }) {
    await Bodega.findOrFail(payload.idBodega)

    try {
      const subBodega = await SubBodega.create({
        idBodega: payload.idBodega,
        nombre: payload.nombre,
        estado: payload.estado ?? true,
      })

      return this.show(subBodega.id)
    } catch (error) {
      rethrowDatabaseError(
        error,
        'No se pudo crear la sub-bodega'
      )
    }
  }

  async update(
    id: number,
    payload: {
      idBodega?: number
      nombre?: string
      estado?: boolean
    }
  ) {
    const subBodega = await SubBodega.findOrFail(id)

    if (payload.idBodega !== undefined) {
      await Bodega.findOrFail(payload.idBodega)
    }

    subBodega.merge({
      ...(payload.idBodega !== undefined
        ? { idBodega: payload.idBodega }
        : {}),
      ...(payload.nombre !== undefined
        ? { nombre: payload.nombre }
        : {}),
      ...(payload.estado !== undefined
        ? { estado: payload.estado }
        : {}),
    })

    try {
      await subBodega.save()
    } catch (error) {
      rethrowDatabaseError(
        error,
        'No se pudo actualizar la sub-bodega'
      )
    }

    return this.show(id)
  }

  async remove(id: number) {
    const subBodega = await SubBodega.findOrFail(id)

    const standCount = await db
      .from('stand')
      .where('id_sub_bodega', id)
      .count('* as total')

    const total = Number(standCount[0].total)

    if (total > 0) {
      throw new Exception(
        'No se puede eliminar la sub-bodega porque tiene stands asociados',
        {
          status: 409,
          code: 'E_SUB_BODEGA_HAS_STANDS',
        }
      )
    }

    try {
      await subBodega.delete()
    } catch (error) {
      rethrowDatabaseError(
        error,
        'No se pudo eliminar la sub-bodega'
      )
    }

    return {
      message: 'Sub-bodega eliminada correctamente',
    }
  }
}