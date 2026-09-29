import type { HttpContext } from '@adonisjs/core/http'
import BodegaService from '#services/bodega_service'
import BodegaTransformer from '#transformers/bodega_transformer'
import { resolveScope } from '#services/access_control'
import { createBodegaValidator, updateBodegaValidator } from '#validators/bodega'

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

export default class BodegasController {
  private service = new BodegaService()

  async index({ auth, request, serialize }: HttpContext) {
    const page = parsePositiveInt(request.input('page'), 1)
    const perPage = Math.min(parsePositiveInt(request.input('perPage'), 10), 100)
    const search = String(request.input('search', '')).trim() || undefined
    const idCformacion = request.input('idCformacion')
      ? parsePositiveInt(request.input('idCformacion'), 0)
      : undefined
    const estado = parseOptionalBoolean(request.input('estado'))
    const scope = await resolveScope(auth.getUserOrFail())

    const result = await this.service.list(scope, {
      page,
      perPage,
      search,
      idCformacion,
      estado,
    })

    return serialize(BodegaTransformer.paginate(result.all(), result.getMeta()))
  }

  async show({ auth, params, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const bodega = await this.service.show(scope, Number(params.id))

    return serialize(BodegaTransformer.transform(bodega))
  }

  async store({ auth, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(createBodegaValidator)
    const scope = await resolveScope(auth.getUserOrFail())
    const bodega = await this.service.create(scope, {
      nombre: payload.nombre,
      idCformacion: payload.idCformacion,
      estado: payload.estado,
    })

    return serialize(BodegaTransformer.transform(bodega))
  }

  async update({ auth, params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(updateBodegaValidator)
    const scope = await resolveScope(auth.getUserOrFail())
    const bodega = await this.service.update(scope, Number(params.id), payload)

    return serialize(BodegaTransformer.transform(bodega))
  }

  async destroy({ auth, params, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const result = await this.service.remove(scope, Number(params.id))

    return serialize(result)
  }
}
