import type { HttpContext } from '@adonisjs/core/http'
import StandService from '#services/stand_service'
import StandTransformer from '#transformers/stand_transformer'
import { createStandValidator, updateStandValidator } from '#validators/stand'

function parsePositiveInt(value: unknown, fallback: number) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function parseOptionalBoolean(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return undefined
  }

  if (value === true || value === 'true' || value === 1 || value === '1') {
    return true
  }

  if (value === false || value === 'false' || value === 0 || value === '0') {
    return false
  }

  return undefined
}

export default class StandsController {
  private service = new StandService()

  async index({ params, request, serialize }: HttpContext) {
    const page = parsePositiveInt(request.input('page'), 1)
    const perPage = Math.min(parsePositiveInt(request.input('perPage'), 20), 100)
    const search = String(request.input('search', '')).trim() || undefined
    const estado = parseOptionalBoolean(request.input('estado'))

    const result = await this.service.list({
      idBodega: Number(params.id),
      page,
      perPage,
      search,
      estado,
    })

    return serialize(StandTransformer.paginate(result.all(), result.getMeta()))
  }

  async store({ params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(createStandValidator)
    const stand = await this.service.create(Number(params.id), payload)

    return serialize(StandTransformer.transform(stand))
  }

  async show({ params, serialize }: HttpContext) {
    const stand = await this.service.show(Number(params.id))

    return serialize(StandTransformer.transform(stand))
  }

  async update({ params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(updateStandValidator)
    const stand = await this.service.update(Number(params.id), payload)

    return serialize(StandTransformer.transform(stand))
  }

  async destroy({ params, serialize }: HttpContext) {
    const result = await this.service.remove(Number(params.id))

    return serialize(result)
  }
}
