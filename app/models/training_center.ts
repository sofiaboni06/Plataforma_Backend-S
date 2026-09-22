import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Regional from '#models/regional'

export default class TrainingCenter extends BaseModel {
  static table = 'c_formacion'

  @column({ isPrimary: true, columnName: 'id_cformacion' })
  declare id: number

  @column({ columnName: 'id_regional' })
  declare idRegional: number

  @column()
  declare nombre: string

  @belongsTo(() => Regional, { foreignKey: 'idRegional' })
  declare regional: BelongsTo<typeof Regional>
}
