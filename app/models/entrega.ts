import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import SolicitudEquipo from '#models/solicitud_equipo'
import SolicitudMaterial from '#models/solicitud_material'
import User from '#models/usuario'

export default class Entrega extends BaseModel {
  static table = 'entrega'

  @column({ isPrimary: true, columnName: 'id_entrega' })
  declare id: number

  @column({ columnName: 'id_solicitud_material' })
  declare idSolicitudMaterial: number | null

  @column({ columnName: 'id_solicitud_equipo' })
  declare idSolicitudEquipo: number | null

  /** Quien entregó en bodega. */
  @column({ columnName: 'id_usuario' })
  declare idUsuario: number

  @column()
  declare cantidad: number

  @column.dateTime()
  declare fecha: DateTime

  @column()
  declare observacion: string | null

  @belongsTo(() => SolicitudMaterial, { foreignKey: 'idSolicitudMaterial' })
  declare solicitudMaterial: BelongsTo<typeof SolicitudMaterial>

  @belongsTo(() => SolicitudEquipo, { foreignKey: 'idSolicitudEquipo' })
  declare solicitudEquipo: BelongsTo<typeof SolicitudEquipo>

  @belongsTo(() => User, { foreignKey: 'idUsuario' })
  declare usuario: BelongsTo<typeof User>
}
