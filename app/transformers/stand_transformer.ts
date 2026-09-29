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
    const bodega = subBodega?.bodega

    return {
      ...this.toSummary(),
      idSubBodega: this.resource.idSubBodega,
      subBodega: subBodega
        ? {
            id: subBodega.id,
            nombre: subBodega.nombre,
            idBodega: subBodega.idBodega,
          }
        : null,
      bodega: bodega
        ? {
            id: bodega.id,
            nombre: bodega.nombre,
            idCformacion: bodega.idCformacion,
          }
        : null,
    }
  }
}
