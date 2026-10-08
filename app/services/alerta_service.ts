import Alerta from '#models/alerta'
import type { TipoAlerta } from '#models/alerta'
import type Elemento from '#models/elemento'
import { forbidden, standIdsQuery, type AccessScope } from '#services/access_control'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { DateTime } from 'luxon'

export type EventoAlerta = 'abierta' | 'empeoro' | 'igual' | 'mejoro' | 'cerrada' | 'ninguna'

export type ResultadoAlerta = {
  evento: EventoAlerta
  alerta: Alerta | null
}

/**
 * Mantiene una sola alerta activa por elemento. El aviso a la bandeja lo
 * decide quien llama: crear el stock inicial no es un consumo.
 */
export default class AlertaService {
  async list(scope: AccessScope, options: { page: number; perPage: number; estado?: boolean }) {
    if (scope.isAdmin) {
      throw forbidden('Las alertas son del inventario de cada centro de formación')
    }

    const query = Alerta.query()
      .whereHas('elemento', (elemento) => {
        elemento.whereIn('id_stand', standIdsQuery(scope))
      })
      .preload('elemento')
      .orderBy('fecha', 'desc')

    if (options.estado !== undefined) {
      query.where('estado', options.estado)
    } else {
      query.where('estado', true)
    }

    return query.paginate(options.page, options.perPage)
  }

  async sincronizar(elemento: Elemento, trx: TransactionClientContract): Promise<ResultadoAlerta> {
    const cantidad = Number(elemento.cantidad)
    const minima = Number(elemento.cantidadMinima)
    const tipo: TipoAlerta | null =
      cantidad <= 0 ? 'agotado' : cantidad <= minima ? 'por_agotarse' : null

    const activa = await Alerta.query({ client: trx })
      .where('id_elemento', elemento.id)
      .where('estado', true)
      .first()

    if (!tipo) {
      if (!activa) {
        return { evento: 'ninguna', alerta: null }
      }

      activa.estado = false
      activa.cantidad = cantidad
      activa.cantidadMinima = minima
      await activa.useTransaction(trx).save()
      return { evento: 'cerrada', alerta: activa }
    }

    if (!activa) {
      const alerta = await Alerta.create(
        {
          idElemento: elemento.id,
          tipo,
          cantidad,
          cantidadMinima: minima,
          estado: true,
          fecha: DateTime.now(),
        },
        { client: trx }
      )

      return { evento: 'abierta', alerta }
    }

    const empeoro = activa.tipo === 'por_agotarse' && tipo === 'agotado'
    const mejoro = activa.tipo === 'agotado' && tipo === 'por_agotarse'
    activa.tipo = tipo
    activa.cantidad = cantidad
    activa.cantidadMinima = minima

    if (empeoro) {
      activa.fecha = DateTime.now()
    }

    await activa.useTransaction(trx).save()

    if (empeoro) {
      return { evento: 'empeoro', alerta: activa }
    }

    if (mejoro) {
      return { evento: 'mejoro', alerta: activa }
    }

    return { evento: 'igual', alerta: activa }
  }
}
