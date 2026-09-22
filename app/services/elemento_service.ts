import Elemento from '#models/elemento'
import type User from '#models/usuario'

type ElementoPayload = {
  id_subcategoria: number
  id_stand: number
  nombre: string
  cantidad: number
  estado: boolean
  id_unidad_medida: number
  codigo: string
  descripcion: string
}

type UpdateElementoPayload = Partial<ElementoPayload>

export default class ElementoService {
  async listForUser(_user: User) {
    return Elemento.query().orderBy('id_elemento', 'asc')
  }

  async create(_user: User, payload: ElementoPayload) {
    return Elemento.create({
      idSubcategoria: payload.id_subcategoria,
      idStand: payload.id_stand,
      nombre: payload.nombre,
      cantidad: payload.cantidad,
      estado: payload.estado,
      idUnidadMedida: payload.id_unidad_medida,
      codigo: payload.codigo,
      descripcion: payload.descripcion,
    })
  }

  async findById(_user: User, id: number) {
    return Elemento.findOrFail(id)
  }

  async update(_user: User, id: number, payload: UpdateElementoPayload) {
    const elemento = await Elemento.findOrFail(id)

    elemento.merge({
      ...(payload.id_subcategoria !== undefined && { idSubcategoria: payload.id_subcategoria }),
      ...(payload.id_stand !== undefined && { idStand: payload.id_stand }),
      ...(payload.nombre !== undefined && { nombre: payload.nombre }),
      ...(payload.cantidad !== undefined && { cantidad: payload.cantidad }),
      ...(payload.estado !== undefined && { estado: payload.estado }),
      ...(payload.id_unidad_medida !== undefined && { idUnidadMedida: payload.id_unidad_medida }),
      ...(payload.codigo !== undefined && { codigo: payload.codigo }),
      ...(payload.descripcion !== undefined && { descripcion: payload.descripcion }),
    })

    await elemento.save()

    return elemento
  }
}
