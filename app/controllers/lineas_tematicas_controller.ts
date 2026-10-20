
import type { HttpContext } from '@adonisjs/core/http'
import LineaTematicaService from '#services/linea_tematica_service'
import {
  createLineaTematicaValidator,
  updateLineaTematicaValidator,
} from '#validators/linea_tematica'

export default class LineasTematicasController {
  private service = new LineaTematicaService()

  async index({ request, response }: HttpContext) {
    const accessScope = request.qs() as unknown as Parameters<LineaTematicaService['index']>[0]
    const lineas = await this.service.index(accessScope)
    return response.ok({ data: lineas })
  }

  async show({ params, request, response }: HttpContext) {
    const accessScope = request.qs() as unknown as Parameters<LineaTematicaService['show']>[0]
    const linea = await this.service.show(accessScope, Number(params.id))
    return response.ok({ data: linea })
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createLineaTematicaValidator)
    const accessScope = request.qs() as unknown as Parameters<LineaTematicaService['store']>[0]
    const linea = await this.service.store(accessScope, payload)

    return response.created({
      message: 'Línea temática creada correctamente',
      data: linea,
    })
  }

  async update({ params, request, response }: HttpContext) {
    const payload = await request.validateUsing(updateLineaTematicaValidator)
    const accessScope = request.qs() as unknown as Parameters<LineaTematicaService['update']>[0]
    const linea = await this.service.update(accessScope, Number(params.id), payload)

    return response.ok({
      message: 'Línea temática actualizada correctamente',
      data: linea,
    })
  }

  async destroy({ params, response }: HttpContext) {
    const result = await this.service.destroy(Number(params.id))
    return response.ok(result)
  }
}
