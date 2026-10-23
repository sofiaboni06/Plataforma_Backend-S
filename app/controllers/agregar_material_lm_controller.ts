import type { HttpContext } from '@adonisjs/core/http'
import AgregarMaterialLmService from '#services/agregar_material_lm_service'
import AgregarMaterialLmTransformer from '#transformers/agregar_material_lm_transformer'
import {
  listarAgregarMaterialLmValidator,
  crearAgregarMaterialLmValidator,
  actualizarAgregarMaterialLmValidator,
} from '#validators/agregar_material_lm'

export default class AgregarMaterialLmController {
  private service = new AgregarMaterialLmService()

  async index({ request, serialize }: HttpContext) {
    const { programaId, centroId } = await request.validateUsing(listarAgregarMaterialLmValidator)
    const items = await this.service.listar(programaId, centroId ?? null)
    return serialize(AgregarMaterialLmTransformer.transform(items))
  }

  async show({ params, serialize }: HttpContext) {
    const item = await this.service.obtener(Number(params.id))
    return serialize(AgregarMaterialLmTransformer.transform(item))
  }

  async store({ request, response, auth, serialize }: HttpContext) {
    const payload = await request.validateUsing(crearAgregarMaterialLmValidator)
    const item = await this.service.agregar(payload, auth.user?.id ?? null)
    response.created()
    return serialize(AgregarMaterialLmTransformer.transform(item))
  }

  async update({ params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(actualizarAgregarMaterialLmValidator)
    const item = await this.service.actualizar(Number(params.id), payload)
    return serialize(AgregarMaterialLmTransformer.transform(item))
  }

  async destroy({ params, response }: HttpContext) {
    await this.service.eliminar(Number(params.id))
    return response.noContent()
  }
}