import type { HttpContext } from '@adonisjs/core/http'
import CategoriaService from '#services/categoria_service'
import CategoriaTransformer from '#transformers/categoria_transformer'
import { resolveScope } from '#services/access_control'
import { parseOptionalBoolean } from '#services/query_params'
import {
  createCategoriaValidator,
  updateCategoriaValidator,
} from '#validators/categoria'

export default class CategoriasController {
  async index({ auth, request, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const categorias = await new CategoriaService().index(scope, {
      estado: parseOptionalBoolean(request.input('estado')),
    })

    return serialize(CategoriaTransformer.transform(categorias))
  }

  async show({ auth, params, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const categoria = await new CategoriaService().show(scope, Number(params.id))

    return serialize(CategoriaTransformer.transform(categoria))
  }

  async store({ auth, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(createCategoriaValidator)
    const scope = await resolveScope(auth.getUserOrFail())

    const categoria = await new CategoriaService().store(scope, payload)

    return serialize(CategoriaTransformer.transform(categoria))
  }

  async update({ auth, params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(updateCategoriaValidator)
    const scope = await resolveScope(auth.getUserOrFail())

    const categoria = await new CategoriaService().update(scope, Number(params.id), payload)

    return serialize(CategoriaTransformer.transform(categoria))
  }

  async destroy({ auth, params, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const result = await new CategoriaService().remove(scope, Number(params.id))

    return serialize(result)
  }
}
