import Elemento from '#models/elemento'
import type User from '#models/usuario'
import { rethrowDatabaseError } from '#services/database_error'

type ElementoPayload = {
  id_subcategoria: number
  id_stand: number
  nombre: string
  cantidad: number
  estado: boolean
  id_unidad_medida: number
  codigo: string
  descripcion?: string | null
  marca?: string | null
  url_fotografia?: string | null
}

type UpdateElementoPayload = Partial<ElementoPayload>

export default class ElementoService {
  async listForUser(_user: User) {
    return this.query().orderBy('id_elemento', 'asc')
  }

  async create(_user: User, payload: ElementoPayload) {
    try {
      const elemento = await Elemento.create({
        idSubcategoria: payload.id_subcategoria,
        idStand: payload.id_stand,
        nombre: payload.nombre,
        cantidad: payload.cantidad,
        estado: payload.estado,
        idUnidadMedida: payload.id_unidad_medida,
        codigo: payload.codigo,
        descripcionTecnica: payload.descripcion ?? null,
        marca: payload.marca ?? null,
        urlFotografia: payload.url_fotografia ?? null,
      })

      return this.findById(_user, elemento.id)
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo crear el elemento')
    }
  }

  async findById(_user: User, id: number) {
    return this.query().where('id_elemento', id).firstOrFail()
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
      ...(payload.descripcion !== undefined && { descripcionTecnica: payload.descripcion }),
      ...(payload.marca !== undefined && { marca: payload.marca }),
      ...(payload.url_fotografia !== undefined && { urlFotografia: payload.url_fotografia }),
    })

    try {
      await elemento.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo actualizar el elemento')
    }

    return this.findById(_user, id)
  }

  private query() {
    return Elemento.query().preload('subcategoria').preload('stand').preload('unidadMedida')
  }
}
