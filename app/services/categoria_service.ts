import db from '@adonisjs/lucid/services/db'
import { Exception } from '@adonisjs/core/exceptions'
import Categoria from '#models/categoria'
import { assertCan, assertPlatformCatalog, type AccessScope } from '#services/access_control'
import { rethrowDatabaseError } from '#services/database_error'

export default class CategoriaService {
  async index(_scope: AccessScope, options: { estado?: boolean } = {}) {
    const query = Categoria.query().orderBy('id_categoria', 'asc')

    // Disabled rows are the soft-deleted ones, so they stay out unless asked for.
    query.where('estado', options.estado ?? true)

    return query
  }

  async show(_scope: AccessScope, id: number) {
    return Categoria.findOrFail(id)
  }

  async store(
    scope: AccessScope,
    payload: {
      nombre: string
      estado?: boolean
    }
  ) {
    assertPlatformCatalog(scope)

    try {
      return await Categoria.create({
        nombre: payload.nombre,
        estado: payload.estado ?? true,
      })
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo crear la categoría')
    }
  }

  async update(
    scope: AccessScope,
    id: number,
    payload: {
      nombre?: string
      estado?: boolean
    }
  ) {
    assertPlatformCatalog(scope)
    const categoria = await Categoria.findOrFail(id)

    // Flipping `estado` is how a categoria gets deleted or restored, so it is
    // governed by the delete permission and not by the edit one.
    if (payload.estado !== undefined && payload.estado !== categoria.estado) {
      assertCan(scope, 'categoria.eliminar')

      if (payload.estado === false) {
        await this.assertNoActiveSubcategorias(id)
      }
    }

    categoria.merge({
      ...(payload.nombre !== undefined ? { nombre: payload.nombre } : {}),
      ...(payload.estado !== undefined ? { estado: payload.estado } : {}),
    })

    try {
      await categoria.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo actualizar la categoría')
    }

    return categoria
  }

  /**
   * Soft delete. `subcategoria.id_categoria` is `ON DELETE RESTRICT`, and the
   * inventory needs to keep the classification of past elementos, so the row
   * stays and only `estado` drops.
   */
  async remove(scope: AccessScope, id: number) {
    assertPlatformCatalog(scope)
    const categoria = await Categoria.findOrFail(id)

    if (categoria.estado === false) {
      throw new Exception('La categoría ya está deshabilitada', {
        status: 409,
        code: 'E_ALREADY_DISABLED',
      })
    }

    await this.assertNoActiveSubcategorias(id)

    categoria.estado = false

    try {
      await categoria.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo deshabilitar la categoría')
    }

    return { message: 'Categoría deshabilitada correctamente' }
  }

  private async assertNoActiveSubcategorias(id: number) {
    const rows = await db
      .from('subcategoria')
      .where('id_categoria', id)
      .where('estado', true)
      .count('* as total')

    if (Number(rows[0].total) > 0) {
      throw new Exception(
        'No se puede deshabilitar la categoría porque tiene subcategorías activas. Deshabilítalas primero.',
        { status: 409, code: 'E_CATEGORIA_HAS_SUBCATEGORIAS' }
      )
    }
  }
}
