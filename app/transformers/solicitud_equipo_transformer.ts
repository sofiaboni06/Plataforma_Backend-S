import { BaseTransformer } from '@adonisjs/core/transformers'
import type { DateTime } from 'luxon'
import type SolicitudEquipo from '#models/solicitud_equipo'

function fechaIso(value: DateTime | null) {
  return value?.toISO() ?? null
}

export default class SolicitudEquipoTransformer extends BaseTransformer<SolicitudEquipo> {
  toObject() {
    const elemento = this.resource.elemento
    const obra = this.resource.obra
    const usuario = this.resource.usuario
    const usuarioEntrega = this.resource.usuarioEntrega

    return {
      id: this.resource.id,
      codigoSolicitud: this.resource.codigoSolicitud,
      idObra: this.resource.idObra,
      idElemento: this.resource.idElemento,
      idUsuario: this.resource.idUsuario,
      idUsuarioEntrega: this.resource.idUsuarioEntrega,
      cantidad: this.resource.cantidad,
      ficha: this.resource.ficha,
      estado: this.resource.estado,
      estadoElemento: this.resource.estadoElemento,
      fecha: fechaIso(this.resource.fecha),
      fechaEntrega: fechaIso(this.resource.fechaEntrega),
      fechaDevolucion: fechaIso(this.resource.fechaDevolucion),
      observacion: this.resource.observacion,
      obra: obra
        ? {
            id: obra.id,
            nombre: obra.nombre,
            lugar: obra.lugar,
          }
        : null,
      elemento: elemento
        ? {
            id: elemento.id,
            nombre: elemento.nombre,
            codigo: elemento.codigo,
            cantidad: elemento.cantidad,
          }
        : null,
      usuario: usuario
        ? {
            id: usuario.id,
            nombres: usuario.nombres,
            apellidos: usuario.apellidos,
            email: usuario.email,
          }
        : null,
      usuarioEntrega: usuarioEntrega
        ? {
            id: usuarioEntrega.id,
            nombres: usuarioEntrega.nombres,
            apellidos: usuarioEntrega.apellidos,
            email: usuarioEntrega.email,
          }
        : null,
    }
  }
}
