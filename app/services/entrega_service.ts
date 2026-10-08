import { Exception } from '@adonisjs/core/exceptions'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { DateTime } from 'luxon'
import Devolucion from '#models/devolucion'
import type Elemento from '#models/elemento'
import Entrega from '#models/entrega'
import type SolicitudEquipo from '#models/solicitud_equipo'
import type { EstadoElementoEquipo, EstadoSolicitudEquipo } from '#models/solicitud_equipo'
import type SolicitudMaterial from '#models/solicitud_material'
import type { EstadoSolicitudMaterial } from '#models/solicitud_material'
import type { AccessScope } from '#services/access_control'
import { rethrowDatabaseError } from '#services/database_error'

export type FilaEntrega =
  { tipo: 'material'; row: SolicitudMaterial } | { tipo: 'equipo'; row: SolicitudEquipo }

export type OpcionesEntrega = {
  /** Lo que bodega decide entregar. Sin valor, sale todo lo que falte. */
  cantidad?: number
  observacion?: string
  /** En el mostrador una fila sin existencia queda pendiente sin fallar. */
  exigirExistencia: boolean
}

export type LineaDevolucion = {
  estadoElemento: EstadoElementoEquipo
  cantidad: number
  observacion?: string
}

const GRAVEDAD: Record<EstadoElementoEquipo, number> = {
  bueno: 0,
  en_reparacion: 1,
  danado: 2,
  perdido: 3,
}

function fail(message: string, status: number, code: string): never {
  throw new Exception(message, { status, code })
}

export function estadoMaterial(row: SolicitudMaterial): EstadoSolicitudMaterial {
  if (row.cantidadEntregada <= 0) {
    return 'pendiente'
  }

  return row.cantidadEntregada < row.cantidad ? 'parcial' : 'entregado'
}

/**
 * `parcial` gana sobre la devolución: mientras falte algo por entregar, la
 * fila no está cerrada aunque lo que salió ya haya vuelto.
 */
export function estadoEquipo(row: SolicitudEquipo): EstadoSolicitudEquipo {
  if (row.cantidadEntregada <= 0) {
    return 'pendiente'
  }

  if (row.cantidadEntregada < row.cantidad) {
    return 'parcial'
  }

  return row.cantidadDevuelta < row.cantidadEntregada ? 'entregado' : 'devuelto'
}

function peorEstado(actual: EstadoElementoEquipo | null, nuevos: EstadoElementoEquipo[]) {
  return nuevos.reduce<EstadoElementoEquipo | null>(
    (peor, estado) => (peor === null || GRAVEDAD[estado] > GRAVEDAD[peor] ? estado : peor),
    actual
  )
}

/**
 * Movimientos de stock de una fila ya bloqueada por el llamador. Corre dentro
 * de la transacción ajena y no avisa a nadie: eso lo hace quien la llama.
 */
export default class EntregaService {
  /**
   * Sale lo que bodega indique o lo que falte, sin pasar de lo que hay en el
   * estante. Si no alcanza, la fila queda `parcial` con el resto pendiente.
   */
  async entregar(
    trx: TransactionClientContract,
    scope: AccessScope,
    fila: FilaEntrega,
    elemento: Elemento,
    opciones: OpcionesEntrega
  ) {
    const row = fila.row
    const faltante = row.cantidad - row.cantidadEntregada

    if (faltante <= 0) {
      fail('Esa solicitud ya se entregó completa', 422, 'E_ESTADO_INVALIDO')
    }

    if (opciones.cantidad !== undefined && opciones.cantidad > faltante) {
      fail(`Solo faltan ${faltante} por entregar`, 422, 'E_CANTIDAD_INVALIDA')
    }

    const enEstante = Math.max(0, Number(elemento.cantidad))
    const sale = Math.min(opciones.cantidad ?? faltante, faltante, enEstante)

    if (sale <= 0) {
      if (opciones.exigirExistencia) {
        fail(`${elemento.nombre}: no hay existencia para entregar`, 422, 'E_SIN_STOCK')
      }

      return { entregada: 0, pendiente: faltante }
    }

    try {
      elemento.cantidad = enEstante - sale
      await elemento.useTransaction(trx).save()

      row.cantidadEntregada += sale
      row.idUsuarioEntrega = scope.idUsuario
      row.fechaEntrega = DateTime.now()

      if (fila.tipo === 'material') {
        fila.row.estado = estadoMaterial(fila.row)
        await fila.row.useTransaction(trx).save()
      } else {
        fila.row.estado = estadoEquipo(fila.row)
        await fila.row.useTransaction(trx).save()
      }

      await Entrega.create(
        {
          idSolicitudMaterial: fila.tipo === 'material' ? row.id : null,
          idSolicitudEquipo: fila.tipo === 'equipo' ? row.id : null,
          idUsuario: scope.idUsuario,
          cantidad: sale,
          fecha: row.fechaEntrega,
          observacion: opciones.observacion?.trim() || null,
        },
        { client: trx }
      )
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo registrar la entrega')
    }

    return { entregada: sale, pendiente: faltante - sale }
  }

  /**
   * Lo que vuelve en buen estado regresa al estante. Dañado, perdido o en
   * reparación queda como novedad y no suma stock.
   */
  async devolver(
    trx: TransactionClientContract,
    scope: AccessScope,
    row: SolicitudEquipo,
    elemento: Elemento,
    lineas: LineaDevolucion[]
  ) {
    const afuera = row.cantidadEntregada - row.cantidadDevuelta

    if (afuera <= 0) {
      fail('Esa solicitud no tiene equipo afuera por devolver', 422, 'E_ESTADO_INVALIDO')
    }

    const total = lineas.reduce((suma, linea) => suma + linea.cantidad, 0)

    if (total > afuera) {
      fail(`Solo hay ${afuera} afuera por devolver`, 422, 'E_CANTIDAD_INVALIDA')
    }

    const buenas = lineas
      .filter((linea) => linea.estadoElemento === 'bueno')
      .reduce((suma, linea) => suma + linea.cantidad, 0)
    const fecha = DateTime.now()

    try {
      await Devolucion.createMany(
        lineas.map((linea) => ({
          idSolicitudEquipo: row.id,
          idUsuario: scope.idUsuario,
          cantidad: linea.cantidad,
          estadoElemento: linea.estadoElemento,
          fecha,
          observacion: linea.observacion?.trim() || null,
        })),
        { client: trx }
      )

      if (buenas > 0) {
        elemento.cantidad = Number(elemento.cantidad) + buenas
        await elemento.useTransaction(trx).save()
      }

      row.cantidadDevuelta += total
      row.estadoElemento = peorEstado(
        row.estadoElemento,
        lineas.map((linea) => linea.estadoElemento)
      )
      row.fechaDevolucion = fecha
      row.estado = estadoEquipo(row)
      await row.useTransaction(trx).save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo registrar la devolución')
    }

    return { devuelta: total, afuera: afuera - total }
  }
}
