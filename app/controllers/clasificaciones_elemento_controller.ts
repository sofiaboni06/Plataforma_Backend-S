import type { HttpContext } from '@adonisjs/core/http'
import { resolveScope } from '#services/access_control'
import ClasificacionElementoService from '#services/clasificacion_elemento_service'
import { parseOptionalBoolean } from '#services/query_params'
import ClasificacionElementoTransformer from '#transformers/clasificacion_elemento_transformer'
import {
  createClasificacionElementoValidator,
  updateClasificacionElementoValidator,
} from '#validators/clasificacion_elemento'

export default class ClasificacionesElementoController {
  async index({ request, serialize }: HttpContext) {
    const clasificaciones = await new ClasificacionElementoService().index({
      estado: parseOptionalBoolean(request.input('estado')),
    })

    return serialize(ClasificacionElementoTransformer.transform(clasificaciones))
  }

  async show({ params, serialize }: HttpContext) {
    const clasificacion = await new ClasificacionElementoService().show(Number(params.id))

    return serialize(ClasificacionElementoTransformer.transform(clasificacion))
  }

  async store({ request, serialize }: HttpContext) {
    const payload = await request.validateUsing(createClasificacionElementoValidator)
    const clasificacion = await new ClasificacionElementoService().store(payload)

    return serialize(ClasificacionElementoTransformer.transform(clasificacion))
  }

  async update({ auth, params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(updateClasificacionElementoValidator)
    const scope = await resolveScope(auth.getUserOrFail())
    const clasificacion = await new ClasificacionElementoService().update(
      scope,
      Number(params.id),
      payload
    )

    return serialize(ClasificacionElementoTransformer.transform(clasificacion))
  }

  async destroy({ params, serialize }: HttpContext) {
    const result = await new ClasificacionElementoService().remove(Number(params.id))

    return serialize(result)
  }
}
