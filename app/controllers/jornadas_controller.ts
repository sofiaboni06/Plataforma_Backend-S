import type { HttpContext } from '@adonisjs/core/http'
import JornadaService from '#services/jornada_service'
import JornadaTransformer from '#transformers/jornada_transformer'

export default class JornadasController {
  async index({ serialize }: HttpContext) {
    const jornadas = await new JornadaService().index()

    return serialize(JornadaTransformer.transform(jornadas))
  }
}
