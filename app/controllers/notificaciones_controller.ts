import NotificacionService from '#services/notificacion_service'
import { parseOptionalBoolean, parsePositiveInt } from '#services/query_params'
import NotificacionTransformer from '#transformers/notificacion_transformer'
import { updateNotificacionValidator } from '#validators/notificacion'
import type { HttpContext } from '@adonisjs/core/http'

export default class NotificacionesController {
  private service = new NotificacionService()

  async index({ auth, request, serialize }: HttpContext) {
    const page = parsePositiveInt(request.input('page'), 1)
    const perPage = Math.min(parsePositiveInt(request.input('perPage'), 20), 100)
    const leida = parseOptionalBoolean(request.input('leida'))
    const result = await this.service.list(auth.getUserOrFail().id, { page, perPage, leida })

    return serialize(NotificacionTransformer.paginate(result.all(), result.getMeta()))
  }

  async updateAll({ auth, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(updateNotificacionValidator)
    const total = await this.service.marcarTodas(auth.getUserOrFail().id, payload.leida)

    return serialize({ total })
  }

  async update({ auth, params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(updateNotificacionValidator)
    const row = await this.service.marcar(auth.getUserOrFail().id, Number(params.id), payload.leida)

    return serialize(NotificacionTransformer.transform(row))
  }
}
