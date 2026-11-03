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
      presupuestoFicha: this.resource.$extras.presupuestoFicha ?? null,
      valorAproximado: this.valorAproximado(),
      valorPromedio: this.valorPromedio(),
      items: (this.resource.detalles ?? []).map((detalle) => ({
        id: detalle.id,
        listaMaestraId: detalle.listaMaestraId,
        cantidadSolicitada: detalle.cantidadSolicitada,
        cantidadAprobada: detalle.cantidadAprobada,
        cantidadMaestraReferencia: detalle.cantidadMaestraReferencia,
        estado: detalle.estado,
        observacionCoordinador: detalle.observacionCoordinador,
        valorAproximado:
          Number(detalle.cantidadSolicitada) * Number(detalle.listaMaestra?.valorUnitario ?? 0),
        material: detalle.listaMaestra
          ? {
              id: detalle.listaMaestra.id,
              codigoUnspsc: detalle.listaMaestra.codigoUnspsc,
              producto: detalle.listaMaestra.producto,
              unidadMedida: detalle.listaMaestra.unidadMedida,
              cantidadBase: detalle.listaMaestra.cantidadBase,
              caracter: detalle.listaMaestra.caracter,
              valorUnitario: detalle.listaMaestra.valorUnitario,
              lote: detalle.listaMaestra.lote
                ? { id: detalle.listaMaestra.lote.id, nombre: detalle.listaMaestra.lote.nombre }
                : null,
            }
          : null,
      })),
    }
  }

  private lineasConsumo() {
    return (this.resource.detalles ?? []).filter(
      (detalle) => detalle.listaMaestra?.caracter === 'consumo'
    )
  }

  private valorAproximado() {
    return this.lineasConsumo().reduce(
      (suma, detalle) =>
        suma + Number(detalle.cantidadSolicitada) * Number(detalle.listaMaestra?.valorUnitario ?? 0),
      0
    )
  }

  private valorPromedio() {
    const lineas = this.lineasConsumo().filter(
      (detalle) => detalle.listaMaestra?.valorUnitario !== null && detalle.listaMaestra?.valorUnitario !== undefined
    )
    if (!lineas.length) return 0
    const suma = lineas.reduce(
      (total, detalle) => total + Number(detalle.listaMaestra?.valorUnitario ?? 0),
      0
    )
    return suma / lineas.length
  }
}
