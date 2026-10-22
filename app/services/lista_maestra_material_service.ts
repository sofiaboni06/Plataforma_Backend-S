import { Exception } from '@adonisjs/core/exceptions'
import ExcelJS from 'exceljs'
import ListaMaestraMaterial from '#models/lista_maestra_material'
import Elemento from '#models/elemento'
import ProgramaFormacion from '#models/programa_formacion'

export default class ListaMaestraMaterialService {
  async listar(programaId: number, centroId: number | null) {
    const query = ListaMaestraMaterial.query()
      .where('programaId', programaId)
      .where('estado', true)
      .preload('elemento')
    if (centroId) query.where('centroId', centroId)
    return query.orderBy('id', 'asc')
  }

  async agregar(programaId: number, centroId: number | null, elementoId: number, cantidadBase: number, observaciones: string | null, usuarioId: number | null) {
    const elemento = await Elemento.find(elementoId)
    if (!elemento) {
      throw new Exception('El elemento no existe', { status: 404, code: 'E_NOT_FOUND' })
    }
    return ListaMaestraMaterial.create({
      programaId,
      centroId,
      elementoId,
      cantidadBase,
      observaciones,
      usuarioRegistroId: usuarioId,
      estado: true,
    })
  }

  async actualizar(id: number, payload: Partial<{ cantidadBase: number; observaciones: string | null; estado: boolean }>) {
    const item = await ListaMaestraMaterial.find(id)
    if (!item) {
      throw new Exception('El registro no existe', { status: 404, code: 'E_NOT_FOUND' })
    }
    if (payload.cantidadBase !== undefined) item.cantidadBase = payload.cantidadBase
    if (payload.observaciones !== undefined) item.observaciones = payload.observaciones
    if (payload.estado !== undefined) item.estado = payload.estado
    await item.save()
    return item
  }

  async eliminar(id: number) {
    const item = await ListaMaestraMaterial.find(id)
    if (!item) {
      throw new Exception('El registro no existe', { status: 404, code: 'E_NOT_FOUND' })
    }
    item.estado = false
    await item.save()
    return item
  }

  async importarExcel(programaId: number, centroId: number | null, filePath: string, usuarioId: number | null) {
    const programa = await ProgramaFormacion.find(programaId)
    if (!programa) {
      throw new Exception('El programa de formación no existe', { status: 404, code: 'E_NOT_FOUND' })
    }

    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile(filePath)
    const sheet = workbook.worksheets[0]
    if (!sheet) {
      throw new Exception('El archivo no contiene hojas', { status: 422, code: 'E_EXCEL_VACIO' })
    }

    const creados: any[] = []
    const errores: string[] = []

    for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
      const row = sheet.getRow(rowNumber)
      const codigo = this.celda(row, 1)
      const cantidadRaw = this.celda(row, 3)
      const observaciones = this.celda(row, 5)

      if (!codigo) continue

      const elemento = await Elemento.query().where('codigo', codigo).first()
      if (!elemento) {
        errores.push(`Fila ${rowNumber}: no existe elemento con código "${codigo}"`)
        continue
      }

      const cantidad = Number(cantidadRaw)
      creados.push({
        programaId,
        centroId,
        elementoId: elemento.id,
        cantidadBase: Number.isFinite(cantidad) && cantidad > 0 ? cantidad : 1,
        observaciones: observaciones || null,
        usuarioRegistroId: usuarioId,
        estado: true,
      })
    }

    if (!creados.length && !errores.length) {
      throw new Exception('El archivo no contiene filas válidas', { status: 422, code: 'E_EXCEL_SIN_FILAS' })
    }

    const items = creados.length ? await ListaMaestraMaterial.createMany(creados) : []
    return { items, errores }
  }

  private celda(row: ExcelJS.Row, index: number): string {
    const value = row.getCell(index).value
    if (value === null || value === undefined) return ''
    if (typeof value === 'object' && 'text' in (value as any)) {
      return String((value as any).text).trim()
    }
    return String(value).trim()
  }
}
