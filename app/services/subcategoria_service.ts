import Subcategoria from '#models/subcategoria'

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
    return Subcategoria.create({
      idCategoria: payload.idCategoria,
      nombre: payload.nombre,
      estado: payload.estado ?? true,
    })
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

    await subcategoria.save()

    return subcategoria
  }
}