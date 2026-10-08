import { BaseTransformer } from '@adonisjs/core/transformers'
import type { DateTime } from 'luxon'
import type Devolucion from '#models/devolucion'
import type Elemento from '#models/elemento'
import type Entrega from '#models/entrega'
import type SolicitudEquipo from '#models/solicitud_equipo'
import type SolicitudMaterial from '#models/solicitud_material'
import type User from '#models/usuario'
import type { Factura } from '#services/solicitud_service'

export function fechaIso(value: DateTime | null) {
  return value?.toISO() ?? null
}

export function persona(usuario: User | null | undefined) {
  return usuario
    ? {
        id: usuario.id,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        email: usuario.email,
      }
    : null
}

export function entregaJson(row: Entrega) {
  return {
    id: row.id,
    cantidad: row.cantidad,
    fecha: fechaIso(row.fecha),
    observacion: row.observacion,
    entregadoPor: persona(row.usuario),
  }
}

export function devolucionJson(row: Devolucion) {
  return {
    id: row.id,
    cantidad: row.cantidad,
    estadoElemento: row.estadoElemento,
    fecha: fechaIso(row.fecha),
    observacion: row.observacion,
    recibidoPor: persona(row.usuario),
  }
}

/**
 * El elemento de una fila. La existencia en bodega solo la ve quien entrega:
 * al instructor no le toca saber lo que queda.
 */
export function elementoJson(elemento: Elemento | null | undefined, conExistencias: boolean) {
  return elemento
    ? {
        id: elemento.id,
        nombre: elemento.nombre,
        codigo: elemento.codigo,
        ...(conExistencias ? { cantidad: elemento.cantidad } : {}),
      }
    : null
}

/**
 * Cantidades de una fila: lo pedido, lo que ya salió, lo que falta por salir
 * y, si es equipo, lo que volvió y lo que sigue afuera.
 */
export function cantidadesDe(
  row: SolicitudMaterial | SolicitudEquipo,
  tipo: 'material' | 'equipo'
) {
  const devuelta = tipo === 'equipo' ? (row as SolicitudEquipo).cantidadDevuelta : 0

  return {
    cantidad: row.cantidad,
    cantidadEntregada: row.cantidadEntregada,
    cantidadPendiente: row.cantidad - row.cantidadEntregada,
    cantidadDevuelta: tipo === 'equipo' ? devuelta : null,
    cantidadAfuera: tipo === 'equipo' ? row.cantidadEntregada - devuelta : null,
  }
}

function fila(
  row: SolicitudMaterial | SolicitudEquipo,
  tipo: 'material' | 'equipo',
  conExistencias: boolean
) {
  const equipo = tipo === 'equipo' ? (row as SolicitudEquipo) : null

  return {
    id: row.id,
    tipo,
    idElemento: row.idElemento,
    elemento: elementoJson(row.elemento, conExistencias),
    ...cantidadesDe(row, tipo),
    estado: row.estado,
    estadoElemento: equipo?.estadoElemento ?? null,
    observacion: row.observacion,
    fechaEntrega: fechaIso(row.fechaEntrega),
    fechaDevolucion: equipo ? fechaIso(equipo.fechaDevolucion) : null,
    usuarioEntrega: persona(row.usuarioEntrega),
    entregas: (row.entregas ?? []).map(entregaJson),
    devoluciones: (equipo?.devoluciones ?? []).map(devolucionJson),
  }
}

/**
 * Encabezado de la factura más la grilla. `detalle[].tipo` le dice al front a
 * qué ruta mandar la entrega o la devolución de esa fila.
 */
export default class SolicitudTransformer extends BaseTransformer<Factura> {
  constructor(
    factura: Factura,
    private conExistencias: boolean = true
  ) {
    super(factura)
  }

  toObject() {
    const { materiales, equipos } = this.resource
    const primera = [...materiales, ...equipos].sort(
      (a, b) => a.fecha.toMillis() - b.fecha.toMillis()
    )[0]
    const detalle = [
      ...materiales.map((row) => fila(row, 'material', this.conExistencias)),
      ...equipos.map((row) => fila(row, 'equipo', this.conExistencias)),
    ]
    const obra = primera.obra
    const suma = (valor: (row: (typeof detalle)[number]) => number | null) =>
      detalle.reduce((total, row) => total + (valor(row) ?? 0), 0)

    return {
      codigoSolicitud: this.resource.codigoSolicitud,
      tipo: materiales.length ? 'consumo' : 'devolutivo',
      estado: this.resource.estado,
      fecha: fechaIso(primera.fecha),
      ficha: primera.ficha,
      idObra: primera.idObra,
      obra: obra
        ? {
            id: obra.id,
            nombre: obra.nombre,
            lugar: obra.lugar,
          }
        : null,
      idUsuario: primera.idUsuario,
      usuario: persona(primera.usuario),
      registradaEnBodega: primera.idUsuarioRegistra !== null,
      registradaPor: persona(primera.usuarioRegistra),
      totales: {
        lineas: detalle.length,
        pendientes: detalle.filter((row) => row.estado === 'pendiente').length,
        parciales: detalle.filter((row) => row.estado === 'parcial').length,
        entregadas: detalle.filter((row) => row.estado === 'entregado').length,
        devueltas: detalle.filter((row) => row.estado === 'devuelto').length,
        cantidad: suma((row) => row.cantidad),
        cantidadEntregada: suma((row) => row.cantidadEntregada),
        cantidadPendiente: suma((row) => row.cantidadPendiente),
        cantidadAfuera: suma((row) => row.cantidadAfuera),
      },
      detalle,
    }
  }
}
