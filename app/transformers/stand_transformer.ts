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
    const subBodega = this.resource.subBodega

    return {
      ...this.toSummary(),
      idSubBodega: this.resource.idSubBodega,
      subBodega: subBodega
        ? {
            id: subBodega.id,
            nombre: subBodega.nombre,
          }
        : null,
    }
  }
}