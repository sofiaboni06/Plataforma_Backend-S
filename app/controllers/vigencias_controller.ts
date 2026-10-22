import type { HttpContext } from '@adonisjs/core/http'
import VigenciaService from '#services/vigencia_service'
import VigenciaTransformer from '#transformers/vigencia_transformer'
import { createVigenciaValidator, updateVigenciaValidator } from '#validators/vigencia'

export default class VigenciasController {

  async index({ serialize }: HttpContext) {
    const vigencias = await new VigenciaService().list()
    return serialize(VigenciaTransformer.transformList(vigencias))
  }

  async store({ request, serialize }: HttpContext) {
    const payload = await request.validateUsing(createVigenciaValidator)
    const vigencia = await new VigenciaService().create(payload)
    return serialize(VigenciaTransformer.transform(vigencia))
  }

  async update({ params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(updateVigenciaValidator)
    const vigencia = await new VigenciaService().update(params.id, payload)
    return serialize(VigenciaTransformer.transform(vigencia))
  }

  async destroy({ params }: HttpContext) {
    await new VigenciaService().delete(params.id)
    return { message: 'Vigencia eliminada correctamente' }
  }
}