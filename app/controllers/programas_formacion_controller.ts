import type { HttpContext } from '@adonisjs/core/http'
import { parseOptionalBoolean, parseOptionalPositiveInt } from '#services/query_params'
import ProgramaFormacionService from '#services/programa_formacion_service'
import UsuarioService from '#services/usuario_service'
import AdminUserTransformer from '#transformers/admin_user_transformer'
import ProgramaFormacionTransformer from '#transformers/programa_formacion_transformer'
import {
  createProgramaFormacionValidator,
  updateProgramaFormacionValidator,
} from '#validators/programa_formacion'

export default class ProgramasFormacionController {
  private service = new ProgramaFormacionService()

  async index({ request, serialize }: HttpContext) {
    const estado = parseOptionalBoolean(request.input('estado'))
    const idNivelPrograma = parseOptionalPositiveInt(request.input('idNivelPrograma'))
    const idCformacion = parseOptionalPositiveInt(request.input('idCformacion'))
    const search = String(request.input('search', '')).trim() || undefined
    const programas = await this.service.index({ estado, idNivelPrograma, idCformacion, search })

    return serialize(ProgramaFormacionTransformer.transform(programas))
  }

  async options({ serialize }: HttpContext) {
    return serialize(await this.service.options())
  }

  async show({ params, serialize }: HttpContext) {
    const programa = await this.service.show(Number(params.id))

    return serialize(ProgramaFormacionTransformer.transform(programa))
  }

  async usuarios({ params, serialize }: HttpContext) {
    const usuarios = await new UsuarioService().usuariosDelPrograma(Number(params.id))

    return serialize(AdminUserTransformer.transform(usuarios))
  }

  async store({ request, serialize }: HttpContext) {
    const payload = await request.validateUsing(createProgramaFormacionValidator)
    const programa = await this.service.store(payload)

    return serialize(ProgramaFormacionTransformer.transform(programa))
  }

  async update({ params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(updateProgramaFormacionValidator)
    const programa = await this.service.update(Number(params.id), payload)

    return serialize(ProgramaFormacionTransformer.transform(programa))
  }

  async destroy({ params, serialize }: HttpContext) {
    const result = await this.service.remove(Number(params.id))

    return serialize(result)
  }
}
