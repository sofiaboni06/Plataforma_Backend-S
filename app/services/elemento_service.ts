import Elemento from '#models/elemento'
import type User from '#models/usuario'
import { rethrowDatabaseError } from '#services/database_error'

type ElementoPayload = {
  idSubcategoria: number
  idStand: number
  nombre: string
  cantidad: number
  estado: boolean
  idUnidadMedida: number
  codigo: string
  descripcion?: string | null
  marca?: string | null
  urlFotografia?: string | null
}

type UpdateElementoPayload = Partial<ElementoPayload>

export default class ElementoService {
  async listForUser(_user: User) {
    return this.query().orderBy('id_elemento', 'asc')
  }

  async create(_user: User, payload: ElementoPayload) {
    try {
      const elemento = await Elemento.create({
        idSubcategoria: payload.idSubcategoria,
        idStand: payload.idStand,
        nombre: payload.nombre,
        cantidad: payload.cantidad,
        estado: payload.estado,
        idUnidadMedida: payload.idUnidadMedida,
        codigo: payload.codigo,
        descripcionTecnica: payload.descripcion ?? null,
        marca: payload.marca ?? null,
        urlFotografia: payload.urlFotografia ?? null,
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
      ...(payload.idSubcategoria !== undefined && { idSubcategoria: payload.idSubcategoria }),
      ...(payload.idStand !== undefined && { idStand: payload.idStand }),
      ...(payload.nombre !== undefined && { nombre: payload.nombre }),
      ...(payload.cantidad !== undefined && { cantidad: payload.cantidad }),
      ...(payload.estado !== undefined && { estado: payload.estado }),
      ...(payload.idUnidadMedida !== undefined && { idUnidadMedida: payload.idUnidadMedida }),
      ...(payload.codigo !== undefined && { codigo: payload.codigo }),
      ...(payload.descripcion !== undefined && { descripcionTecnica: payload.descripcion }),
      ...(payload.marca !== undefined && { marca: payload.marca }),
      ...(payload.urlFotografia !== undefined && { urlFotografia: payload.urlFotografia }),
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
