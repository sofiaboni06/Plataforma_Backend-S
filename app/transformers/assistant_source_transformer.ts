import { BaseTransformer } from '@adonisjs/core/transformers'
import type AssistantSource from '#models/assistant_source'

export default class AssistantSourceTransformer extends BaseTransformer<AssistantSource> {
  toObject() {
    return {
      id: this.resource.id,
      titulo: this.resource.titulo,
      modulo: this.resource.modulo,
      contenido: this.resource.contenido,
      estado: this.resource.estado,
    }
  }
}
