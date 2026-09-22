import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import TrainingCenter from '#models/training_center'
import Stand from '#models/stand'

export default class Bodega extends BaseModel {
  static table = 'bodega'

  @column({ isPrimary: true, columnName: 'id_bodega' })
  declare id: number

  @column({ columnName: 'id_cformacion' })
  declare idCformacion: number

  @column()
  declare nombre: string

  @column()
  declare estado: boolean

  @belongsTo(() => TrainingCenter, { foreignKey: 'idCformacion' })
  declare trainingCenter: BelongsTo<typeof TrainingCenter>

  @hasMany(() => Stand, { foreignKey: 'idBodega' })
  declare stands: HasMany<typeof Stand>
}
