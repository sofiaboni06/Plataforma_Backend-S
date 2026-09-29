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
  async index({ request, serialize }: HttpContext) {
    const usos = await new UsoPresupuestalService().index({
      estado: parseOptionalBoolean(request.input('estado')),
    })

    return serialize(UsoPresupuestalTransformer.transform(usos))
  }

  async show({ params, serialize }: HttpContext) {
    const uso = await new UsoPresupuestalService().show(Number(params.id))

    return serialize(UsoPresupuestalTransformer.transform(uso))
  }

  async store({ request, serialize }: HttpContext) {
    const payload = await request.validateUsing(createUsoPresupuestalValidator)
    const uso = await new UsoPresupuestalService().store(payload)

    return serialize(UsoPresupuestalTransformer.transform(uso))
  }

  async update({ auth, params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(updateUsoPresupuestalValidator)
    const scope = await resolveScope(auth.getUserOrFail())
    const uso = await new UsoPresupuestalService().update(scope, Number(params.id), payload)

    return serialize(UsoPresupuestalTransformer.transform(uso))
  }

  async destroy({ params, serialize }: HttpContext) {
    const result = await new UsoPresupuestalService().remove(Number(params.id))

    return serialize(result)
  }
}
