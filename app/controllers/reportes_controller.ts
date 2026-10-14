import { HttpContext } from '@adonisjs/core/http'
import ReporteService, { type CampoReporte } from '#services/reporte_service'
import { resolveScope } from '#services/access_control'

export default class ReportesController {
  /**
   * Genera reporte de elementos filtrados por bodegas
   * GET /api/v1/reportes/elementos?formato=excel&bodegaIds=1&bodegaIds=2&campos=nombre&campos=cantidad
   */
  async elementos({ request, auth, response }: HttpContext) {
    try {
      const formato = request.input('formato') as 'excel' | 'pdf'
      const bodegaIdsInput = request.input('bodegaIds')
      const camposInput = request.input('campos')

      // Convertir bodegaIds a array si viene como string o number
      let bodegaIds: number[] | undefined
      if (bodegaIdsInput !== undefined) {
        if (Array.isArray(bodegaIdsInput)) {
          bodegaIds = bodegaIdsInput.map(Number)
        } else if (typeof bodegaIdsInput === 'string') {
          bodegaIds = bodegaIdsInput.split(',').map(Number)
        } else if (typeof bodegaIdsInput === 'number') {
          bodegaIds = [bodegaIdsInput]
        }
      }

      // Convertir campos a array si viene como string o array
      let campos: CampoReporte[] | undefined
      if (camposInput !== undefined) {
        if (Array.isArray(camposInput)) {
          campos = camposInput as CampoReporte[]
        } else if (typeof camposInput === 'string') {
          campos = camposInput.split(',') as CampoReporte[]
        }
      }

      if (!formato || !['excel', 'pdf'].includes(formato)) {
        return response.badRequest({ message: 'Formato inválido. Use "excel" o "pdf"' })
      }

      const scope = await resolveScope(auth.getUserOrFail())
      const servicio = new ReporteService()

      const buffer = await servicio.generar(scope, formato, bodegaIds, campos)

      const contentType =
        formato === 'excel'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'application/pdf'

      const extension = formato === 'excel' ? 'xlsx' : 'pdf'
      const fecha = new Date().toISOString().split('T')[0]
      const filename = `reporte_materiales_${fecha}.${extension}`

      response.header('Content-Type', contentType)
      response.header('Content-Disposition', `attachment; filename="${filename}"`)
      return response.send(buffer)
    } catch (error) {
      console.error('Error generando reporte elementos:', error)
      return response.internalServerError({
        message: 'Error al generar el reporte',
        error: error instanceof Error ? error.message : 'Error desconocido',
      })
    }
  }

  /**
   * Genera reporte de una bodega específica
   * GET /api/v1/reportes/bodega/:id/excel?campos=nombre&campos=cantidad
   * GET /api/v1/reportes/bodega/:id/pdf?campos=nombre&campos=cantidad
   */
  async bodega({ params, request, auth, response }: HttpContext) {
    try {
      const formato = params.formato as 'excel' | 'pdf'
      const bodegaId = Number(params.id)
      const camposInput = request.input('campos')

      // Convertir campos a array si viene como string o array
      let campos: CampoReporte[] | undefined
      if (camposInput !== undefined) {
        if (Array.isArray(camposInput)) {
          campos = camposInput as CampoReporte[]
        } else if (typeof camposInput === 'string') {
          campos = camposInput.split(',') as CampoReporte[]
        }
      }

      if (!formato || !['excel', 'pdf'].includes(formato)) {
        return response.badRequest({ message: 'Formato inválido. Use "excel" o "pdf"' })
      }

      const scope = await resolveScope(auth.getUserOrFail())
      const servicio = new ReporteService()

      const buffer = await servicio.generar(scope, formato, [bodegaId], campos)

      const contentType =
        formato === 'excel'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'application/pdf'

      const extension = formato === 'excel' ? 'xlsx' : 'pdf'
      const fecha = new Date().toISOString().split('T')[0]
      const filename = `reporte_bodega_${bodegaId}_${fecha}.${extension}`

      response.header('Content-Type', contentType)
      response.header('Content-Disposition', `attachment; filename="${filename}"`)
      return response.send(buffer)
    } catch (error) {
      console.error('Error generando reporte bodega:', error)
      return response.internalServerError({
        message: 'Error al generar el reporte',
        error: error instanceof Error ? error.message : 'Error desconocido',
      })
    }
  }
}
