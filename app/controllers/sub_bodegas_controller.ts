import type { HttpContext } from '@adonisjs/core/http'
import SubBodegaService from '#services/sub_bodega_service'
import SubBodegaTransformer from '#transformers/sub_bodega_transformer'
import { resolveScope } from '#services/access_control'
import { createSubBodegaValidator, updateSubBodegaValidator } from '#validators/sub_bodega'

export default class SubBodegasController {
  async index({ auth, params, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const subBodegas = await new SubBodegaService().index(scope, Number(params.id))

    return serialize(SubBodegaTransformer.transform(subBodegas))
  }

  async show({ auth, params, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const subBodega = await new SubBodegaService().show(scope, Number(params.id))

    return serialize(SubBodegaTransformer.transform(subBodega))
  }

  async store({ auth, params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(createSubBodegaValidator)
    const scope = await resolveScope(auth.getUserOrFail())
    const subBodega = await new SubBodegaService().store(scope, {
      idBodega: Number(params.id),
      ...payload,
    })

    return serialize(SubBodegaTransformer.transform(subBodega))
  }

  async update({ auth, params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(updateSubBodegaValidator)
    const scope = await resolveScope(auth.getUserOrFail())
    const subBodega = await new SubBodegaService().update(scope, Number(params.id), payload)

    return serialize(SubBodegaTransformer.transform(subBodega))
  }

  async destroy({ auth, params, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const result = await new SubBodegaService().remove(scope, Number(params.id))

    return serialize(result)
  }
}
