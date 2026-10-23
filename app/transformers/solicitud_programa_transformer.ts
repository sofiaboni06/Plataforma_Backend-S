import { BaseTransformer } from '@adonisjs/core/transformers'
import type SolicitudMaterialPrograma from '#models/solicitud_material_programa'

export default class SolicitudProgramaTransformer extends BaseTransformer<SolicitudMaterialPrograma> {
  toObject() {
    const instructor = this.resource.instructor
    const programa = this.resource.programa
    const ficha = this.resource.ficha

    return {
      id: this.resource.id,
      programaId: this.resource.programaId,
      fichaId: this.resource.fichaId,
      vigencia: this.resource.vigencia,
      estado: this.resource.estado,
      observacion: this.resource.observacion,
      observacionDecision: this.resource.observacionDecision,
      fechaEnvio: this.resource.fechaEnvio?.toISO() ?? null,
      fechaDecision: this.resource.fechaDecision?.toISO() ?? null,
      instructor: instructor
        ? {
            id: instructor.id,
            nombres: instructor.nombres,
            apellidos: instructor.apellidos,
          }
        : null,
      programa: programa
        ? {
            id: programa.id,
            codigo: programa.codigo,
            nombre: programa.nombre,
            redConocimiento: programa.redConocimiento
              ? { id: programa.redConocimiento.id, nombre: programa.redConocimiento.nombre }
              : null,
            lineaTematica: programa.lineaTematica
              ? { id: programa.lineaTematica.id, nombre: programa.lineaTematica.nombre }
              : null,
          }
        : null,
      ficha: ficha ? { id: ficha.id, numeroFicha: ficha.numeroFicha } : null,
      items: (this.resource.detalles ?? []).map((detalle) => ({
        id: detalle.id,
        listaMaestraId: detalle.listaMaestraId,
        cantidadSolicitada: detalle.cantidadSolicitada,
        cantidadAprobada: detalle.cantidadAprobada,
        cantidadMaestraReferencia: detalle.cantidadMaestraReferencia,
        estado: detalle.estado,
        observacionCoordinador: detalle.observacionCoordinador,
        material: detalle.listaMaestra
          ? {
              id: detalle.listaMaestra.id,
              codigoUnspsc: detalle.listaMaestra.codigoUnspsc,
              producto: detalle.listaMaestra.producto,
              unidadMedida: detalle.listaMaestra.unidadMedida,
              cantidadBase: detalle.listaMaestra.cantidadBase,
              caracter: detalle.listaMaestra.caracter,
            }
          : null,
      })),
    }
  }
}
