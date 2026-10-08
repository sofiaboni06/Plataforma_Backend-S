import type { HttpContext } from '@adonisjs/core/http'
import { onlyRequests, resolveScope } from '#services/access_control'
import SolicitudMaterialService from '#services/solicitud_material_service'
import SolicitudMaterialTransformer from '#transformers/solicitud_material_transformer'
import { entregarSolicitudValidator } from '#validators/solicitud'
import { createSolicitudMaterialValidator } from '#validators/solicitud_material'

export default class SolicitudMaterialController {
  private service = new SolicitudMaterialService()

  async index({ auth, request, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const solicitudes = await this.service.index(scope, request.input('estado'))
    return serialize(SolicitudMaterialTransformer.transform(solicitudes, !onlyRequests(scope)))
  }

  async store({ auth, request, response, serialize }: HttpContext) {
    const payload = await request.validateUsing(createSolicitudMaterialValidator)
    const scope = await resolveScope(auth.getUserOrFail())
    const solicitud = await this.service.create(scope, payload)

    return response.created({
      message: 'Solicitud de material registrada correctamente',
      data: await serialize.withoutWrapping(
        SolicitudMaterialTransformer.transform(solicitud, !onlyRequests(scope))
      ),
    })
  }

  async show({ auth, params, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const solicitud = await this.service.show(scope, Number(params.id))
    return serialize(SolicitudMaterialTransformer.transform(solicitud, !onlyRequests(scope)))
  }

  async entregar({ auth, params, request, response, serialize }: HttpContext) {
    const payload = await request.validateUsing(entregarSolicitudValidator)
    const scope = await resolveScope(auth.getUserOrFail())
    const solicitud = await this.service.entregar(scope, Number(params.id), payload)

    return response.ok({
      message:
        solicitud.estado === 'parcial'
          ? `Se entregaron ${solicitud.cantidadEntregada} de ${solicitud.cantidad}; quedan ${solicitud.cantidad - solicitud.cantidadEntregada} pendientes`
          : 'Material entregado correctamente',
      data: await serialize.withoutWrapping(SolicitudMaterialTransformer.transform(solicitud)),
    })
  }
}
