import type { HttpContext } from '@adonisjs/core/http'
import { parseOptionalBoolean } from '#services/query_params'
import LineaTematicaService from '#services/linea_tematica_service'
import LineaTematicaTransformer from '#transformers/linea_tematica_transformer'
import {
  createLineaTematicaValidator,
  updateLineaTematicaValidator,
} from '#validators/linea_tematica'

export default class LineasTematicasController {
  private service = new LineaTematicaService()

  async index({ request, serialize }: HttpContext) {
    const estado = parseOptionalBoolean(request.input('estado'))
    const search = String(request.input('search', '')).trim() || undefined
    const lineas = await this.service.index({ estado, search })

    return serialize(LineaTematicaTransformer.transform(lineas))
  }

  async options({ serialize }: HttpContext) {
    const lineas = await this.service.options()

    return serialize(lineas.map((linea) => ({ id: linea.id, nombre: linea.nombre })))
  }

  async show({ params, serialize }: HttpContext) {
    const linea = await this.service.show(Number(params.id))

    return serialize(LineaTematicaTransformer.transform(linea))
  }

  async store({ request, serialize }: HttpContext) {
    const payload = await request.validateUsing(createLineaTematicaValidator)
    const linea = await this.service.store(payload)

    return serialize(LineaTematicaTransformer.transform(linea))
  }

  async update({ params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(updateLineaTematicaValidator)
    const linea = await this.service.update(Number(params.id), payload)

    return serialize(LineaTematicaTransformer.transform(linea))
  }

  async destroy({ params, serialize }: HttpContext) {
    const result = await this.service.remove(Number(params.id))

    return serialize(result)
  }
}
