import { BaseTransformer } from '@adonisjs/core/transformers'
import type ProgramaFormacion from '#models/programa_formacion'

export default class ProgramaFormacionTransformer extends BaseTransformer<ProgramaFormacion> {
  toObject() {
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
      centros: (this.resource.centros ?? []).map((centro) => ({
        id: centro.id,
        nombre: centro.nombre,
      })),
    }
  }
}
