import { BaseTransformer } from '@adonisjs/core/transformers'
import Subcategoria from '#models/subcategoria'

export default class SubcategoriaTransformer extends BaseTransformer<Subcategoria> {
  toObject() {
    return {
      id: this.resource.id,
      idCategoria: this.resource.idCategoria,
      nombre: this.resource.nombre,
      estado: this.resource.estado,
    }
  }
}