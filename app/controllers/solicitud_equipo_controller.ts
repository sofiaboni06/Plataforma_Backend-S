import type { HttpContext } from '@adonisjs/core/http'

import SolicitudEquipoService from '#services/solicitud_equipo_service'
import {
  createSolicitudEquipoValidator,
  devolverSolicitudEquipoValidator,
} from '#validators/solicitud_equipo'

export default class SolicitudEquipoController {
  private service = new SolicitudEquipoService()

  async store({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(
      createSolicitudEquipoValidator
    )

    const user = auth.user

    if (!user) {
      return response.unauthorized({
        message: 'Usuario no autenticado',
      })
    }

    const solicitud = await this.service.create(
      payload,
      user.id
    )

    return response.created({
      message: 'Solicitud de equipo registrada correctamente',
      data: solicitud,
    })
  }

  async index({ response }: HttpContext) {
    const solicitudes = await this.service.index()

    return response.ok({
      data: solicitudes,
    })
  }

  async show({ params, response }: HttpContext) {
    const solicitud = await this.service.show(
      Number(params.id)
    )

    return response.ok({
      data: solicitud,
    })
  }
  async entregar({ params, response, auth }: HttpContext) {
  const user = auth.user

  if (!user) {
    return response.unauthorized({
      message: 'Usuario no autenticado',
    })
  }

  const solicitud = await this.service.entregar(
    Number(params.id),
    user.id
  )

  return response.ok({
    message: 'Equipo entregado correctamente',
    data: solicitud,
  })
}

  async devolver({ params, request, response }: HttpContext) {
    const payload = await request.validateUsing(
      devolverSolicitudEquipoValidator
    )

    const solicitud = await this.service.devolver(
      Number(params.id),
      payload.estadoElemento,
      payload.observacion
    )

    return response.ok({
      message: 'Equipo devuelto correctamente',
      data: solicitud,
    })
  }
}