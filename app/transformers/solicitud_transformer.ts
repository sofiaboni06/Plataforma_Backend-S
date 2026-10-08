import { BaseTransformer } from '@adonisjs/core/transformers'
import type { DateTime } from 'luxon'
import type Devolucion from '#models/devolucion'
import type Elemento from '#models/elemento'
import type Entrega from '#models/entrega'
import type SolicitudEquipo from '#models/solicitud_equipo'
import type SolicitudMaterial from '#models/solicitud_material'
import type User from '#models/usuario'
import { estadoPlazo, hoy, type EstadoPlazo } from '#services/plazo'
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

const GRAVEDAD_PLAZO: Record<EstadoPlazo, number> = {
  sin_fecha: 0,
  al_dia: 1,
  vence_hoy: 2,
  vencido: 3,
}

/**
 * Fechas del pedido en una fila. Equipo: préstamo (inicio, devolución
 * propuesta, límite que confirmó bodega) y cómo va el plazo si hay algo
 * afuera. Consumo: inicio y para cuándo lo necesita.
 */
export function fechasDe(
  row: SolicitudMaterial | SolicitudEquipo,
  tipo: 'material' | 'equipo',
  dia: string = hoy()
) {
  if (tipo === 'equipo') {
    const equipo = row as SolicitudEquipo

    return {
      fechaInicio: equipo.fechaInicio ?? null,
      fechaDevolucionPropuesta: equipo.fechaDevolucionPropuesta ?? null,
      fechaDevolucionLimite: equipo.fechaDevolucionLimite ?? null,
      fechaEntregaRequerida: null,
      plazo: estadoPlazo(
        equipo.fechaDevolucionLimite ?? null,
        equipo.cantidadEntregada - equipo.cantidadDevuelta,
        dia
      ),
    }
  }

  const material = row as SolicitudMaterial

  return {
    fechaInicio: material.fechaInicio ?? null,
    fechaDevolucionPropuesta: null,
    fechaDevolucionLimite: null,
    fechaEntregaRequerida: material.fechaEntregaRequerida ?? null,
    plazo: null,
  }
}

function fila(
  row: SolicitudMaterial | SolicitudEquipo,
  tipo: 'material' | 'equipo',
  conExistencias: boolean,
  dia: string
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
    ...fechasDe(row, tipo, dia),
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
    const dia = hoy()
    const detalle = [
      ...materiales.map((row) => fila(row, 'material', this.conExistencias, dia)),
      ...equipos.map((row) => fila(row, 'equipo', this.conExistencias, dia)),
    ]
    // El plazo del pedido es el más apretado entre lo que sigue afuera.
    const conPlazo = detalle.filter((row) => row.plazo !== null)
    const peor = conPlazo.reduce<(typeof detalle)[number] | null>(
      (actual, row) =>
        actual === null ||
        GRAVEDAD_PLAZO[row.plazo!] > GRAVEDAD_PLAZO[actual.plazo!] ||
        (row.plazo === actual.plazo &&
          (row.fechaDevolucionLimite ?? '9999') < (actual.fechaDevolucionLimite ?? '9999'))
          ? row
          : actual,
      null
    )
    const referencia = detalle.find((row) => row.fechaInicio || row.fechaDevolucionPropuesta)
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
      fechaInicio: referencia?.fechaInicio ?? null,
      fechaDevolucionPropuesta: referencia?.fechaDevolucionPropuesta ?? null,
      fechaDevolucionLimite:
        peor?.fechaDevolucionLimite ??
        detalle.find((row) => row.fechaDevolucionLimite)?.fechaDevolucionLimite ??
        null,
      fechaEntregaRequerida:
        detalle.find((row) => row.fechaEntregaRequerida)?.fechaEntregaRequerida ?? null,
      plazo: peor?.plazo ?? null,
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
