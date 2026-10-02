import { BaseTransformer } from '@adonisjs/core/transformers'
import type Obra from '#models/obra'

export default class ObraTransformer extends BaseTransformer<Obra> {
  toObject() {
    return {
      id: this.resource.id,
      idCformacion: this.resource.idCformacion,
      nombre: this.resource.nombre,
      lugar: this.resource.lugar,
      estado: this.resource.estado,
    }
  }
}
