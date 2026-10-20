
import type { HttpContext } from '@adonisjs/core/http'
import RedConocimientoService from '#services/red_conocimiento_service'
import {
  createRedConocimientoValidator,
  updateRedConocimientoValidator,
} from '#validators/red_conocimiento'

export default class RedesConocimientoController {
  private service = new RedConocimientoService()

  async index({ response }: HttpContext) {
    const redes = await this.service.index()
    return response.ok({ data: redes })
  }

  async show({ params, response }: HttpContext) {
    const red = await this.service.show(Number(params.id))
    return response.ok({ data: red })
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createRedConocimientoValidator)
    const red = await this.service.store(payload)

    return response.created({
      message: 'Red de conocimiento creada correctamente',
      data: red,
    })
  }

  async update({ params, request, response }: HttpContext) {
    const payload = await request.validateUsing(updateRedConocimientoValidator)
    const red = await this.service.update(Number(params.id), payload)

    return response.ok({
      message: 'Red de conocimiento actualizada correctamente',
      data: red,
    })
  }

  async destroy({ params, response }: HttpContext) {
    const result = await this.service.destroy(Number(params.id))
    return response.ok(result)
  }
}
