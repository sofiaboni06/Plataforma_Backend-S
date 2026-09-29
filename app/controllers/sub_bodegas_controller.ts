import type { HttpContext } from '@adonisjs/core/http'
import SubBodegaService from '#services/sub_bodega_service'
import SubBodegaTransformer from '#transformers/sub_bodega_transformer'
import {
  createSubBodegaValidator,
  updateSubBodegaValidator,
} from '#validators/sub_bodega'

export default class SubBodegasController {
  async index({ params, serialize }: HttpContext) {
    const subBodegas = await new SubBodegaService().index(
      Number(params.id)
    )

    return serialize(
      SubBodegaTransformer.transform(subBodegas)
    )
  }

  async show({ params, serialize }: HttpContext) {
    const subBodega = await new SubBodegaService().show(
      Number(params.id)
    )

    return serialize(
      SubBodegaTransformer.transform(subBodega)
    )
  }

  async store({ params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(
      createSubBodegaValidator
    )

    const subBodega = await new SubBodegaService().store({
      idBodega: Number(params.id),
      ...payload,
    })

    return serialize(
      SubBodegaTransformer.transform(subBodega)
    )
  }

  async update({
    params,
    request,
    serialize,
  }: HttpContext) {
    const payload = await request.validateUsing(
      updateSubBodegaValidator
    )

    const subBodega = await new SubBodegaService().update(
      Number(params.id),
      payload
    )

    return serialize(
      SubBodegaTransformer.transform(subBodega)
    )
  }

  async destroy({ params, serialize }: HttpContext) {
    const result = await new SubBodegaService().remove(
      Number(params.id)
    )

    return serialize(result)
  }
}