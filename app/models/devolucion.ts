import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import SolicitudEquipo, { type EstadoElementoEquipo } from '#models/solicitud_equipo'
import User from '#models/usuario'

export default class Devolucion extends BaseModel {
  static table = 'devolucion'

  @column({ isPrimary: true, columnName: 'id_devolucion' })
  declare id: number

  @column({ columnName: 'id_solicitud_equipo' })
  declare idSolicitudEquipo: number

  /** Quien recibió en bodega. */
  @column({ columnName: 'id_usuario' })
  declare idUsuario: number

  @column()
  declare cantidad: number

  @column({ columnName: 'estado_elemento' })
  declare estadoElemento: EstadoElementoEquipo

  @column.dateTime()
  declare fecha: DateTime

  @column()
  declare observacion: string | null

  @belongsTo(() => SolicitudEquipo, { foreignKey: 'idSolicitudEquipo' })
  declare solicitudEquipo: BelongsTo<typeof SolicitudEquipo>

  @belongsTo(() => User, { foreignKey: 'idUsuario' })
  declare usuario: BelongsTo<typeof User>
}
