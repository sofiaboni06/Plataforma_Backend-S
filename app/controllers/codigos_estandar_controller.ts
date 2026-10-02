import type { HttpContext } from '@adonisjs/core/http'
import { resolveScope } from '#services/access_control'
import CodigoEstandarService from '#services/codigo_estandar_service'
import CodigoEstandarTransformer from '#transformers/codigo_estandar_transformer'
import {
  createCodigoEstandarValidator,
  updateCodigoEstandarValidator,
} from '#validators/codigo_estandar'

export default class CodigosEstandarController {
  async index({ auth, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const codigos = await new CodigoEstandarService().index(scope)

    return serialize(CodigoEstandarTransformer.transform(codigos))
  }

  async show({ auth, params, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const codigo = await new CodigoEstandarService().show(scope, Number(params.id))

    return serialize(CodigoEstandarTransformer.transform(codigo))
  }

  async store({ auth, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(createCodigoEstandarValidator)
    const scope = await resolveScope(auth.getUserOrFail())
    const codigo = await new CodigoEstandarService().store(scope, payload)

    return serialize(CodigoEstandarTransformer.transform(codigo))
  }

  async update({ auth, params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(updateCodigoEstandarValidator)
    const scope = await resolveScope(auth.getUserOrFail())
    const codigo = await new CodigoEstandarService().update(scope, Number(params.id), payload)

    return serialize(CodigoEstandarTransformer.transform(codigo))
  }

  async destroy({ auth, params, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const result = await new CodigoEstandarService().remove(scope, Number(params.id))

    return serialize(result)
  }
}
