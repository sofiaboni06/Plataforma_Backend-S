import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import DetalleSolicitudPrograma from '#models/detalle_solicitud_programa'
import Ficha from '#models/ficha'
import ProgramaFormacion from '#models/programa_formacion'
import User from '#models/usuario'
import Vigencia from '#models/vigencia'

export type EstadoSolicitudPrograma =
  | 'borrador'
  | 'enviada'
  | 'aprobada'
  | 'parcial'
  | 'rechazada'
  | 'anulada'

export default class SolicitudMaterialPrograma extends BaseModel {
  static table = 'solicitud_material_programa'

  @column({ isPrimary: true, columnName: 'id_solicitud_programa' })
  declare id: number

  @column({ columnName: 'id_usuario_instructor' })
  declare instructorId: number

  @column({ columnName: 'id_programa_formacion' })
  declare programaId: number

  @column({ columnName: 'id_ficha' })
  declare fichaId: number

  @column()
  declare vigencia: number

  @column()
  declare estado: EstadoSolicitudPrograma

  @column()
  declare observacion: string | null

  @column({ columnName: 'id_usuario_aprobador' })
  declare aprobadorId: number | null

  @column({ columnName: 'observacion_decision' })
  declare observacionDecision: string | null

  @column.dateTime({ columnName: 'fecha_envio' })
  declare fechaEnvio: DateTime | null

  @column.dateTime({ columnName: 'fecha_decision' })
  declare fechaDecision: DateTime | null

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime

  @belongsTo(() => User, { foreignKey: 'instructorId' })
  declare instructor: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'aprobadorId' })
  declare aprobador: BelongsTo<typeof User>

  @belongsTo(() => ProgramaFormacion, { foreignKey: 'programaId' })
  declare programa: BelongsTo<typeof ProgramaFormacion>

  @belongsTo(() => Ficha, { foreignKey: 'fichaId' })
  declare ficha: BelongsTo<typeof Ficha>

  @belongsTo(() => Vigencia, { foreignKey: 'vigencia', localKey: 'anio' })
  declare vigenciaRow: BelongsTo<typeof Vigencia>

  @hasMany(() => DetalleSolicitudPrograma, { foreignKey: 'solicitudId' })
  declare detalles: HasMany<typeof DetalleSolicitudPrograma>
}
