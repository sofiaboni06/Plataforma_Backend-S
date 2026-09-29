import type { HttpContext } from '@adonisjs/core/http'
import SubcategoriaService from '#services/subcategoria_service'
import SubcategoriaTransformer from '#transformers/subcategoria_transformer'
import { resolveScope } from '#services/access_control'
import {
  createSubcategoriaValidator,
  updateSubcategoriaValidator,
} from '#validators/subcategoria'

export default class SubcategoriasController {
  async index({ auth, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const subcategorias = await new SubcategoriaService().index(scope)

    return serialize(SubcategoriaTransformer.transform(subcategorias))
  }

  async show({ auth, params, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const subcategoria = await new SubcategoriaService().show(scope, Number(params.id))

    return serialize(SubcategoriaTransformer.transform(subcategoria))
  }

  async store({ auth, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(createSubcategoriaValidator)
    const scope = await resolveScope(auth.getUserOrFail())
    const subcategoria = await new SubcategoriaService().store(scope, payload)

    return serialize(SubcategoriaTransformer.transform(subcategoria))
  }

  async update({ auth, params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(updateSubcategoriaValidator)
    const scope = await resolveScope(auth.getUserOrFail())
    const subcategoria = await new SubcategoriaService().update(scope, Number(params.id), payload)

    return serialize(SubcategoriaTransformer.transform(subcategoria))
  }
}
