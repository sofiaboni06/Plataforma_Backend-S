import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'
import { onlyRequests, resolveScope } from '#services/access_control'
import SolicitudEquipoService from '#services/solicitud_equipo_service'
import SolicitudEquipoTransformer from '#transformers/solicitud_equipo_transformer'
import { entregarSolicitudValidator } from '#validators/solicitud'
import {
  createSolicitudEquipoValidator,
  devolverSolicitudEquipoValidator,
} from '#validators/solicitud_equipo'

function solicitudId(value: string | number) {
  const id = Number(value)

  if (!Number.isInteger(id) || id <= 0) {
    throw new Exception('El identificador de la solicitud no es válido', {
      status: 422,
      code: 'E_VALIDATION_ERROR',
    })
  }

  return id
}

export default class SolicitudEquipoController {
  private service = new SolicitudEquipoService()

  async index({ auth, request, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const solicitudes = await this.service.index(
      scope,
      request.input('estado'),
      request.input('afuera')
    )
    return serialize(SolicitudEquipoTransformer.transform(solicitudes, !onlyRequests(scope)))
  }

  async store({ request, auth, response, serialize }: HttpContext) {
    const payload = await request.validateUsing(createSolicitudEquipoValidator)
    const scope = await resolveScope(auth.getUserOrFail())
    const solicitud = await this.service.create(scope, payload)

    return response.created({
      message: 'Solicitud de equipo registrada correctamente',
      data: await serialize.withoutWrapping(
        SolicitudEquipoTransformer.transform(solicitud, !onlyRequests(scope))
      ),
    })
  }

  async show({ auth, params, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const solicitud = await this.service.show(scope, solicitudId(params.id))
    return serialize(SolicitudEquipoTransformer.transform(solicitud, !onlyRequests(scope)))
  }

  async entregar({ auth, params, request, response, serialize }: HttpContext) {
    const payload = await request.validateUsing(entregarSolicitudValidator)
    const scope = await resolveScope(auth.getUserOrFail())
    const solicitud = await this.service.entregar(scope, solicitudId(params.id), payload)

    return response.ok({
      message:
        solicitud.estado === 'parcial'
          ? `Se entregaron ${solicitud.cantidadEntregada} de ${solicitud.cantidad}; quedan ${solicitud.cantidad - solicitud.cantidadEntregada} pendientes`
          : 'Equipo entregado correctamente',
      data: await serialize.withoutWrapping(SolicitudEquipoTransformer.transform(solicitud)),
    })
  }

  async devolver({ auth, params, request, response, serialize }: HttpContext) {
    const payload = await request.validateUsing(devolverSolicitudEquipoValidator)
    const scope = await resolveScope(auth.getUserOrFail())
    const { solicitud, solicitudesPendientes } = await this.service.devolver(
      scope,
      solicitudId(params.id),
      payload
    )
    const afuera = solicitud.cantidadEntregada - solicitud.cantidadDevuelta
    const data = await serialize.withoutWrapping(SolicitudEquipoTransformer.transform(solicitud))

    // `solicitudesPendientes`: lo que el equipo que volvió bueno puede servir.
    return response.ok({
      message:
        afuera > 0
          ? `Devolución registrada; quedan ${afuera} afuera`
          : 'Equipo devuelto correctamente',
      data: { ...data, solicitudesPendientes },
    })
  }
}
