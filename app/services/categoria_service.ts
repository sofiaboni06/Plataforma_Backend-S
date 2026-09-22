import Categoria from '#models/categoria'
import { rethrowDatabaseError } from '#services/database_error'

export default class CategoriaService {
  async index() {
    return Categoria.query().orderBy('id_categoria', 'asc')
  }

  async show(id: number) {
    return Categoria.findOrFail(id)
  }

  async store(payload: {
    idCformacion: number
    nombre: string
    estado?: boolean
  }) {
    try {
      return await Categoria.create({
        idCformacion: payload.idCformacion,
        nombre: payload.nombre,
        estado: payload.estado ?? true,
      })
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo crear la categoría')
    }
  }

  async update(
    id: number,
    payload: {
      idCformacion?: number
      nombre?: string
      estado?: boolean
    }
  ) {
    const categoria = await Categoria.findOrFail(id)

    categoria.merge({
      idCformacion: payload.idCformacion,
      nombre: payload.nombre,
      estado: payload.estado,
    })

    try {
      await categoria.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo actualizar la categoría')
    }

    return categoria
  }
}