import type { HttpContext } from '@adonisjs/core/http'
import { resolveScope } from '#services/access_control'
import SolicitudMaterialService from '#services/solicitud_material_service'
import { createSolicitudMaterialValidator } from '#validators/solicitud_material'

export default class SolicitudMaterialController {
  private service = new SolicitudMaterialService()

  async index({ auth, request, response }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const solicitudes = await this.service.index(scope, request.input('estado'))

    return response.ok({ data: solicitudes })
  }

  async store({ auth, request, response }: HttpContext) {
    const payload = await request.validateUsing(createSolicitudMaterialValidator)
    const scope = await resolveScope(auth.getUserOrFail())
    const solicitud = await this.service.create(scope, payload)

    return response.created({
      message: 'Solicitud de material registrada correctamente',
      data: solicitud,
    })
  }

  async show({ auth, params, response }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const solicitud = await this.service.show(scope, Number(params.id))

    return response.ok({ data: solicitud })
  }

  async entregar({ auth, params, response }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const solicitud = await this.service.entregar(scope, Number(params.id))

    return response.ok({
      message: 'Material entregado correctamente',
      data: solicitud,
    })
  }
}
