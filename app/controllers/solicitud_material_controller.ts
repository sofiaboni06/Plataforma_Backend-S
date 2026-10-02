import type { HttpContext } from '@adonisjs/core/http'

import SolicitudMaterialService from '#services/solicitud_material_service'

export default class SolicitudMaterialController {
  private service = new SolicitudMaterialService()

  async store({ request, response, auth }: HttpContext) {
    const user = auth.user

    if (!user) {
      return response.unauthorized({
        message: 'Usuario no autenticado',
      })
    }

    const payload = request.only([
      'codigoSolicitud',
      'idObra',
      'idElemento',
      'cantidad',
      'ficha',
      'observacion',
    ])

    const solicitud = await this.service.create(
      payload,
      user.id
    )

    return response.created({
      message: 'Solicitud de material registrada correctamente',
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
    const solicitud = await this.service.show(Number(params.id))

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
      message: 'Material entregado correctamente',
      data: solicitud,
    })
  }
}