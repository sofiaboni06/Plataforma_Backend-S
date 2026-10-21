import { Exception } from '@adonisjs/core/exceptions'
import LineaTematica from '#models/linea_tematica'
import { rethrowDatabaseError } from '#services/database_error'

type LineaTematicaPayload = {
  nombre: string
  descripcion?: string | null
  estado?: boolean
}

export default class LineaTematicaService {
  async index(options: { estado?: boolean; search?: string } = {}) {
    const query = LineaTematica.query()
      .preload('redesConocimiento', (redes) => redes.orderBy('red_conocimiento', 'asc'))
      .where('estado', options.estado ?? true)
      .orderBy('linea_tematica', 'asc')

    if (options.search) {
      query.whereILike('linea_tematica', `%${options.search}%`)
    }

    return query
  }

  async show(id: number) {
    return LineaTematica.query()
      .where('id_linea_tematica', id)
      .preload('redesConocimiento', (redes) => redes.orderBy('red_conocimiento', 'asc'))
      .firstOrFail()
  }

  async store(payload: LineaTematicaPayload) {
    try {
      const linea = await LineaTematica.create({
        nombre: payload.nombre,
        descripcion: payload.descripcion ?? null,
        estado: payload.estado ?? true,
      })

      return this.show(linea.id)
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo crear la línea temática')
    }
  }

  async update(id: number, payload: Partial<LineaTematicaPayload>) {
    const linea = await this.show(id)

    linea.merge({
      ...(payload.nombre !== undefined ? { nombre: payload.nombre } : {}),
      ...(payload.descripcion !== undefined ? { descripcion: payload.descripcion } : {}),
      ...(payload.estado !== undefined ? { estado: payload.estado } : {}),
    })

    try {
      await linea.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo actualizar la línea temática')
    }

    return this.show(id)
  }

  async remove(id: number) {
    const linea = await this.show(id)

    if (linea.estado === false) {
      throw new Exception('La línea temática ya está deshabilitada', {
        status: 409,
        code: 'E_ALREADY_DISABLED',
      })
    }

    linea.estado = false

    try {
      await linea.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo deshabilitar la línea temática')
    }

    return { message: 'Línea temática deshabilitada correctamente' }
  }

  async options() {
    return LineaTematica.query().where('estado', true).orderBy('linea_tematica', 'asc')
  }
}
