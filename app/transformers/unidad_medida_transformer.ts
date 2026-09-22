import { BaseTransformer } from '@adonisjs/core/transformers'
import type UnidadMedida from '#models/unidad_medida'

export default class UnidadMedidaTransformer extends BaseTransformer<UnidadMedida> {
  toObject() {
    return {
      id: this.resource.id,
      nombre: this.resource.nombre,
      abreviatura: this.resource.abreviatura,
      estado: this.resource.estado,
    }
  }
}
