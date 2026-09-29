import { BaseTransformer } from '@adonisjs/core/transformers'
import SubBodega from '#models/sub_bodega'

export default class SubBodegaTransformer extends BaseTransformer<SubBodega> {
  toObject() {
import type SubBodega from '#models/sub_bodega'
import StandTransformer from '#transformers/stand_transformer'

export default class SubBodegaTransformer extends BaseTransformer<SubBodega> {
  toSummary() {
    const stands = this.resource.stands ?? []

    return {
      id: this.resource.id,
      idBodega: this.resource.idBodega,
      nombre: this.resource.nombre,
      estado: this.resource.estado,
    }
  }
}
      stands: StandTransformer.transform(stands).useVariant('toSummary'),
      totalStands: stands.length,
    }
  }

  toObject() {
    const bodega = this.resource.bodega

    return {
      ...this.toSummary(),
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
