import type { HttpContext } from '@adonisjs/core/http'

import BodegaService from '#services/bodega_service'
import Bodega from '#models/bodega'

import {
  createBodegaValidator,
  updateBodegaValidator,
} from '#validators/bodega'

function parsePositiveInt(value: unknown, fallback: number) {
  const parsed = Number(value)

  return Number.isInteger(parsed) && parsed > 0
    ? parsed
    : fallback
}

function parseOptionalBoolean(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return undefined
  }

  if (
    value === true ||
    value === 'true' ||
    value === 1 ||
    value === '1'
  ) {
    return true
  }

  if (
    value === false ||
    value === 'false' ||
    value === 0 ||
    value === '0'
  ) {
    return false
  }

  return undefined
}

export default class BodegasController {
  private service = new BodegaService()

  async index({ request }: HttpContext) {
    const page = parsePositiveInt(
      request.input('page'),
      1
    )

    const perPage = Math.min(
      parsePositiveInt(
        request.input('perPage'),
        10
      ),
      100
    )

    const search =
      String(request.input('search', '')).trim() || undefined

    const idCformacion = request.input('idCformacion')
      ? parsePositiveInt(
          request.input('idCformacion'),
          0
        )
      : undefined

    const estado = parseOptionalBoolean(
      request.input('estado')
    )

    const result = await this.service.list({
      page,
      perPage,
      search,
      idCformacion,
      estado,
    })

    return {
      data: result
        .all()
        .map((bodega) => this.serializeBodega(bodega)),

      meta: result.getMeta(),
    }
  }

  async show({ params }: HttpContext) {
    const bodega = await this.service.show(
      Number(params.id)
    )

    return {
      data: this.serializeBodega(bodega),
    }
  }

  async store({ auth, request }: HttpContext) {
    const payload = await request.validateUsing(
      createBodegaValidator
    )

    const user = auth.getUserOrFail()

    const bodega = await this.service.create({
      nombre: payload.nombre,
      idCformacion: payload.idCformacion ?? user.idCformacion,
      estado: payload.estado,
    })

    return {
      data: this.serializeBodega(bodega),
      message: 'Bodega creada correctamente',
    }
  }

  async update({ params, request }: HttpContext) {
    const payload = await request.validateUsing(
      updateBodegaValidator
    )

    const bodega = await this.service.update(
      Number(params.id),
      payload
    )

    return {
      data: this.serializeBodega(bodega),
      message: 'Bodega actualizada correctamente',
    }
  }

  async destroy({ params, response }: HttpContext) {
    const result = await this.service.remove(
      Number(params.id)
    )

    return response.status(200).send(result)
  }

  private serializeBodega(bodega: Bodega) {
    return {
      id: bodega.id,

      id_bodega: bodega.id,

      id_cformacion: bodega.idCformacion,

      nombre: bodega.nombre,

      estado: bodega.estado,

      ubicacion:
        bodega.trainingCenter?.nombre ?? null,

      centroFormacion: bodega.trainingCenter
        ? {
            id: bodega.trainingCenter.id,
            nombre: bodega.trainingCenter.nombre,
          }
        : null,

      stands: (bodega.stands ?? []).map((stand) => ({
        id: stand.id,
        idStand: stand.id,
        nombre: stand.nombre,
        estado: stand.estado,
      })),

      totalStands:
        bodega.stands?.length ?? 0,
    }
  }
}