import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import ProgramaFormacion from '#models/programa_formacion'
import VigenciaEspecial from '#models/vigencia_especial'

export default class VigenciaEspecialPrograma extends BaseModel {
  static table = 'vigencia_especial_programa'

  @column({ isPrimary: true, columnName: 'id_vigencia_especial_programa' })
  declare id: number

  @column({ columnName: 'id_vigencia_especial' })
  declare vigenciaEspecialId: number

  @column({ columnName: 'id_programa_formacion' })
  declare programaId: number

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @belongsTo(() => VigenciaEspecial, { foreignKey: 'vigenciaEspecialId' })
  declare vigenciaEspecial: BelongsTo<typeof VigenciaEspecial>

  @belongsTo(() => ProgramaFormacion, { foreignKey: 'programaId' })
  declare programa: BelongsTo<typeof ProgramaFormacion>
}
