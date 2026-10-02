import type { HttpContext } from '@adonisjs/core/http'
import { resolveScope } from '#services/access_control'
import { parseOptionalBoolean } from '#services/query_params'
import UsoPresupuestalService from '#services/uso_presupuestal_service'
import UsoPresupuestalTransformer from '#transformers/uso_presupuestal_transformer'
import {
  createUsoPresupuestalValidator,
  updateUsoPresupuestalValidator,
} from '#validators/uso_presupuestal'

export default class UsosPresupuestalesController {
  async index({ auth, request, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const usos = await new UsoPresupuestalService().index(scope, {
      estado: parseOptionalBoolean(request.input('estado')),
    })

    return serialize(UsoPresupuestalTransformer.transform(usos))
  }

  async show({ auth, params, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const uso = await new UsoPresupuestalService().show(scope, Number(params.id))

    return serialize(UsoPresupuestalTransformer.transform(uso))
  }

  async store({ auth, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(createUsoPresupuestalValidator)
    const scope = await resolveScope(auth.getUserOrFail())
    const uso = await new UsoPresupuestalService().store(scope, payload)

    return serialize(UsoPresupuestalTransformer.transform(uso))
  }

  async update({ auth, params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(updateUsoPresupuestalValidator)
    const scope = await resolveScope(auth.getUserOrFail())
    const uso = await new UsoPresupuestalService().update(scope, Number(params.id), payload)

    return serialize(UsoPresupuestalTransformer.transform(uso))
  }

  async destroy({ auth, params, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const result = await new UsoPresupuestalService().remove(scope, Number(params.id))

    return serialize(result)
  }
}
