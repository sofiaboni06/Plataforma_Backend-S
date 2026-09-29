import { BaseTransformer } from '@adonisjs/core/transformers'
import SubBodega from '#models/sub_bodega'

export default class SubBodegaTransformer extends BaseTransformer<SubBodega> {
  toObject() {
    return {
      id: this.resource.id,
      idBodega: this.resource.idBodega,
      nombre: this.resource.nombre,
      estado: this.resource.estado,
    }
  }
}