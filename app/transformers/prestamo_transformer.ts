import { BaseTransformer } from '@adonisjs/core/transformers'
import Prestamo from '#models/prestamo'

export default class PrestamoTransformer extends BaseTransformer<Prestamo> {
  toObject() {
    const elemento = this.resource.elemento
    const usuario = this.resource.usuario
    const actividad = this.resource.actividad

    return {
      id: this.resource.id,
      idElemento: this.resource.idElemento,
      idUsuario: this.resource.idUsuario,
      idActividad: this.resource.idActividad,

      cantidad: this.resource.cantidad,
      ficha: this.resource.ficha,
      fecha: this.resource.fecha,
      estado: this.resource.estado,
      observacion: this.resource.observacion,

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
            fullName: usuario.fullName,
            numeroDocumento: usuario.numeroDocumento,
            email: usuario.email,
          }
        : null,

      actividad: actividad
        ? {
            id: actividad.id,
            nombre: actividad.nombre,
            lugar: actividad.lugar,
            estado: actividad.estado,
          }
        : null,
    }
  }
}