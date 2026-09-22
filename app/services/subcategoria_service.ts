import Subcategoria from '#models/subcategoria'
import { rethrowDatabaseError } from '#services/database_error'

export default class SubcategoriaService {
  async index() {
    return Subcategoria.query().orderBy('id_subcategoria', 'asc')
  }

  async show(id: number) {
    return Subcategoria.findOrFail(id)
  }

  async store(payload: {
    idCategoria: number
    nombre: string
    estado?: boolean
  }) {
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
    id: number,
    payload: {
      idCategoria?: number
      nombre?: string
      estado?: boolean
    }
  ) {
    const subcategoria = await Subcategoria.findOrFail(id)

    subcategoria.merge({
      idCategoria: payload.idCategoria,
      nombre: payload.nombre,
      estado: payload.estado,
    })

    try {
      await subcategoria.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo actualizar la subcategoría')
    }

    return subcategoria
  }
}