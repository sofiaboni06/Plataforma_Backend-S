import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'
import SolicitudEquipoService from '#services/solicitud_equipo_service'
import SolicitudEquipoTransformer from '#transformers/solicitud_equipo_transformer'
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

  async index({ serialize }: HttpContext) {
    const solicitudes = await this.service.index()
    return serialize(SolicitudEquipoTransformer.transform(solicitudes))
  }

  async store({ request, auth, response, serialize }: HttpContext) {
    const payload = await request.validateUsing(createSolicitudEquipoValidator)
    const user = auth.getUserOrFail()
    const solicitud = await this.service.create(payload, user.id)

    return response.created({
      message: 'Solicitud de equipo registrada correctamente',
      data: await serialize.withoutWrapping(SolicitudEquipoTransformer.transform(solicitud)),
    })
  }

  async show({ params, serialize }: HttpContext) {
    const solicitud = await this.service.show(solicitudId(params.id))
    return serialize(SolicitudEquipoTransformer.transform(solicitud))
  }

  async entregar({ params, auth, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const solicitud = await this.service.entregar(solicitudId(params.id), user.id)

    return response.ok({
      message: 'Equipo entregado correctamente',
      data: await serialize.withoutWrapping(SolicitudEquipoTransformer.transform(solicitud)),
    })
  }

  async devolver({ params, request, response, serialize }: HttpContext) {
    const payload = await request.validateUsing(devolverSolicitudEquipoValidator)
    const solicitud = await this.service.devolver(
      solicitudId(params.id),
      payload.estadoElemento,
      payload.observacion
    )

    return response.ok({
      message: 'Equipo devuelto correctamente',
      data: await serialize.withoutWrapping(SolicitudEquipoTransformer.transform(solicitud)),
    })
  }
}
