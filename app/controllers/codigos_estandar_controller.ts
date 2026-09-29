import type { HttpContext } from '@adonisjs/core/http'
import CodigoEstandarService from '#services/codigo_estandar_service'
import CodigoEstandarTransformer from '#transformers/codigo_estandar_transformer'

export default class CodigosEstandarController {
  async index({ serialize }: HttpContext) {
    const codigos = await new CodigoEstandarService().index()

    return serialize(CodigoEstandarTransformer.transform(codigos))
  }

  async show({ params, serialize }: HttpContext) {
    const codigo = await new CodigoEstandarService().show(Number(params.id))

    return serialize(CodigoEstandarTransformer.transform(codigo))
  }
}
