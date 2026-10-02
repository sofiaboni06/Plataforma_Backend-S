import { Exception } from '@adonisjs/core/exceptions'
import Actividad from '#models/actividad'
import { rethrowDatabaseError } from '#services/database_error'

export default class ActividadService {
  async index(options: { estado?: boolean } = {}) {
    const query = Actividad.query().orderBy('id_actividad', 'asc')

    if (options.estado !== undefined) {
      query.where('estado', options.estado)
    }

    return query
  }

  async show(id: number) {
    const actividad = await Actividad.find(id)

    if (!actividad) {
      throw new Exception('La actividad no existe', {
        status: 404,
        code: 'E_NOT_FOUND',
      })
    }

    return actividad
  }

  async store(payload: {
    nombre: string
    lugar?: string
    estado?: boolean
  }) {
    try {
      return await Actividad.create({
        nombre: payload.nombre,
        lugar: payload.lugar?.trim() || null,
        estado: payload.estado ?? true,
      })
    } catch (error) {
      rethrowDatabaseError(
        error,
        'No se pudo crear la actividad',
      )
    }
  }

  async update(
    id: number,
    payload: {
      nombre?: string
      lugar?: string
      estado?: boolean
    },
  ) {
    const actividad = await this.show(id)

    actividad.merge({
      ...(payload.nombre !== undefined
        ? { nombre: payload.nombre }
        : {}),
      ...(payload.lugar !== undefined
        ? { lugar: payload.lugar.trim() || null }
        : {}),
      ...(payload.estado !== undefined
        ? { estado: payload.estado }
        : {}),
    })

    try {
      await actividad.save()
    } catch (error) {
      rethrowDatabaseError(
        error,
        'No se pudo actualizar la actividad',
      )
    }

    return actividad
  }

  async remove(id: number) {
    const actividad = await this.show(id)

    // No eliminamos físicamente porque puede tener préstamos relacionados.
    actividad.estado = false

    try {
      await actividad.save()
    } catch (error) {
      rethrowDatabaseError(
        error,
        'No se pudo deshabilitar la actividad',
      )
    }

    return {
      message: 'Actividad deshabilitada correctamente',
    }
  }
}