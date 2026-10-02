import type { HttpContext } from '@adonisjs/core/http'
import { resolveScope } from '#services/access_control'
import { parseOptionalBoolean } from '#services/query_params'
import UnidadMedidaService from '#services/unidad_medida_service'
import UnidadMedidaTransformer from '#transformers/unidad_medida_transformer'
import { createUnidadMedidaValidator, updateUnidadMedidaValidator } from '#validators/unidad_medida'

export default class UnidadesMedidaController {
  async index({ auth, request, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const unidades = await new UnidadMedidaService().index(scope, {
      estado: parseOptionalBoolean(request.input('estado')),
    })

    return serialize(UnidadMedidaTransformer.transform(unidades))
  }

  async show({ auth, params, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const unidad = await new UnidadMedidaService().show(scope, Number(params.id))

    return serialize(UnidadMedidaTransformer.transform(unidad))
  }

  async store({ auth, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(createUnidadMedidaValidator)
    const scope = await resolveScope(auth.getUserOrFail())
    const unidad = await new UnidadMedidaService().store(scope, payload)

    return serialize(UnidadMedidaTransformer.transform(unidad))
  }

  async update({ auth, params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(updateUnidadMedidaValidator)
    const scope = await resolveScope(auth.getUserOrFail())
    const unidad = await new UnidadMedidaService().update(scope, Number(params.id), payload)

    return serialize(UnidadMedidaTransformer.transform(unidad))
  }

  async destroy({ auth, params, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const result = await new UnidadMedidaService().remove(scope, Number(params.id))

    return serialize(result)
  }
}
