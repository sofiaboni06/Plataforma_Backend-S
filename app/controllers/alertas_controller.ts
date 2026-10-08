import AlertaService from '#services/alerta_service'
import { resolveScope } from '#services/access_control'
import { parseOptionalBoolean, parsePositiveInt } from '#services/query_params'
import AlertaTransformer from '#transformers/alerta_transformer'
import type { HttpContext } from '@adonisjs/core/http'

export default class AlertasController {
  async index({ auth, request, serialize }: HttpContext) {
    const page = parsePositiveInt(request.input('page'), 1)
    const perPage = Math.min(parsePositiveInt(request.input('perPage'), 20), 100)
    const estado = parseOptionalBoolean(request.input('estado'))
    const scope = await resolveScope(auth.getUserOrFail())
    const result = await new AlertaService().list(scope, { page, perPage, estado })

    return serialize(AlertaTransformer.paginate(result.all(), result.getMeta()))
  }
}
