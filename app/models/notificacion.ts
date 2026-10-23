import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import User from '#models/usuario'

export type TipoNotificacion =
  | 'por_agotarse'
  | 'agotado'
  | 'solicitud_material'
  | 'solicitud_equipo'
  | 'entrega_material'
  | 'entrega_equipo'
  | 'devolucion_equipo'
  | 'solicitud_programa'
  | 'decision_solicitud_programa'

export type RecursoNotificacion =
  | 'alerta'
  | 'solicitud_material'
  | 'solicitud_equipo'
  | 'solicitud_programa'

export type LineaDetalleNotificacion = {
  producto: string
  cantidad?: number
  pedida?: number
  autorizada?: number
  queda?: number
  motivo?: string | null
}

export type DetalleNotificacion = {
  ficha?: string | null
  programa?: string | null
  observacion?: string | null
  entregados?: LineaDetalleNotificacion[]
  ajustados?: LineaDetalleNotificacion[]
  rechazados?: LineaDetalleNotificacion[]
  pendientes?: LineaDetalleNotificacion[]
}

export default class Notificacion extends BaseModel {
  static table = 'notificacion'

  @column({ isPrimary: true, columnName: 'id_notificacion' })
  declare id: number

  @column({ columnName: 'id_usuario' })
  declare idUsuario: number

  @column()
  declare tipo: TipoNotificacion

  @column()
  declare titulo: string

  @column()
  declare mensaje: string

  @column()
  declare leida: boolean

  @column()
  declare recurso: RecursoNotificacion | null

  @column({ columnName: 'id_referencia' })
  declare idReferencia: number | null

  @column({
    consume: (value) => {
      if (!value) return null
      if (typeof value === 'string') {
        try {
          return JSON.parse(value) as DetalleNotificacion
        } catch {
          return null
        }
      }
      return value as DetalleNotificacion
    },
  })
  declare detalle: DetalleNotificacion | null

  @column.dateTime()
  declare fecha: DateTime

  @belongsTo(() => User, { foreignKey: 'idUsuario' })
  declare usuario: BelongsTo<typeof User>
}
