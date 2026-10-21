import { Exception } from '@adonisjs/core/exceptions'
import LineaTematica from '#models/linea_tematica'
import RedConocimiento from '#models/red_conocimiento'
import { rethrowDatabaseError } from '#services/database_error'

type RedConocimientoPayload = {
  nombre: string
  nombreGestor?: string | null
  telGestor?: string | null
  mailGestor?: string | null
  nombreAsesor?: string | null
  telAsesor?: string | null
  mailAsesor?: string | null
  estado?: boolean
  lineaIds?: number[]
}

export default class RedConocimientoService {
  async index(options: { estado?: boolean; search?: string } = {}) {
    const query = RedConocimiento.query()
      .preload('lineasTematicas', (lineas) => lineas.orderBy('linea_tematica', 'asc'))
      .where('estado', options.estado ?? true)
      .orderBy('red_conocimiento', 'asc')

    if (options.search) {
      query.whereILike('red_conocimiento', `%${options.search}%`)
    }

    return query
  }

  async show(id: number) {
    return RedConocimiento.query()
      .where('id_red_conocimiento', id)
      .preload('lineasTematicas', (lineas) => lineas.orderBy('linea_tematica', 'asc'))
      .firstOrFail()
  }

  async store(payload: RedConocimientoPayload) {
    if (payload.lineaIds !== undefined) {
      await this.assertLineasExisten(payload.lineaIds)
    }

    try {
      const red = await RedConocimiento.create({
        nombre: payload.nombre,
        nombreGestor: payload.nombreGestor ?? null,
        telGestor: payload.telGestor ?? null,
        mailGestor: payload.mailGestor ?? null,
        nombreAsesor: payload.nombreAsesor ?? null,
        telAsesor: payload.telAsesor ?? null,
        mailAsesor: payload.mailAsesor ?? null,
        estado: payload.estado ?? true,
      })

      if (payload.lineaIds !== undefined) {
        await red.related('lineasTematicas').sync([...new Set(payload.lineaIds)])
      }

      return this.show(red.id)
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo crear la red de conocimiento')
    }
  }

  async update(id: number, payload: Partial<RedConocimientoPayload>) {
    const red = await this.show(id)

    if (payload.lineaIds !== undefined) {
      await this.assertLineasExisten(payload.lineaIds)
    }

    red.merge({
      ...(payload.nombre !== undefined ? { nombre: payload.nombre } : {}),
      ...(payload.nombreGestor !== undefined ? { nombreGestor: payload.nombreGestor } : {}),
      ...(payload.telGestor !== undefined ? { telGestor: payload.telGestor } : {}),
      ...(payload.mailGestor !== undefined ? { mailGestor: payload.mailGestor } : {}),
      ...(payload.nombreAsesor !== undefined ? { nombreAsesor: payload.nombreAsesor } : {}),
      ...(payload.telAsesor !== undefined ? { telAsesor: payload.telAsesor } : {}),
      ...(payload.mailAsesor !== undefined ? { mailAsesor: payload.mailAsesor } : {}),
      ...(payload.estado !== undefined ? { estado: payload.estado } : {}),
    })

    try {
      await red.save()

      if (payload.lineaIds !== undefined) {
        await red.related('lineasTematicas').sync([...new Set(payload.lineaIds)])
      }
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo actualizar la red de conocimiento')
    }

    return this.show(id)
  }

  async syncLineas(id: number, lineaIds: number[]) {
    const red = await RedConocimiento.findOrFail(id)
    const uniqueIds = [...new Set(lineaIds)]

    await this.assertLineasExisten(uniqueIds)

    try {
      await red.related('lineasTematicas').sync(uniqueIds)
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudieron asociar las líneas temáticas')
    }

    return this.show(id)
  }

  async remove(id: number) {
    const red = await this.show(id)

    if (red.estado === false) {
      throw new Exception('La red de conocimiento ya está deshabilitada', {
        status: 409,
        code: 'E_ALREADY_DISABLED',
      })
    }

    red.estado = false

    try {
      await red.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo deshabilitar la red de conocimiento')
    }

    return { message: 'Red de conocimiento deshabilitada correctamente' }
  }

  async options() {
    return RedConocimiento.query()
      .where('estado', true)
      .preload('lineasTematicas', (lineas) => {
        lineas.where('estado', true).orderBy('linea_tematica', 'asc')
      })
      .orderBy('red_conocimiento', 'asc')
  }

  /**
   * `programa_formacion` saves the pair (red, línea) and the database enforces
   * it against `redes_conocimiento_lineas_tematicas`. This check gives the
   * frontend a 422 with a readable message before touching the table.
   */
  private async assertLineasExisten(lineaIds: number[]) {
    if (!lineaIds.length) {
      return
    }

    const lineas = await LineaTematica.query().whereIn('id_linea_tematica', lineaIds)

    if (lineas.length !== lineaIds.length) {
      throw new Exception('Hay una línea temática que no existe', {
        status: 422,
        code: 'E_VALIDATION_ERROR',
      })
    }
  }
}
