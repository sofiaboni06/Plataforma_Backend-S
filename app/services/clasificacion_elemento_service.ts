import { Exception } from '@adonisjs/core/exceptions'
import type { CaracterElemento } from '#data/clasificaciones_elemento'
import ClasificacionElemento from '#models/clasificacion_elemento'
import { assertCan, assertPlatformCatalog, type AccessScope } from '#services/access_control'
import { rethrowDatabaseError } from '#services/database_error'

type ClasificacionPayload = {
  nombre: string
  caracter: CaracterElemento
  estado?: boolean
}

/**
 * Dos nombres son el mismo si solo cambian mayúsculas, tildes o espacios:
 * "Material de consumo", "MATERIAL  DE CONSUMO" y "material de cónsumo".
 */
export function nombreComparable(nombre: string) {
  return nombre.normalize('NFD').replace(/\p{M}/gu, '').replace(/\s+/g, ' ').trim().toLowerCase()
}

export default class ClasificacionElementoService {
  async index(_scope: AccessScope, options: { estado?: boolean } = {}) {
    return ClasificacionElemento.query()
      .where('estado', options.estado ?? true)
      .orderBy('nombre', 'asc')
  }

  async show(_scope: AccessScope, id: number) {
    return ClasificacionElemento.findOrFail(id)
  }

  async store(scope: AccessScope, payload: ClasificacionPayload) {
    assertPlatformCatalog(scope)
    await this.assertNombreLibre(payload.nombre)

    try {
      return await ClasificacionElemento.create({
        nombre: payload.nombre,
        caracter: payload.caracter,
        estado: payload.estado ?? true,
      })
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo crear la clasificación')
    }
  }

  async update(scope: AccessScope, id: number, payload: Partial<ClasificacionPayload>) {
    assertPlatformCatalog(scope)
    const clasificacion = await this.show(scope, id)

    if (payload.estado !== undefined && payload.estado !== clasificacion.estado) {
      assertCan(scope, 'clasificacion_elemento.eliminar')
    }

    if (payload.nombre !== undefined) {
      await this.assertNombreLibre(payload.nombre, clasificacion.id)
    }

    clasificacion.merge({
      ...(payload.nombre !== undefined ? { nombre: payload.nombre } : {}),
      ...(payload.caracter !== undefined ? { caracter: payload.caracter } : {}),
      ...(payload.estado !== undefined ? { estado: payload.estado } : {}),
    })

    try {
      await clasificacion.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo actualizar la clasificación')
    }

    return clasificacion
  }

  /**
   * Sin migraciones ni índices nuevos: se compara contra todas las
   * clasificaciones (activas o no; son pocas). Al editar se excluye la propia.
   */
  private async assertNombreLibre(nombre: string, excluirId?: number) {
    const buscado = nombreComparable(nombre)
    const filas = await ClasificacionElemento.query().select(
      'id_clasificacion_elemento',
      'nombre',
      'estado'
    )
    const igual = filas.find(
      (row) => row.id !== excluirId && nombreComparable(row.nombre) === buscado
    )

    if (igual) {
      throw new Exception('Ya existe una clasificación con ese nombre', {
        status: 422,
        code: 'E_CLASIFICACION_DUPLICADA',
      })
    }
  }

  /**
   * Soft delete. Elementos keep the foreign key, so the name stays on old
   * stock rows. The select only lists active classifications.
   */
  async remove(scope: AccessScope, id: number) {
    assertPlatformCatalog(scope)
    const clasificacion = await this.show(scope, id)

    if (clasificacion.estado === false) {
      throw new Exception('La clasificación ya está deshabilitada', {
        status: 409,
        code: 'E_ALREADY_DISABLED',
      })
    }

    clasificacion.estado = false

    try {
      await clasificacion.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo deshabilitar la clasificación')
    }

    return { message: 'Clasificación deshabilitada correctamente' }
  }
}
