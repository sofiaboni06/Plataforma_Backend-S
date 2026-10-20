
import RedConocimiento from '#models/red_conocimiento'
import LineaTematica from '#models/linea_tematica'
import { Exception } from '@adonisjs/core/exceptions'

type RedPayload = {
  redConocimiento?: string
  nombreGestor?: string
  telGestor?: string
  mailGestor?: string
  nombreAsesor?: string
  telAsesor?: string
  mailAsesor?: string
  estado?: boolean
  lineasTematicas?: number[]
}

export default class RedConocimientoService {
  async index() {
    return RedConocimiento.query()
      .preload('lineasTematicas')
      .orderBy('id_red_conocimiento', 'desc')
  }

  async show(id: number) {
    const red = await RedConocimiento.find(id)

    if (!red) {
      throw new Exception('Red de conocimiento no encontrada', { status: 404 })
    }

    await red.load('lineasTematicas')
    return red
  }

  async store(payload: RedPayload) {
    const red = await RedConocimiento.create({
      redConocimiento: payload.redConocimiento!,
      nombreGestor: payload.nombreGestor!,
      telGestor: payload.telGestor!,
      mailGestor: payload.mailGestor!,
      nombreAsesor: payload.nombreAsesor!,
      telAsesor: payload.telAsesor!,
      mailAsesor: payload.mailAsesor!,
      estado: payload.estado ?? true,
    })

    if (payload.lineasTematicas !== undefined) {
      await this.syncLineas(red, payload.lineasTematicas)
    }

    await red.load('lineasTematicas')
    return red
  }

  async update(id: number, payload: RedPayload) {
    const red = await RedConocimiento.find(id)

    if (!red) {
      throw new Exception('Red de conocimiento no encontrada', { status: 404 })
    }

    red.merge({
      ...(payload.redConocimiento !== undefined && {
        redConocimiento: payload.redConocimiento,
      }),
      ...(payload.nombreGestor !== undefined && {
        nombreGestor: payload.nombreGestor,
      }),
      ...(payload.telGestor !== undefined && {
        telGestor: payload.telGestor,
      }),
      ...(payload.mailGestor !== undefined && {
        mailGestor: payload.mailGestor,
      }),
      ...(payload.nombreAsesor !== undefined && {
        nombreAsesor: payload.nombreAsesor,
      }),
      ...(payload.telAsesor !== undefined && {
        telAsesor: payload.telAsesor,
      }),
      ...(payload.mailAsesor !== undefined && {
        mailAsesor: payload.mailAsesor,
      }),
      ...(payload.estado !== undefined && { estado: payload.estado }),
    })

    await red.save()

    if (payload.lineasTematicas !== undefined) {
      await this.syncLineas(red, payload.lineasTematicas)
    }

    await red.load('lineasTematicas')
    return red
  }

  async destroy(id: number) {
    const red = await RedConocimiento.find(id)

    if (!red) {
      throw new Exception('Red de conocimiento no encontrada', { status: 404 })
    }

    red.estado = false
    await red.save()

    return { message: 'Red de conocimiento desactivada correctamente' }
  }

  private async syncLineas(red: RedConocimiento, ids: number[]) {
    const unicos = [...new Set(ids)]

    if (unicos.length > 0) {
      const encontradas = await LineaTematica.query()
        .whereIn('id_linea_tematica', unicos)
        .where('estado', true)

      if (encontradas.length !== unicos.length) {
        throw new Exception(
          'Una o más líneas temáticas no existen o están inactivas',
          { status: 422 }
        )
      }
    }

    await red.related('lineasTematicas').sync(unicos)
  }
}
