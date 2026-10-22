import type { HttpContext } from '@adonisjs/core/http'
import { resolveScope } from '#services/access_control'
import { parseOptionalBoolean, parseOptionalPositiveInt } from '#services/query_params'
import FichaService from '#services/ficha_service'
import FichaTransformer from '#transformers/ficha_transformer'
import { createFichaValidator, updateFichaValidator } from '#validators/ficha'

export default class FichasController {
  private service = new FichaService()

  async index({ auth, request, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const estado = parseOptionalBoolean(request.input('estado'))
    const idCformacion = parseOptionalPositiveInt(request.input('idCformacion'))
    const idPrograma = parseOptionalPositiveInt(request.input('idPrograma'))
    const search = String(request.input('search', '')).trim() || undefined

    const fichas = await this.service.index(scope, {
      estado,
      idCformacion,
      idPrograma,
      search,
    })

    return serialize(FichaTransformer.transform(fichas))
  }

  async options({ auth, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())

    return serialize(await this.service.options(scope))
  }

  async show({ auth, params, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const ficha = await this.service.show(scope, Number(params.id))

    return serialize(FichaTransformer.transform(ficha))
  }

  async store({ auth, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(createFichaValidator)
    const scope = await resolveScope(auth.getUserOrFail())
    const ficha = await this.service.store(scope, payload)

    return serialize(FichaTransformer.transform(ficha))
  }

  async update({ auth, params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(updateFichaValidator)
    const scope = await resolveScope(auth.getUserOrFail())
    const ficha = await this.service.update(scope, Number(params.id), payload)

    return serialize(FichaTransformer.transform(ficha))
  }

  async destroy({ auth, params, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const result = await this.service.remove(scope, Number(params.id))

    return serialize(result)
  }
}
