import { BaseTransformer } from '@adonisjs/core/transformers'
import type ClasificacionElemento from '#models/clasificacion_elemento'

export default class ClasificacionElementoTransformer extends BaseTransformer<ClasificacionElemento> {
  toObject() {
    return {
      id: this.resource.id,
      idCformacion: this.resource.idCformacion,
      nombre: this.resource.nombre,
      estado: this.resource.estado,
    }
  }
}
