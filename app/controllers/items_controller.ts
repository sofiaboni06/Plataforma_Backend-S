import ItemService from '#services/item_service'
import ItemTransformer from '#transformers/item_transformer'
import { resolveScope } from '#services/access_control'
import { parseOptionalBoolean, parsePositiveInt } from '#services/query_params'
import { createItemValidator, updateItemValidator } from '#validators/item'
import type { HttpContext } from '@adonisjs/core/http'

export default class ItemsController {
  private service = new ItemService()

  async index({ auth, request, serialize }: HttpContext) {
    const page = parsePositiveInt(request.input('page'), 1)
    const perPage = Math.min(parsePositiveInt(request.input('perPage'), 20), 100)
    const search = String(request.input('search', '')).trim() || undefined
    const estado = parseOptionalBoolean(request.input('estado'))
    const idSubcategoria = request.input('idSubcategoria')
      ? parsePositiveInt(request.input('idSubcategoria'), 0)
      : undefined
    const scope = await resolveScope(auth.getUserOrFail())

    const result = await this.service.list(scope, {
      page,
      perPage,
      idSubcategoria,
      search,
      estado,
    })

    return serialize(ItemTransformer.paginate(result.all(), result.getMeta()))
  }

  async show({ auth, params, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const item = await this.service.show(scope, Number(params.id))

    return serialize(ItemTransformer.transform(item))
  }

  async store({ auth, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(createItemValidator)
    const scope = await resolveScope(auth.getUserOrFail())
    const item = await this.service.create(scope, payload)

    return serialize(ItemTransformer.transform(item))
  }

  async update({ auth, params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(updateItemValidator)
    const scope = await resolveScope(auth.getUserOrFail())
    const item = await this.service.update(scope, Number(params.id), payload)

    return serialize(ItemTransformer.transform(item))
  }

  async destroy({ auth, params, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const result = await this.service.remove(scope, Number(params.id))

    return serialize(result)
  }
}
