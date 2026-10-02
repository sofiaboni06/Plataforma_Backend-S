import { BaseTransformer } from '@adonisjs/core/transformers'
import Actividad from '#models/actividad'

export default class ActividadTransformer extends BaseTransformer<Actividad> {
  toObject() {
    return {
      id: this.resource.id,
      nombre: this.resource.nombre,
      lugar: this.resource.lugar,
      estado: this.resource.estado,
    }
  }
}