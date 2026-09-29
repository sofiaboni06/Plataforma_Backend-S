import ElementoService from '#services/elemento_service'
import ElementoTransformer from '#transformers/elemento_transformer'
import { resolveScope } from '#services/access_control'
import { createElementoValidator, updateElementoValidator } from '#validators/elemento'
import type { HttpContext } from '@adonisjs/core/http'

export default class ElementosController {
  async index({ auth, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const elementos = await new ElementoService().list(scope)
    return serialize(ElementoTransformer.transform(elementos))
  }

  async store({ request, auth, serialize }: HttpContext) {
    const payload = await request.validateUsing(createElementoValidator)
    const scope = await resolveScope(auth.getUserOrFail())
    const creado = await new ElementoService().create(scope, payload)
    return serialize(ElementoTransformer.transform(creado))
  }

  async show({ params, auth, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const elemento = await new ElementoService().findById(scope, Number(params.id))
    return serialize(ElementoTransformer.transform(elemento))
  }

  async update({ params, request, auth, serialize }: HttpContext) {
    const payload = await request.validateUsing(updateElementoValidator)
    const scope = await resolveScope(auth.getUserOrFail())
    const actualizado = await new ElementoService().update(scope, Number(params.id), payload)
    return serialize(ElementoTransformer.transform(actualizado))
  }
}
