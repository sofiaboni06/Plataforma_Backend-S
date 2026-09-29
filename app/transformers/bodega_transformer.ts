import { BaseTransformer } from '@adonisjs/core/transformers'
import type Bodega from '#models/bodega'
import SubBodegaTransformer from '#transformers/sub_bodega_transformer'

export default class BodegaTransformer extends BaseTransformer<Bodega> {
  toObject() {
    const center = this.resource.trainingCenter
    const subBodegas = this.resource.subBodegas ?? []

    return {
      id: this.resource.id,
      idCformacion: this.resource.idCformacion,
      nombre: this.resource.nombre,
      estado: this.resource.estado,
      ubicacion: center?.nombre ?? null,
      centroFormacion: center
        ? {
            id: center.id,
            nombre: center.nombre,
          }
        : null,
      subBodegas: SubBodegaTransformer.transform(subBodegas).useVariant('toSummary'),
      totalSubBodegas: subBodegas.length,
    }
  }
}
