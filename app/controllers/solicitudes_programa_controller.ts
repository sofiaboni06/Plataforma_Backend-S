import type { HttpContext } from '@adonisjs/core/http'
import { parseOptionalPositiveInt } from '#services/query_params'
import { resolveScope } from '#services/access_control'
import PresupuestoFormacionService from '#services/presupuesto_formacion_service'
import SolicitudProgramaService from '#services/solicitud_programa_service'
import SolicitudProgramaTransformer from '#transformers/solicitud_programa_transformer'
import {
  createSolicitudProgramaValidator,
  decidirSolicitudProgramaValidator,
  updateSolicitudProgramaValidator,
} from '#validators/solicitud_programa'

export default class SolicitudesProgramaController {
  private service = new SolicitudProgramaService()
  private presupuesto = new PresupuestoFormacionService()

  private async conPresupuesto<T extends { fichaId: number; vigencia: number }>(
    scope: Awaited<ReturnType<typeof resolveScope>>,
    solicitudes: T | T[]
  ) {
    const lista = Array.isArray(solicitudes) ? solicitudes : [solicitudes]
    const cortes = await this.presupuesto.cortesFicha(scope, lista)
    for (const solicitud of lista) {
      const extra = solicitud as T & { $extras: Record<string, unknown> }
      extra.$extras.presupuestoFicha =
        cortes.get(`${solicitud.vigencia}:${solicitud.fichaId}`) ?? null
    }
  }

  async index({ auth, request, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const vigencia = parseOptionalPositiveInt(request.input('vigencia'))
    const estado = String(request.input('estado', '')).trim() || undefined
    const solicitudes = await this.service.index(scope, { vigencia, estado })
    await this.conPresupuesto(scope, solicitudes)
    return serialize(SolicitudProgramaTransformer.transform(solicitudes))
  }

  async show({ auth, params, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const solicitud = await this.service.show(scope, Number(params.id))
    await this.conPresupuesto(scope, solicitud)
    return serialize(SolicitudProgramaTransformer.transform(solicitud))
  }

  async store({ auth, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(createSolicitudProgramaValidator)
    const scope = await resolveScope(auth.getUserOrFail())
    const solicitud = await this.service.store(scope, payload)
    return serialize(SolicitudProgramaTransformer.transform(solicitud))
  }

  async update({ auth, params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(updateSolicitudProgramaValidator)
    const scope = await resolveScope(auth.getUserOrFail())
    const solicitud = await this.service.update(scope, Number(params.id), payload)
    return serialize(SolicitudProgramaTransformer.transform(solicitud))
  }

  async enviar({ auth, params, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const solicitud = await this.service.enviar(scope, Number(params.id))
    await this.conPresupuesto(scope, solicitud)
    return serialize(SolicitudProgramaTransformer.transform(solicitud))
  }

  async decidir({ auth, params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(decidirSolicitudProgramaValidator)
    const scope = await resolveScope(auth.getUserOrFail())
    const solicitud = await this.service.decidir(scope, Number(params.id), payload)
    await this.conPresupuesto(scope, solicitud)
    return serialize(SolicitudProgramaTransformer.transform(solicitud))
  }

  async destroy({ auth, params, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const solicitud = await this.service.anular(scope, Number(params.id))
    return serialize(SolicitudProgramaTransformer.transform(solicitud))
  }
}
