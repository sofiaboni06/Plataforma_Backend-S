import type Elemento from '#models/elemento'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class ElementoTransformer extends BaseTransformer<Elemento> {
  toObject() {
    return {
      id: this.resource.id,
      idSubcategoria: this.resource.idSubcategoria,
      idStand: this.resource.idStand,
      name: this.resource.nombre,
      quantity: this.resource.cantidad,
      estado: this.resource.estado,
      idUnidadMedida: this.resource.idUnidadMedida,
      codigo: this.resource.codigo,
      descripcion: this.resource.descripcion,
    }
  }
}