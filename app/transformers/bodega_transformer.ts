import { BaseTransformer } from '@adonisjs/core/transformers'
import type Bodega from '#models/bodega'
import StandTransformer from '#transformers/stand_transformer'

export default class BodegaTransformer extends BaseTransformer<Bodega> {
  toObject() {
    const center = this.resource.trainingCenter
    const stands = this.resource.stands ?? []

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
      stands: StandTransformer.transform(stands).useVariant('toSummary'),
      totalStands: stands.length,
    }
  }
}
