import { BaseTransformer } from '@adonisjs/core/transformers'
import type ProgramaFormacion from '#models/programa_formacion'

export default class ProgramaFormacionTransformer extends BaseTransformer<ProgramaFormacion> {
  toObject() {
    const centros = new Map<number, { id: number; nombre: string }>()

    for (const ficha of this.resource.fichas ?? []) {
      const centro = ficha.centroFormacion
      if (centro) {
        centros.set(centro.id, { id: centro.id, nombre: centro.nombre })
      }
    }

    return {
      id: this.resource.id,
      idRedConocimiento: this.resource.idRedConocimiento,
      idLineaTematica: this.resource.idLineaTematica,
      idNivelPrograma: this.resource.idNivelPrograma,
      codigo: this.resource.codigo,
      nombre: this.resource.nombre,
      version: this.resource.version,
      duracionTotalHoras: this.resource.duracionTotalHoras,
      cupoBaseAprendices: this.resource.cupoBaseAprendices,
      estado: this.resource.estado,
      nivel: this.resource.nivel
        ? {
            id: this.resource.nivel.id,
            nombre: this.resource.nivel.nombre,
          }
        : null,
      redConocimiento: this.resource.redConocimiento
        ? {
            id: this.resource.redConocimiento.id,
            nombre: this.resource.redConocimiento.nombre,
          }
        : null,
      lineaTematica: this.resource.lineaTematica
        ? {
            id: this.resource.lineaTematica.id,
            nombre: this.resource.lineaTematica.nombre,
          }
        : null,
      centros: [...centros.values()].sort((a, b) => a.nombre.localeCompare(b.nombre)),
    }
  }
}
