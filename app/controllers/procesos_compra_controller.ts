import type { HttpContext } from '@adonisjs/core/http'
import { Exception } from '@adonisjs/core/exceptions'
import { parseOptionalPositiveInt } from '#services/query_params'
import { resolveScope } from '#services/access_control'
import ProcesoCompraService from '#services/proceso_compra_service'
import { createProcesoCompraValidator } from '#validators/solicitud_programa'

export default class ProcesosCompraController {
  private service = new ProcesoCompraService()

  async consolidado({ auth, request, serialize }: HttpContext) {
    const vigencia = parseOptionalPositiveInt(request.input('vigencia'))
    if (!vigencia) {
      throw new Exception('vigencia es requerida', { status: 422, code: 'E_VALIDATION_ERROR' })
    }
    const scope = await resolveScope(auth.getUserOrFail())
    return serialize(await this.service.consolidado(scope, vigencia))
  }

  async store({ auth, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(createProcesoCompraValidator)
    const scope = await resolveScope(auth.getUserOrFail())
    return serialize(await this.service.generar(scope, payload))
  }
}
