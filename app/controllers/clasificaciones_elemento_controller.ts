import type { HttpContext } from '@adonisjs/core/http'
import { resolveScope } from '#services/access_control'
import ClasificacionElementoService from '#services/clasificacion_elemento_service'
import { parseOptionalBoolean, parseOptionalPositiveInt } from '#services/query_params'
import ClasificacionElementoTransformer from '#transformers/clasificacion_elemento_transformer'
import {
  createClasificacionElementoValidator,
  updateClasificacionElementoValidator,
} from '#validators/clasificacion_elemento'

export default class ClasificacionesElementoController {
  async index({ auth, request, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const clasificaciones = await new ClasificacionElementoService().index(scope, {
      estado: parseOptionalBoolean(request.input('estado')),
      idCformacion: parseOptionalPositiveInt(request.input('idCformacion')),
    })

    return serialize(ClasificacionElementoTransformer.transform(clasificaciones))
  }

  async show({ auth, params, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const clasificacion = await new ClasificacionElementoService().show(scope, Number(params.id))

    return serialize(ClasificacionElementoTransformer.transform(clasificacion))
  }

  async store({ auth, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(createClasificacionElementoValidator)
    const scope = await resolveScope(auth.getUserOrFail())
    const clasificacion = await new ClasificacionElementoService().store(scope, payload)

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

  async destroy({ auth, params, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const result = await new ClasificacionElementoService().remove(scope, Number(params.id))

    return serialize(result)
  }
}
