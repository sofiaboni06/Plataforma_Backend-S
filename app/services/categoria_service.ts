import Categoria from '#models/categoria'

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
    return Categoria.create({
      idCformacion: payload.idCformacion,
      nombre: payload.nombre,
      estado: payload.estado ?? true,
    })
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

    await categoria.save()

    return categoria
  }
}