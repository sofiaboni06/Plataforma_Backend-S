import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'
import ListaMaestraMaterialService from '#services/lista_maestra_material_service'

export default class ListasMaestrasMaterialController {
  async listar({ request, response }: HttpContext) {
    const programaId = Number(request.input('programaId'))
    const centroId = request.input('centroId') ? Number(request.input('centroId')) : null
    if (!programaId) {
      throw new Exception('programaId es requerido', { status: 422, code: 'E_VALIDATION_ERROR' })
    }
    const service = new ListaMaestraMaterialService()
    const items = await service.listar(programaId, centroId)
    return response.ok({ data: items })
  }

  async crear({ request, response, auth }: HttpContext) {
    const programaId = Number(request.input('programaId'))
    const centroId = request.input('centroId') ? Number(request.input('centroId')) : null
    const elementoId = Number(request.input('elementoId'))
    const cantidadBase = Number(request.input('cantidadBase') ?? 1)
    const observaciones = request.input('observaciones') ?? null
    if (!programaId || !elementoId) {
      throw new Exception('programaId y elementoId son requeridos', { status: 422, code: 'E_VALIDATION_ERROR' })
    }
    const service = new ListaMaestraMaterialService()
    const item = await service.agregar(programaId, centroId, elementoId, cantidadBase, observaciones, auth.user?.id ?? null)
    return response.created({ data: item })
  }

  async importar({ request, response, auth }: HttpContext) {
    const programaId = Number(request.input('programaId'))
    const centroId = request.input('centroId') ? Number(request.input('centroId')) : null
    const archivo = request.file('archivo')
    if (!programaId || !archivo) {
      throw new Exception('programaId y archivo son requeridos', { status: 422, code: 'E_VALIDATION_ERROR' })
    }
    await archivo.move('/tmp')
    const service = new ListaMaestraMaterialService()
    const result = await service.importarExcel(programaId, centroId, archivo.tmpPath!, auth.user?.id ?? null)
    return response.created({ data: result })
  }

  async actualizar({ request, response }: HttpContext) {
    const id = Number(request.param('id'))
    const payload = request.only(['cantidadBase', 'observaciones', 'estado'])
    const service = new ListaMaestraMaterialService()
    const item = await service.actualizar(id, payload)
    return response.ok({ data: item })
  }

  async eliminar({ response }: HttpContext) {
    const id = Number((response as any).request?.param?.('id'))
    const service = new ListaMaestraMaterialService()
    await service.eliminar(id)
    return response.noContent()
  }
}
