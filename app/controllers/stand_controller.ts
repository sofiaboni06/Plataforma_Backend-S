import type { HttpContext } from '@adonisjs/core/http'

import BodegaService from '#services/bodega_service'
import Stand from '#models/stand'

import {
  createStandValidator,
  updateStandValidator,
} from '#validators/bodega'

function parsePositiveInt(value: unknown, fallback: number) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function parseOptionalBoolean(value: unknown) {
  if (value === undefined || value === null || value === '') return undefined

  if (value === true || value === 'true' || value === 1 || value === '1') {
    return true
  }

  if (value === false || value === 'false' || value === 0 || value === '0') {
    return false
  }

  return undefined
}

export default class StandsController {
  private service = new BodegaService()

  async index({ params, request }: HttpContext) {
    const page = parsePositiveInt(request.input('page'), 1)

    const perPage = Math.min(
      parsePositiveInt(request.input('perPage'), 20),
      100
    )

    const search =
      String(request.input('search', '')).trim() || undefined

    const estado = parseOptionalBoolean(request.input('estado'))

    const result = await this.service.listStands({
      id_bodega: Number(params.id_bodega),
      page,
      perPage,
      search,
      estado,
    })

    return {
      data: result.all().map((stand) => this.serializeStand(stand)),
      meta: result.getMeta(),
    }
  }

  async store({ params, request }: HttpContext) {
    const payload = await request.validateUsing(createStandValidator)

    const stand = await this.service.createStand(
      Number(params.id_bodega),
      payload
    )

    return {
      data: this.serializeStand(stand),
      message: 'Stand creado correctamente',
    }
  }
  async show({ params }: HttpContext) {
    const stand = await this.service.showStand(Number(params.id))

    return this.serializeStand(stand)
  }

  async update({ params, request }: HttpContext) {
    const payload = await request.validateUsing(updateStandValidator)

    const stand = await this.service.updateStand(
      Number(params.id),
      payload
    )

    return {
      data: this.serializeStand(stand),
      message: 'Stand actualizado correctamente',
    }
  }

  async destroy({ params, response }: HttpContext) {
    const result = await this.service.removeStand(Number(params.id))

    return response.status(200).send(result)
  }

  private serializeStand(stand: Stand) {
    return {
      id: stand.id,
      idStand: stand.id,
      idBodega: stand.id_bodega,
      nombre: stand.nombre,
      estado: stand.estado,

      bodega: stand.bodega
        ? {
            id: stand.bodega.id,
            nombre: stand.bodega.nombre,
          }
        : null,
    }
  }
}