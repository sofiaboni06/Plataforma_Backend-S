import { BaseTransformer } from '@adonisjs/core/transformers'
import type Stand from '#models/stand'

export default class StandTransformer extends BaseTransformer<Stand> {
  toSummary() {
    return {
      id: this.resource.id,
      nombre: this.resource.nombre,
      estado: this.resource.estado,
    }
  }

  toObject() {
    const bodega = this.resource.bodega

    return {
      ...this.toSummary(),
      idBodega: this.resource.idBodega,
      bodega: bodega
        ? {
            id: bodega.id,
            nombre: bodega.nombre,
          }
        : null,
    }
  }
}
