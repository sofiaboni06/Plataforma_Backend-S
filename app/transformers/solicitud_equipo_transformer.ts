import { BaseTransformer } from '@adonisjs/core/transformers'
import type SolicitudEquipo from '#models/solicitud_equipo'
import {
  cantidadesDe,
  devolucionJson,
  elementoJson,
  entregaJson,
  fechaIso,
  fechasDe,
  persona,
} from '#transformers/solicitud_transformer'

export default class SolicitudEquipoTransformer extends BaseTransformer<SolicitudEquipo> {
  constructor(
    solicitud: SolicitudEquipo,
    private conExistencias: boolean = true
  ) {
    super(solicitud)
  }

  toObject() {
    const obra = this.resource.obra

    return {
      id: this.resource.id,
      codigoSolicitud: this.resource.codigoSolicitud,
      idObra: this.resource.idObra,
      idElemento: this.resource.idElemento,
      idUsuario: this.resource.idUsuario,
      idUsuarioEntrega: this.resource.idUsuarioEntrega,
      ...cantidadesDe(this.resource, 'equipo'),
      ficha: this.resource.ficha,
      estado: this.resource.estado,
      estadoElemento: this.resource.estadoElemento,
      fecha: fechaIso(this.resource.fecha),
      fechaEntrega: fechaIso(this.resource.fechaEntrega),
      fechaDevolucion: fechaIso(this.resource.fechaDevolucion),
      ...fechasDe(this.resource, 'equipo'),
      observacion: this.resource.observacion,
      obra: obra
        ? {
            id: obra.id,
            nombre: obra.nombre,
            lugar: obra.lugar,
          }
        : null,
      elemento: elementoJson(this.resource.elemento, this.conExistencias),
      usuario: persona(this.resource.usuario),
      registradaEnBodega: this.resource.idUsuarioRegistra !== null,
      registradaPor: persona(this.resource.usuarioRegistra),
      usuarioEntrega: persona(this.resource.usuarioEntrega),
      entregas: (this.resource.entregas ?? []).map(entregaJson),
      devoluciones: (this.resource.devoluciones ?? []).map(devolucionJson),
    }
  }
}
