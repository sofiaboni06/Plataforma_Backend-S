import type { HttpContext } from '@adonisjs/core/http'
import ActividadService from '#services/actividad_service'
import ActividadTransformer from '#transformers/actividad_transformer'
import { parseOptionalBoolean } from '#services/query_params'
import {
  createActividadValidator,
  updateActividadValidator,
} from '#validators/actividad'

export default class ActividadesController {
  async index({ request, serialize }: HttpContext) {
    const actividades = await new ActividadService().index({
      estado: parseOptionalBoolean(request.input('estado')),
    })

    return serialize(
      ActividadTransformer.transform(actividades),
    )
  }

  async show({ params, serialize }: HttpContext) {
    const actividad = await new ActividadService().show(
      Number(params.id),
    )

    return serialize(
      ActividadTransformer.transform(actividad),
    )
  }

  async store({ request, serialize }: HttpContext) {
    const payload = await request.validateUsing(
      createActividadValidator,
    )

    const actividad = await new ActividadService().store(
      payload,
    )

    return serialize(
      ActividadTransformer.transform(actividad),
    )
  }

  async update({ params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(
      updateActividadValidator,
    )

    const actividad = await new ActividadService().update(
      Number(params.id),
      payload,
    )

    return serialize(
      ActividadTransformer.transform(actividad),
    )
  }

  async destroy({ params, serialize }: HttpContext) {
    const result = await new ActividadService().remove(
      Number(params.id),
    )

    return serialize(result)
  }
}