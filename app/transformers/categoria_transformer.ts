import { BaseTransformer } from '@adonisjs/core/transformers'
import Categoria from '#models/categoria'

export default class CategoriaTransformer extends BaseTransformer<Categoria> {
  toObject() {
    return {
      id: this.resource.id,
      idCformacion: this.resource.idCformacion,
      nombre: this.resource.nombre,
      estado: this.resource.estado,
    }
  }
}