import ElementoService from '#services/elemento_service'
import ElementoTransformer from '#transformers/elemento_transformer'
import { createElementoValidator, updateElementoValidator } from '#validators/elemento'
import type { HttpContext } from '@adonisjs/core/http'

export default class ElementosController {
  async index({ auth, serialize }: HttpContext) {
    const elementos = await new ElementoService().listForUser(auth.getUserOrFail())
    return serialize(ElementoTransformer.transform(elementos))
  }

  async store({ request, auth, serialize }: HttpContext) {
    const payload = await request.validateUsing(createElementoValidator)
    const creado = await new ElementoService().create(auth.getUserOrFail(), payload)
    return serialize(ElementoTransformer.transform(creado))
  }

  async show({ params, auth, serialize }: HttpContext) {
    const elemento = await new ElementoService().findById(auth.getUserOrFail(), Number(params.id))
    return serialize(ElementoTransformer.transform(elemento))
  }

  async update({ params, request, auth, serialize }: HttpContext) {
    const payload = await request.validateUsing(updateElementoValidator)
    const actualizado = await new ElementoService().update(
      auth.getUserOrFail(),
      Number(params.id),
      payload,
    )
    return serialize(ElementoTransformer.transform(actualizado))
  }
}
