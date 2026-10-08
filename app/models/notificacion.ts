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

export type RecursoNotificacion = 'alerta' | 'solicitud_material' | 'solicitud_equipo'

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

  @column.dateTime()
  declare fecha: DateTime

  @belongsTo(() => User, { foreignKey: 'idUsuario' })
  declare usuario: BelongsTo<typeof User>
}
