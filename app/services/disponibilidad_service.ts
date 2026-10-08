import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

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
