import type { HttpContext } from '@adonisjs/core/http'
import { parseOptionalBoolean } from '#services/query_params'
import RedConocimientoService from '#services/red_conocimiento_service'
import RedConocimientoTransformer from '#transformers/red_conocimiento_transformer'
import {
  createRedConocimientoValidator,
  syncLineasTematicasValidator,
  updateRedConocimientoValidator,
} from '#validators/red_conocimiento'

export default class RedesConocimientoController {
  private service = new RedConocimientoService()

  async index({ request, serialize }: HttpContext) {
    const estado = parseOptionalBoolean(request.input('estado'))
    const search = String(request.input('search', '')).trim() || undefined
    const redes = await this.service.index({ estado, search })

    return serialize(RedConocimientoTransformer.transform(redes))
  }

  async options({ serialize }: HttpContext) {
    const redes = await this.service.options()

    return serialize(
      redes.map((red) => ({
        id: red.id,
        nombre: red.nombre,
        lineas: red.lineasTematicas.map((linea) => ({ id: linea.id, nombre: linea.nombre })),
      }))
    )
  }

  async show({ params, serialize }: HttpContext) {
    const red = await this.service.show(Number(params.id))

    return serialize(RedConocimientoTransformer.transform(red))
  }

  async store({ request, serialize }: HttpContext) {
    const payload = await request.validateUsing(createRedConocimientoValidator)
    const red = await this.service.store(payload)

    return serialize(RedConocimientoTransformer.transform(red))
  }

  async update({ params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(updateRedConocimientoValidator)
    const red = await this.service.update(Number(params.id), payload)

    return serialize(RedConocimientoTransformer.transform(red))
  }

  async syncLineas({ params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(syncLineasTematicasValidator)
    const red = await this.service.syncLineas(Number(params.id), payload.lineaIds)

    return serialize(RedConocimientoTransformer.transform(red))
  }

  async destroy({ params, serialize }: HttpContext) {
    const result = await this.service.remove(Number(params.id))

    return serialize(result)
  }
}
