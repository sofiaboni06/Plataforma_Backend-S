import type { HttpContext } from '@adonisjs/core/http'
import { resolveScope } from '#services/access_control'
import { parsePositiveInt } from '#services/query_params'
import SolicitudService from '#services/solicitud_service'
import EntregaTransformer from '#transformers/entrega_transformer'

function tipoFiltro(value: unknown) {
  return value === 'material' || value === 'equipo' ? value : undefined
}

export default class EntregasController {
  private service = new SolicitudService()

  async index({ auth, request, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const documento = request.input('documento')
    const result = await this.service.historialEntregas(scope, {
      page: parsePositiveInt(request.input('page'), 1),
      perPage: Math.min(parsePositiveInt(request.input('perPage'), 20), 100),
      tipo: tipoFiltro(request.input('tipo')),
      numeroDocumento: typeof documento === 'string' && documento.trim() ? documento : undefined,
    })

    return serialize(EntregaTransformer.paginate(result.all(), result.getMeta()))
  }
}
