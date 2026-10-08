import type { HttpContext } from '@adonisjs/core/http'
import { onlyRequests, resolveScope } from '#services/access_control'
import SolicitudService from '#services/solicitud_service'
import SolicitanteTransformer from '#transformers/solicitante_transformer'
import SolicitudTransformer from '#transformers/solicitud_transformer'
import {
  createSolicitudValidator,
  entregarSolicitudValidator,
  plazoSolicitudValidator,
  registrarEnBodegaValidator,
} from '#validators/solicitud'

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

  /** Entrega todo lo que haya en el estante de lo que le falta a la solicitud. */
  async entregar({ auth, params, request, response, serialize }: HttpContext) {
    const { observacion, fechaDevolucionLimite } = await request.validateUsing(
      entregarSolicitudValidator
    )
    const scope = await resolveScope(auth.getUserOrFail())
    const factura = await this.service.entregarTodo(scope, String(params.codigo), {
      observacion,
      fechaDevolucionLimite,
    })
    const pendientes = [...factura.materiales, ...factura.equipos].reduce(
      (total, row) => total + row.cantidad - row.cantidadEntregada,
      0
    )

    return response.ok({
      message:
        pendientes > 0
          ? `Se entregó lo disponible; quedan ${pendientes} pendientes`
          : 'Solicitud entregada completa',
      data: await serialize.withoutWrapping(SolicitudTransformer.transform(factura)),
    })
  }

  /** Entregas y devoluciones de bodega: pedidos de equipo que ya salieron. */
  async prestamos({ auth, request, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const facturas = await this.service.prestamos(scope, request.input('vista'))
    return serialize(SolicitudTransformer.transform(facturas))
  }

  /** Bodega corre el plazo de devolución de un pedido de equipo. */
  async plazo({ auth, params, request, response, serialize }: HttpContext) {
    const { fechaDevolucionLimite } = await request.validateUsing(plazoSolicitudValidator)
    const scope = await resolveScope(auth.getUserOrFail())
    const factura = await this.service.ajustarPlazo(
      scope,
      String(params.codigo),
      fechaDevolucionLimite
    )

    return response.ok({
      message: 'Plazo de devolución actualizado',
      data: await serialize.withoutWrapping(SolicitudTransformer.transform(factura)),
    })
  }

  async show({ auth, params, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const factura = await this.service.show(scope, String(params.codigo))
    return serialize(SolicitudTransformer.transform(factura, !onlyRequests(scope)))
  }
}
