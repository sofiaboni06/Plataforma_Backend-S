import type { HttpContext } from '@adonisjs/core/http'
import SubcategoriaService from '#services/subcategoria_service'
import SubcategoriaTransformer from '#transformers/subcategoria_transformer'
import {
  createSubcategoriaValidator,
  updateSubcategoriaValidator,
} from '#validators/subcategoria'

export default class SubcategoriasController {
  async index({ serialize }: HttpContext) {
    const subcategorias = await new SubcategoriaService().index()

    return serialize(SubcategoriaTransformer.transform(subcategorias))
  }

  async show({ params, serialize }: HttpContext) {
    const subcategoria = await new SubcategoriaService().show(Number(params.id))

    return serialize(SubcategoriaTransformer.transform(subcategoria))
  }

  async store({ request, serialize }: HttpContext) {
    const payload = await request.validateUsing(createSubcategoriaValidator)

    const subcategoria = await new SubcategoriaService().store(payload)

    return serialize(SubcategoriaTransformer.transform(subcategoria))
  }

  async update({ params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(updateSubcategoriaValidator)

    const subcategoria = await new SubcategoriaService().update(
      Number(params.id),
      payload
    )

    return serialize(SubcategoriaTransformer.transform(subcategoria))
  }
}