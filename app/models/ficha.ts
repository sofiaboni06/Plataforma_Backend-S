import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Jornada from '#models/jornada'
import ProgramaFormacion from '#models/programa_formacion'
import TrainingCenter from '#models/training_center'

export default class Ficha extends BaseModel {
  static table = 'ficha'

  @column({ isPrimary: true, columnName: 'id_ficha' })
  declare id: number

  @column({ columnName: 'programa_id' })
  declare programaId: number

  @column({ columnName: 'jornada_id' })
  declare jornadaId: number | null

  @column({ columnName: 'centro_formacion_id' })
  declare centroFormacionId: number

  @column({ columnName: 'numero_ficha' })
  declare numeroFicha: string

  @column.date({ columnName: 'fecha_inicio' })
  declare fechaInicio: DateTime | null

  @column.date({ columnName: 'fecha_fin' })
  declare fechaFin: DateTime | null

  @column({ columnName: 'cupo_aprendices' })
  declare cupoAprendices: number

  @column()
  declare estado: boolean

  @belongsTo(() => ProgramaFormacion, { foreignKey: 'programaId' })
  declare programa: BelongsTo<typeof ProgramaFormacion>

  @belongsTo(() => Jornada, { foreignKey: 'jornadaId' })
  declare jornada: BelongsTo<typeof Jornada>

  @belongsTo(() => TrainingCenter, { foreignKey: 'centroFormacionId' })
  declare centroFormacion: BelongsTo<typeof TrainingCenter>
}
