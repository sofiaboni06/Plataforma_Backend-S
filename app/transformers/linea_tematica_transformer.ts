import { BaseTransformer } from '@adonisjs/core/transformers'
import type LineaTematica from '#models/linea_tematica'

export default class LineaTematicaTransformer extends BaseTransformer<LineaTematica> {
  toObject() {
    const redes = this.resource.redesConocimiento ?? []

    return {
      id: this.resource.id,
      nombre: this.resource.nombre,
      descripcion: this.resource.descripcion,
      estado: this.resource.estado,
      redes: redes.map((red) => ({ id: red.id, nombre: red.nombre })),
    }
  }
}
