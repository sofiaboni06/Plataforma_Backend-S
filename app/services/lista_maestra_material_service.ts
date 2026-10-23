import { Exception } from '@adonisjs/core/exceptions'
import db from '@adonisjs/lucid/services/db'
import CargaListaMaestra from '#models/carga_lista_maestra'
import ListaMaestraMaterial from '#models/lista_maestra_material'
import ProgramaFormacion from '#models/programa_formacion'
import { assertCan, can, type AccessScope } from '#services/access_control'
import { rethrowDatabaseError } from '#services/database_error'
import {
  leerListaMaestraExcel,
  plantillaListaMaestra,
  type FilaListaMaestraExcel,
} from '#services/lista_maestra_excel'

type ListaMaestraPayload = {
  programaId: number
  codigoUnspsc: string
  producto: string
  descripcionTecnica?: string | null
  unidadMedida?: string | null
  cantidadBase: number
  caracter?: ListaMaestraMaterial['caracter']
  observaciones?: string | null
}

export default class ListaMaestraMaterialService {
  async plantilla(scope: AccessScope, programaId?: number) {
    assertCan(scope, 'lista_maestra.ver')
    if (!programaId) return plantillaListaMaestra()
    const programa = await this.assertProgramaVisible(scope, programaId)
    return plantillaListaMaestra({ codigo: programa.codigo, nombre: programa.nombre })
  }

  async listar(scope: AccessScope, programaId: number) {
    assertCan(scope, 'lista_maestra.ver')
    await this.assertProgramaVisible(scope, programaId)

    return ListaMaestraMaterial.query()
      .where('programaId', programaId)
      .where('estado', true)
      .preload('programa')
      .orderBy('producto', 'asc')
  }

  async agregar(scope: AccessScope, payload: ListaMaestraPayload) {
    assertCan(scope, 'lista_maestra.crear')
    await this.assertProgramaVisible(scope, payload.programaId)

    try {
      const item = await this.upsertFila(payload.programaId, {
        fila: 0,
        codigoUnspsc: payload.codigoUnspsc,
        producto: payload.producto,
        descripcionTecnica: payload.descripcionTecnica ?? null,
        unidadMedida: payload.unidadMedida ?? null,
        cantidadBase: payload.cantidadBase,
        caracter: payload.caracter ?? null,
        observaciones: payload.observaciones ?? null,
      }, scope.idUsuario, null)

      return this.show(item.id)
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo agregar el material a la lista maestra')
    }
  }

  async actualizar(
    scope: AccessScope,
    id: number,
    payload: Partial<Omit<ListaMaestraPayload, 'programaId'>> & { estado?: boolean }
  ) {
    assertCan(scope, 'lista_maestra.editar')
    const item = await ListaMaestraMaterial.findOrFail(id)
    await this.assertProgramaVisible(scope, item.programaId)

    item.merge({
      ...(payload.codigoUnspsc !== undefined ? { codigoUnspsc: payload.codigoUnspsc } : {}),
      ...(payload.producto !== undefined ? { producto: payload.producto } : {}),
      ...(payload.descripcionTecnica !== undefined
        ? { descripcionTecnica: payload.descripcionTecnica }
        : {}),
      ...(payload.unidadMedida !== undefined ? { unidadMedida: payload.unidadMedida } : {}),
      ...(payload.cantidadBase !== undefined ? { cantidadBase: payload.cantidadBase } : {}),
      ...(payload.caracter !== undefined ? { caracter: payload.caracter } : {}),
      ...(payload.observaciones !== undefined ? { observaciones: payload.observaciones } : {}),
      ...(payload.estado !== undefined ? { estado: payload.estado } : {}),
    })

    try {
      await item.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo actualizar el material de la lista maestra')
    }

    return this.show(id)
  }

  async eliminar(scope: AccessScope, id: number) {
    assertCan(scope, 'lista_maestra.eliminar')
    const item = await ListaMaestraMaterial.findOrFail(id)
    await this.assertProgramaVisible(scope, item.programaId)

    if (item.estado === false) {
      throw new Exception('El material ya está deshabilitado en la lista maestra', {
        status: 409,
        code: 'E_ALREADY_DISABLED',
      })
    }

    item.estado = false
    await item.save()
    return { message: 'Material deshabilitado de la lista maestra' }
  }

  async importarExcel(
    scope: AccessScope,
    programaId: number,
    filePath: string,
    nombreArchivo: string
  ) {
    assertCan(scope, 'lista_maestra.crear')
    const programa = await this.assertProgramaVisible(scope, programaId)
    const lectura = await leerListaMaestraExcel(filePath)

    if (
      lectura.codigoPrograma &&
      lectura.codigoPrograma.replace(/\s+/g, '') !== programa.codigo.replace(/\s+/g, '')
    ) {
      throw new Exception(
        `El Excel es del programa ${lectura.codigoPrograma} y se está cargando sobre ${programa.codigo}`,
        { status: 422, code: 'E_PROGRAMA_EXCEL' }
      )
    }

    if (!lectura.filas.length && !lectura.errores.length) {
      throw new Exception('El archivo no contiene filas de materiales', {
        status: 422,
        code: 'E_EXCEL_SIN_FILAS',
      })
    }

    const carga = await CargaListaMaestra.create({
      programaId,
      usuarioCargaId: scope.idUsuario,
      nombreArchivo,
      rutaArchivo: filePath,
      totalRegistros: lectura.filas.length,
      registrosOk: 0,
      registrosError: lectura.errores.length,
      estado: 'procesando',
    })

    const items: ListaMaestraMaterial[] = []
    const errores = [...lectura.errores]

    for (const fila of lectura.filas) {
      try {
        items.push(await this.upsertFila(programaId, fila, scope.idUsuario, carga.id))
      } catch (error) {
        errores.push(
          `Fila ${fila.fila}: ${error instanceof Error ? error.message : 'no se pudo guardar'}`
        )
      }
    }

    carga.registrosOk = items.length
    carga.registrosError = errores.length
    carga.estado = errores.length ? (items.length ? 'con_errores' : 'fallida') : 'completada'
    carga.observaciones = errores.slice(0, 20).join('\n') || null
    await carga.save()

    return {
      carga: {
        id: carga.id,
        totalRegistros: carga.totalRegistros,
        registrosOk: carga.registrosOk,
        registrosError: carga.registrosError,
        estado: carga.estado,
      },
      items,
      errores,
    }
  }

  async show(id: number) {
    return ListaMaestraMaterial.query().where('id', id).preload('programa').firstOrFail()
  }

  private async upsertFila(
    programaId: number,
    fila: FilaListaMaestraExcel,
    usuarioId: number,
    cargaId: number | null
  ) {
    const existing = await ListaMaestraMaterial.query()
      .where('programaId', programaId)
      .where('codigoUnspsc', fila.codigoUnspsc)
      .where('producto', fila.producto)
      .first()

    if (existing) {
      existing.merge({
        descripcionTecnica: fila.descripcionTecnica,
        unidadMedida: fila.unidadMedida,
        cantidadBase: fila.cantidadBase,
        caracter: fila.caracter,
        observaciones: fila.observaciones,
        cargaId,
        usuarioRegistroId: usuarioId,
        estado: true,
      })
      await existing.save()
      return existing
    }

    return ListaMaestraMaterial.create({
      programaId,
      codigoUnspsc: fila.codigoUnspsc,
      producto: fila.producto,
      descripcionTecnica: fila.descripcionTecnica,
      unidadMedida: fila.unidadMedida,
      cantidadBase: fila.cantidadBase,
      caracter: fila.caracter,
      observaciones: fila.observaciones,
      cargaId,
      usuarioRegistroId: usuarioId,
      estado: true,
    })
  }

  private async assertProgramaVisible(scope: AccessScope, programaId: number) {
    const programa = await ProgramaFormacion.findOrFail(programaId)
    if (scope.isAdmin || can(scope, 'proceso_compra.ver')) return programa

    const assigned = await db
      .from('usuario_programa_formacion')
      .where('id_usuario', scope.idUsuario)
      .where('id_programa_formacion', programaId)
      .where('estado', true)
      .first()

    if (!assigned) {
      throw new Exception(
        'No tienes este programa de formación asignado. Pídele al administrador que te lo asigne.',
        {
          status: 403,
          code: 'E_FORBIDDEN',
        }
      )
    }

    return programa
  }
}

