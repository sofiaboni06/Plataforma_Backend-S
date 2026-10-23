import type { HttpContext } from '@adonisjs/core/http'
import ListaMaestraMaterialService from '#services/lista_maestra_material_service'
import ListaMaestraMaterialTransformer from '#transformers/lista_maestra_material_transformer'
import { resolveScope } from '#services/access_control'
import { Exception } from '@adonisjs/core/exceptions'
import { parseOptionalPositiveInt } from '#services/query_params'
import {
  createListaMaestraValidator,
  importListaMaestraValidator,
  updateListaMaestraValidator,
} from '#validators/lista_maestra'

export default class ListasMaestrasMaterialController {
  private service = new ListaMaestraMaterialService()

  async listar({ auth, request, serialize }: HttpContext) {
    const programaId = parseOptionalPositiveInt(request.input('programaId'))
    if (!programaId) {
      throw new Exception('programaId es requerido', { status: 422, code: 'E_VALIDATION_ERROR' })
    }
    const scope = await resolveScope(auth.getUserOrFail())
    const items = await this.service.listar(scope, programaId)
    return serialize(ListaMaestraMaterialTransformer.transform(items))
  }

  async crear({ auth, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(createListaMaestraValidator)
    const scope = await resolveScope(auth.getUserOrFail())
    const item = await this.service.agregar(scope, payload)
    return serialize(ListaMaestraMaterialTransformer.transform(item))
  }

  async plantilla({ auth, request, response }: HttpContext) {
    const programaId = parseOptionalPositiveInt(request.input('programaId'))
    const scope = await resolveScope(auth.getUserOrFail())
    const archivo = await this.service.plantilla(scope, programaId)
    const nombre = 'plantilla-lista-maestra.xlsx'
    response.header(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response.header('Content-Disposition', `attachment; filename="${nombre}"`)
    return response.send(archivo)
  }

  async importar({ auth, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(importListaMaestraValidator)
    const scope = await resolveScope(auth.getUserOrFail())
    const result = await this.service.importarExcel(
      scope,
      payload.programaId,
      payload.archivo.tmpPath!,
      payload.archivo.clientName
    )

    return serialize({
      carga: result.carga,
      errores: result.errores,
      items: ListaMaestraMaterialTransformer.transform(result.items),
    })
  }

  async actualizar({ auth, params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(updateListaMaestraValidator)
    const scope = await resolveScope(auth.getUserOrFail())
    const item = await this.service.actualizar(scope, Number(params.id), payload)
    return serialize(ListaMaestraMaterialTransformer.transform(item))
  }

  async eliminar({ auth, params, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const result = await this.service.eliminar(scope, Number(params.id))
    return serialize(result)
  }
}
