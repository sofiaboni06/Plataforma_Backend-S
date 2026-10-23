import { Exception } from '@adonisjs/core/exceptions'
import AgregarMaterialLm from '#models/agregar_material_lm'
import Elemento from '#models/elemento'
import ProgramaFormacion from '#models/programa_formacion'

export default class AgregarMaterialLmService {
  async listar(programaId: number, centroId: number | null) {
    const query = AgregarMaterialLm.query()
      .where('programaId', programaId)
      .where('estado', true)
      .preload('elemento')
      .preload('programa')
      .preload('centro')
    if (centroId) query.where('centroId', centroId)
    return query.orderBy('id', 'asc')
  }

  async obtener(id: number) {
    const item = await AgregarMaterialLm.query()
      .where('id', id)
      .preload('elemento')
      .preload('programa')
      .preload('centro')
      .preload('usuarioRegistro')
      .first()

    if (!item) {
      throw new Exception('El registro no existe', { status: 404, code: 'E_NOT_FOUND' })
    }
    return item
  }

  async agregar(
    payload: {
      programaId: number
      centroId?: number | null
      elementoId: number
      cantidadBase?: number
      observaciones?: string | null
    },
    usuarioId: number | null
  ) {
    if (!(await ProgramaFormacion.find(payload.programaId))) {
      throw new Exception('El programa de formación no existe', { status: 404, code: 'E_NOT_FOUND' })
    }
    if (!(await Elemento.find(payload.elementoId))) {
      throw new Exception('El elemento no existe', { status: 404, code: 'E_NOT_FOUND' })
    }

    const centroId = payload.centroId ?? null
    await this.validarDuplicado(payload.programaId, centroId, payload.elementoId)

    const item = await AgregarMaterialLm.create({
      programaId: payload.programaId,
      centroId,
      elementoId: payload.elementoId,
      cantidadBase: payload.cantidadBase ?? 1,
      observaciones: payload.observaciones ?? null,
      usuarioRegistroId: usuarioId,
      estado: true,
    })

    await item.load('elemento')
    await item.load('programa')
    return item
  }

  async actualizar(
    id: number,
    payload: Partial<{
      programaId: number
      centroId: number | null
      elementoId: number
      cantidadBase: number
      observaciones: string | null
      estado: boolean
    }>
  ) {
    const item = await AgregarMaterialLm.find(id)
    if (!item) {
      throw new Exception('El registro no existe', { status: 404, code: 'E_NOT_FOUND' })
    }

    if (payload.programaId !== undefined && !(await ProgramaFormacion.find(payload.programaId))) {
      throw new Exception('El programa de formación no existe', { status: 404, code: 'E_NOT_FOUND' })
    }
    if (payload.elementoId !== undefined && !(await Elemento.find(payload.elementoId))) {
      throw new Exception('El elemento no existe', { status: 404, code: 'E_NOT_FOUND' })
    }

    const programaId = payload.programaId ?? item.programaId
    const centroId = payload.centroId !== undefined ? payload.centroId : item.centroId
    const elementoId = payload.elementoId ?? item.elementoId
    const seraActivo = payload.estado ?? item.estado

    if (seraActivo) {
      await this.validarDuplicado(programaId, centroId, elementoId, item.id)
    }

    item.merge(payload)
    await item.save()
    await item.load('elemento')
    await item.load('programa')
    return item
  }

  async eliminar(id: number) {
    const item = await AgregarMaterialLm.find(id)
    if (!item) {
      throw new Exception('El registro no existe', { status: 404, code: 'E_NOT_FOUND' })
    }
    item.estado = false
    await item.save()
  }

  private async validarDuplicado(
    programaId: number,
    centroId: number | null,
    elementoId: number,
    ignorarId?: number
  ) {
    const query = AgregarMaterialLm.query()
      .where('programaId', programaId)
      .where('elementoId', elementoId)
      .where('estado', true)

    if (centroId) query.where('centroId', centroId)
    else query.whereNull('centroId')
    if (ignorarId) query.whereNot('id', ignorarId)

    if (await query.first()) {
      throw new Exception('El elemento ya está en la lista maestra de este programa', {
        status: 409,
        code: 'E_DUPLICATE',
      })
    }
  }
}