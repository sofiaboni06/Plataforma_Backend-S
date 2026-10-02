import type { HttpContext } from '@adonisjs/core/http'
import { resolveScope } from '#services/access_control'
import ObraService from '#services/obra_service'
import { parseOptionalBoolean, parseOptionalPositiveInt } from '#services/query_params'
import ObraTransformer from '#transformers/obra_transformer'
import { createObraValidator, updateObraValidator } from '#validators/obra'

export default class ObrasController {
  async index({ auth, request, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const obras = await new ObraService().index(scope, {
      estado: parseOptionalBoolean(request.input('estado')),
      idCformacion: parseOptionalPositiveInt(request.input('idCformacion')),
    })

    return serialize(ObraTransformer.transform(obras))
  }

  async show({ auth, params, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const obra = await new ObraService().show(scope, Number(params.id))

    return serialize(ObraTransformer.transform(obra))
  }

  async store({ auth, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(createObraValidator)
    const scope = await resolveScope(auth.getUserOrFail())
    const obra = await new ObraService().store(scope, payload)

    return serialize(ObraTransformer.transform(obra))
  }

  async update({ auth, params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(updateObraValidator)
    const scope = await resolveScope(auth.getUserOrFail())
    const obra = await new ObraService().update(scope, Number(params.id), payload)

    return serialize(ObraTransformer.transform(obra))
  }

  async destroy({ auth, params, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const result = await new ObraService().remove(scope, Number(params.id))

    return serialize(result)
  }
}
