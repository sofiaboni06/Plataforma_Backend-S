import { BaseTransformer } from '@adonisjs/core/transformers'
import type NivelPrograma from '#models/nivel_programa'

export default class NivelProgramaTransformer extends BaseTransformer<NivelPrograma> {
  toObject() {
    return {
      id: this.resource.id,
      nombre: this.resource.nombre,
    }
  }
}
