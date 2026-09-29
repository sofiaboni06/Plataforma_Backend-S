import db from '@adonisjs/lucid/services/db'
import { Exception } from '@adonisjs/core/exceptions'
import Categoria from '#models/categoria'
import { assertCan, forbidden, type AccessScope } from '#services/access_control'
import { rethrowDatabaseError } from '#services/database_error'

export default class CategoriaService {
  async index(scope: AccessScope, options: { estado?: boolean } = {}) {
    const query = Categoria.query().orderBy('id_categoria', 'asc')

    if (!scope.isAdmin) {
      query.where('id_cformacion', scope.idCformacion)
    }

    // Disabled rows are the soft-deleted ones, so they stay out unless asked for.
    query.where('estado', options.estado ?? true)

    return query
  }

  async show(scope: AccessScope, id: number) {
    const categoria = await Categoria.findOrFail(id)
    this.assertInScope(scope, categoria)

    return categoria
  }

  async store(
    scope: AccessScope,
    payload: {
      idCformacion?: number
      nombre: string
      estado?: boolean
    }
  ) {
    try {
      return await Categoria.create({
        idCformacion: this.resolveCenter(scope, payload.idCformacion),
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
      idCformacion?: number
      nombre?: string
      estado?: boolean
    }
  ) {
    const categoria = await Categoria.findOrFail(id)
    this.assertInScope(scope, categoria)

    // Flipping `estado` is how a categoria gets deleted or restored, so it is
    // governed by the delete permission and not by the edit one.
    if (payload.estado !== undefined && payload.estado !== categoria.estado) {
      assertCan(scope, 'categoria.eliminar')

      if (payload.estado === false) {
        await this.assertNoActiveSubcategorias(id)
      }
    }

    categoria.merge({
      ...(payload.idCformacion !== undefined
        ? { idCformacion: this.resolveCenter(scope, payload.idCformacion) }
        : {}),
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
    const categoria = await Categoria.findOrFail(id)
    this.assertInScope(scope, categoria)

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

  /**
   * Only an admin may pick the training center. For everyone else the center of
   * their own account wins, so a client cannot create rows for another center.
   */
  private resolveCenter(scope: AccessScope, requested?: number) {
    if (!scope.isAdmin) {
      return scope.idCformacion
    }

    return requested ?? scope.idCformacion
  }

  private assertInScope(scope: AccessScope, categoria: Categoria) {
    if (!scope.isAdmin && categoria.idCformacion !== scope.idCformacion) {
      throw forbidden('Esa categoría no pertenece a tu centro de formación')
    }
  }
}
