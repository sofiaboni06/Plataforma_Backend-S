import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { can, type AccessScope } from '#services/access_control'

/** Fila de material o equipo que todavía espera unidades de un elemento. */
export type SolicitudPendiente = {
  tipo: 'material' | 'equipo'
  id: number
  codigoSolicitud: string
  solicitante: string
  estado: 'pendiente' | 'parcial'
  cantidad: number
  cantidadEntregada: number
  pendiente: number
}

/**
 * De las pendientes, solo las que quien hizo el cambio puede entregar: la
 * respuesta no le muestra solicitudes de otro tipo que no le corresponden.
 */
export function pendientesQuePuedeEntregar(scope: AccessScope, filas: SolicitudPendiente[]) {
  return filas.filter((row) =>
    can(
      scope,
      row.tipo === 'material' ? 'solicitud_material.entregar' : 'solicitud_equipo.entregar'
    )
  )
}

const TABLAS_SOLICITUD = [
  { tipo: 'material', tabla: 'solicitud_material', llave: 'id_solicitud_material' },
  { tipo: 'equipo', tabla: 'solicitud_equipo', llave: 'id_solicitud_equipo' },
] as const

/**
 * Stock still on the shelf, minus what other solicitudes still wait to
 * receive. A solicitud may ask for more than there is: bodega delivers what is
 * on the shelf and the rest stays pending, so `disponible` never goes below 0.
 */
export default class DisponibilidadService {
  async comprometido(ids: number[], client?: TransactionClientContract) {
    const totals = new Map<number, number>()

    if (!ids.length) {
      return totals
    }

    await this.sumar(totals, 'solicitud_material', ids, client)
    await this.sumar(totals, 'solicitud_equipo', ids, client)

    return totals
  }

  /**
   * Las solicitudes de ese elemento a las que les falta algo por entregar,
   * de la más antigua a la más nueva. Son las que una entrada de stock puede
   * servir.
   */
  async pendientesDe(idElemento: number, client?: TransactionClientContract) {
    const filas: { fecha: number; fila: SolicitudPendiente }[] = []

    for (const { tipo, tabla, llave } of TABLAS_SOLICITUD) {
      const query = db
        .from(`${tabla} as s`)
        .join('usuario as u', 'u.id_usuario', 's.id_usuario')
        .where('s.id_elemento', idElemento)
        .whereIn('s.estado', ['pendiente', 'parcial'])
        .whereRaw('s.cantidad > s.cantidad_entregada')
        .select(
          `s.${llave} as id`,
          's.codigo_solicitud as codigo_solicitud',
          's.estado as estado',
          's.cantidad as cantidad',
          's.cantidad_entregada as cantidad_entregada',
          's.fecha as fecha',
          'u.nombres as nombres',
          'u.apellidos as apellidos'
        )

      if (client) {
        query.useTransaction(client)
      }

      for (const row of await query) {
        const cantidad = Number(row.cantidad)
        const cantidadEntregada = Number(row.cantidad_entregada)

        filas.push({
          fecha: new Date(row.fecha).getTime(),
          fila: {
            tipo,
            id: Number(row.id),
            codigoSolicitud: String(row.codigo_solicitud),
            solicitante: `${row.nombres ?? ''} ${row.apellidos ?? ''}`.trim(),
            estado: row.estado,
            cantidad,
            cantidadEntregada,
            pendiente: cantidad - cantidadEntregada,
          },
        })
      }
    }

    return filas.sort((a, b) => a.fecha - b.fecha).map((row) => row.fila)
  }

  async ubicacion(idElemento: number, client?: TransactionClientContract) {
    const lugares = await this.ubicaciones([idElemento], client)
    return lugares.get(idElemento) ?? null
  }

  async ubicaciones(ids: number[], client?: TransactionClientContract) {
    const lugares = new Map<number, { idStand: number; idCformacion: number }>()

    if (!ids.length) {
      return lugares
    }

    const query = db
      .from('elemento')
      .join('stand', 'stand.id_stand', 'elemento.id_stand')
      .join('sub_bodega', 'sub_bodega.id_sub_bodega', 'stand.id_sub_bodega')
      .join('bodega', 'bodega.id_bodega', 'sub_bodega.id_bodega')
      .whereIn('elemento.id_elemento', ids)
      .select(
        'elemento.id_elemento as id_elemento',
        'elemento.id_stand as id_stand',
        'bodega.id_cformacion as id_cformacion'
      )

    if (client) {
      query.useTransaction(client)
    }

    for (const row of await query) {
      lugares.set(Number(row.id_elemento), {
        idStand: Number(row.id_stand),
        idCformacion: Number(row.id_cformacion),
      })
    }

    return lugares
  }

  private async sumar(
    totals: Map<number, number>,
    table: 'solicitud_material' | 'solicitud_equipo',
    ids: number[],
    client?: TransactionClientContract
  ) {
    const query = db
      .from(table)
      .whereIn('id_elemento', ids)
      .whereIn('estado', ['pendiente', 'parcial'])
      .groupBy('id_elemento')
      .select('id_elemento')
      .select(db.raw('COALESCE(SUM(cantidad - cantidad_entregada), 0) AS total'))

    if (client) {
      query.useTransaction(client)
    }

    const rows = await query

    for (const row of rows) {
      const id = Number(row.id_elemento)
      totals.set(id, (totals.get(id) ?? 0) + Number(row.total ?? 0))
    }
  }
}
