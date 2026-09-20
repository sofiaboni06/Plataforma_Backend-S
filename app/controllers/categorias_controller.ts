import type { HttpContext } from '@adonisjs/core/http'
import CategoriaService from '#services/categoria_service'
import CategoriaTransformer from '#transformers/categoria_transformer'
import {
  createCategoriaValidator,
  updateCategoriaValidator,
} from '#validators/categoria'

export default class CategoriasController {
  async index({ serialize }: HttpContext) {
    const categorias = await new CategoriaService().index()

    return serialize(CategoriaTransformer.transform(categorias))
  }

  async show({ params, serialize }: HttpContext) {
    const categoria = await new CategoriaService().show(Number(params.id))

    return serialize(CategoriaTransformer.transform(categoria))
  }

  async store({ request, serialize }: HttpContext) {
    const payload = await request.validateUsing(createCategoriaValidator)

    const categoria = await new CategoriaService().store(payload)

    return serialize(CategoriaTransformer.transform(categoria))
  }

  async update({ params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(updateCategoriaValidator)

    const categoria = await new CategoriaService().update(
      Number(params.id),
      payload
    )

    return serialize(CategoriaTransformer.transform(categoria))
  }
}