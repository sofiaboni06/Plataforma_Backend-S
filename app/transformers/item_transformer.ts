import type Item from '#models/item'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class ItemTransformer extends BaseTransformer<Item> {
  toObject() {
    const subcategoria = this.resource.subcategoria
    const categoria = subcategoria?.categoria

    return {
      id: this.resource.id,
      nombre: this.resource.nombre,
      descripcion: this.resource.descripcion,
      idSubcategoria: this.resource.idSubcategoria,
      estado: this.resource.estado,
      subcategoria: subcategoria
        ? {
            id: subcategoria.id,
            nombre: subcategoria.nombre,
            idCategoria: subcategoria.idCategoria,
            categoria: categoria ? { id: categoria.id, nombre: categoria.nombre } : null,
          }
        : null,
    }
  }
}
