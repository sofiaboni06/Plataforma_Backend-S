import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import SolicitudMaterialPrograma from '#models/solicitud_material_programa'
import User from '#models/usuario'

export default class SolicitudHistorial extends BaseModel {
  static table = 'solicitud_historial'

  @column({ isPrimary: true, columnName: 'id_historial' })
  declare id: number

  @column({ columnName: 'id_solicitud_programa' })
  declare solicitudId: number

  @column({ columnName: 'estado_anterior' })
  declare estadoAnterior: string | null

  @column({ columnName: 'estado_nuevo' })
  declare estadoNuevo: string

  @column({ columnName: 'id_usuario' })
  declare usuarioId: number | null

  @column()
  declare comentario: string | null

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @belongsTo(() => SolicitudMaterialPrograma, { foreignKey: 'solicitudId' })
  declare solicitud: BelongsTo<typeof SolicitudMaterialPrograma>

  @belongsTo(() => User, { foreignKey: 'usuarioId' })
  declare usuario: BelongsTo<typeof User>
}
