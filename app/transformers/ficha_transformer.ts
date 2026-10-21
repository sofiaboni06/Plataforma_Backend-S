import { BaseTransformer } from '@adonisjs/core/transformers'
import type Ficha from '#models/ficha'

export default class FichaTransformer extends BaseTransformer<Ficha> {
  toObject() {
    const programa = this.resource.programa
    const jornada = this.resource.jornada
    const centro = this.resource.centroFormacion

    return {
      id: this.resource.id,
      programaId: this.resource.programaId,
      jornadaId: this.resource.jornadaId,
      centroFormacionId: this.resource.centroFormacionId,
      numeroFicha: this.resource.numeroFicha,
      fechaInicio: this.resource.fechaInicio?.toISODate() ?? null,
      fechaFin: this.resource.fechaFin?.toISODate() ?? null,
      cupoAprendices: this.resource.cupoAprendices,
      estado: this.resource.estado,
      programa: programa
        ? {
            id: programa.id,
            codigo: programa.codigo,
            nombre: programa.nombre,
            version: programa.version,
            nivel: programa.nivel ? { id: programa.nivel.id, nombre: programa.nivel.nombre } : null,
          }
        : null,
      jornada: jornada ? { id: jornada.id, nombre: jornada.nombre } : null,
      centroFormacion: centro
        ? {
            id: centro.id,
            nombre: centro.nombre,
            regional: centro.regional?.nombre ?? null,
          }
        : null,
    }
  }
}
