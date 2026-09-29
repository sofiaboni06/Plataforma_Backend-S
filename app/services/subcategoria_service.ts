import Subcategoria from '#models/subcategoria'
import {
  assertCategoriaInScope,
  assertSubcategoriaInScope,
  subcategoriaIdsQuery,
  type AccessScope,
} from '#services/access_control'
import { rethrowDatabaseError } from '#services/database_error'

export default class SubcategoriaService {
  async index(scope: AccessScope) {
    const query = Subcategoria.query().orderBy('id_subcategoria', 'asc')

    if (!scope.isAdmin) {
      query.whereIn('id_subcategoria', subcategoriaIdsQuery(scope))
    }

    return query
  }

  async show(scope: AccessScope, id: number) {
    await assertSubcategoriaInScope(scope, id)

    return Subcategoria.findOrFail(id)
  }

  async store(
    scope: AccessScope,
    payload: {
      idCategoria: number
      nombre: string
      estado?: boolean
    }
  ) {
    await assertCategoriaInScope(scope, payload.idCategoria)

    try {
      return await Subcategoria.create({
        idCategoria: payload.idCategoria,
        nombre: payload.nombre,
        estado: payload.estado ?? true,
      })
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo crear la subcategoría')
    }
  }

  async update(
    scope: AccessScope,
    id: number,
    payload: {
      idCategoria?: number
      nombre?: string
      estado?: boolean
    }
  ) {
    await assertSubcategoriaInScope(scope, id)

    if (payload.idCategoria !== undefined) {
      await assertCategoriaInScope(scope, payload.idCategoria)
    }

    const subcategoria = await Subcategoria.findOrFail(id)

    subcategoria.merge({
      ...(payload.idCategoria !== undefined ? { idCategoria: payload.idCategoria } : {}),
      ...(payload.nombre !== undefined ? { nombre: payload.nombre } : {}),
      ...(payload.estado !== undefined ? { estado: payload.estado } : {}),
    })

    try {
      await subcategoria.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo actualizar la subcategoría')
    }

    return subcategoria
  }
}
