import { BaseTransformer } from '@adonisjs/core/transformers'
import type Jornada from '#models/jornada'

export default class JornadaTransformer extends BaseTransformer<Jornada> {
  toObject() {
    return {
      id: this.resource.id,
      nombre: this.resource.nombre,
    }
  }
}
