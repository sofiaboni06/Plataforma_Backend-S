import type { HttpContext } from '@adonisjs/core/http'
import PresupuestoFormacionService from '#services/presupuesto_formacion_service'
import { resolveScope } from '#services/access_control'
import { parseOptionalPositiveInt } from '#services/query_params'
import {
  lotePresupuestoValidator,
  montoPresupuestoValidator,
  repartoPresupuestoValidator,
} from '#validators/presupuesto_formacion'

export default class PresupuestoFormacionController {
  private service = new PresupuestoFormacionService()

  async resumen({ auth, request, serialize }: HttpContext) {
    const anio = parseOptionalPositiveInt(request.input('anio'))
    const scope = await resolveScope(auth.getUserOrFail())
    return serialize(await this.service.resumen(scope, anio ?? new Date().getFullYear()))
  }

  async guardarMonto({ auth, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(montoPresupuestoValidator)
    const scope = await resolveScope(auth.getUserOrFail())
    return serialize(await this.service.guardarMonto(scope, payload.anio, payload.monto))
  }

  async repartir({ auth, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(repartoPresupuestoValidator)
    const scope = await resolveScope(auth.getUserOrFail())
    return serialize(await this.service.repartir(scope, payload.anio, payload.fichas))
  }

  async lotes({ auth, request, serialize }: HttpContext) {
    const anio = parseOptionalPositiveInt(request.input('anio'))
    const scope = await resolveScope(auth.getUserOrFail())
    const filas = await this.service.lotes(scope, anio ?? new Date().getFullYear())
    return serialize(filas.map((fila) => ({ id: fila.id, anio: fila.anio, nombre: fila.nombre })))
  }

  async crearLote({ auth, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(lotePresupuestoValidator)
    const scope = await resolveScope(auth.getUserOrFail())
    const lote = await this.service.crearLote(scope, payload.anio, payload.nombre)
    return serialize({ id: lote.id, anio: lote.anio, nombre: lote.nombre })
  }

  async descargar({ auth, request, response }: HttpContext) {
    const anio = parseOptionalPositiveInt(request.input('anio')) ?? new Date().getFullYear()
    const fichaId = parseOptionalPositiveInt(request.input('fichaId'))
    const loteId = parseOptionalPositiveInt(request.input('loteId'))
    const formato = String(request.input('formato') ?? 'excel')
    const scope = await resolveScope(auth.getUserOrFail())
    const filtros = { fichaId, loteId }

    if (formato === 'pdf') {
      const archivo = await this.service.pdf(scope, anio, filtros)
      response.header('Content-Type', 'application/pdf')
      response.header('Content-Disposition', `attachment; filename="presupuesto-${anio}.pdf"`)
      return response.send(archivo)
    }

    const archivo = await this.service.excel(scope, anio, filtros)
    response.header(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response.header('Content-Disposition', `attachment; filename="presupuesto-${anio}.xlsx"`)
    return response.send(archivo)
  }
}
