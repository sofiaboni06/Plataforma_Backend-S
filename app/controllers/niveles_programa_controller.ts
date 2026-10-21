import type { HttpContext } from '@adonisjs/core/http'
import NivelProgramaService from '#services/nivel_programa_service'
import NivelProgramaTransformer from '#transformers/nivel_programa_transformer'
import {
  createNivelProgramaValidator,
  updateNivelProgramaValidator,
} from '#validators/nivel_programa'

export default class NivelesProgramaController {
  private service = new NivelProgramaService()

  async index({ request, serialize }: HttpContext) {
    const search = String(request.input('search', '')).trim() || undefined
    const niveles = await this.service.index({ search })

    return serialize(NivelProgramaTransformer.transform(niveles))
  }

  async show({ params, serialize }: HttpContext) {
    const nivel = await this.service.show(Number(params.id))

    return serialize(NivelProgramaTransformer.transform(nivel))
  }

  async store({ request, serialize }: HttpContext) {
    const payload = await request.validateUsing(createNivelProgramaValidator)
    const nivel = await this.service.store(payload)

    return serialize(NivelProgramaTransformer.transform(nivel))
  }

  async update({ params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(updateNivelProgramaValidator)
    const nivel = await this.service.update(Number(params.id), payload)

    return serialize(NivelProgramaTransformer.transform(nivel))
  }

  async destroy({ params, serialize }: HttpContext) {
    const result = await this.service.remove(Number(params.id))

    return serialize(result)
  }
}
