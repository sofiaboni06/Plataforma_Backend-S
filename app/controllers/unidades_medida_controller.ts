import type { HttpContext } from '@adonisjs/core/http'
import UnidadMedidaService from '#services/unidad_medida_service'
import UnidadMedidaTransformer from '#transformers/unidad_medida_transformer'

export default class UnidadesMedidaController {
  async index({ serialize }: HttpContext) {
    const unidades = await new UnidadMedidaService().index()

    return serialize(UnidadMedidaTransformer.transform(unidades))
  }

  async show({ params, serialize }: HttpContext) {
    const unidad = await new UnidadMedidaService().show(Number(params.id))

    return serialize(UnidadMedidaTransformer.transform(unidad))
  }
}
