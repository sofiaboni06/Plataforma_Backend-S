import type { HttpContext } from '@adonisjs/core/http'
import { onlyRequests, resolveScope } from '#services/access_control'
import SolicitudService from '#services/solicitud_service'
import SolicitanteTransformer from '#transformers/solicitante_transformer'
import SolicitudTransformer from '#transformers/solicitud_transformer'
import { createSolicitudValidator, registrarEnBodegaValidator } from '#validators/solicitud'

export default class SolicitudesController {
  private service = new SolicitudService()

  async index({ auth, request, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const facturas = await this.service.index(scope, request.input('estado'))
    return serialize(SolicitudTransformer.transform(facturas, !onlyRequests(scope)))
  }

  async store({ request, auth, response, serialize }: HttpContext) {
    const payload = await request.validateUsing(createSolicitudValidator)
    const scope = await resolveScope(auth.getUserOrFail())
    const factura = await this.service.create(scope, payload)

    return response.created({
      message: 'Solicitud registrada correctamente',
      data: await serialize.withoutWrapping(
        SolicitudTransformer.transform(factura, !onlyRequests(scope))
      ),
    })
  }

  async registrarEnBodega({ request, auth, response, serialize }: HttpContext) {
    const payload = await request.validateUsing(registrarEnBodegaValidator)
    const scope = await resolveScope(auth.getUserOrFail())
    const factura = await this.service.registrarEnBodega(scope, payload)

    return response.created({
      message: 'Solicitud registrada y entregada en bodega',
      data: await serialize.withoutWrapping(SolicitudTransformer.transform(factura)),
    })
  }

  async solicitante({ auth, params, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const solicitante = await this.service.solicitante(scope, String(params.documento))
    return serialize(SolicitanteTransformer.transform(solicitante))
  }

  async show({ auth, params, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const factura = await this.service.show(scope, String(params.codigo))
    return serialize(SolicitudTransformer.transform(factura, !onlyRequests(scope)))
  }
}
