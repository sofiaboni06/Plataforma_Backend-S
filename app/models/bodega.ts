import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import SubBodega from '#models/sub_bodega'
import TrainingCenter from '#models/training_center'
import SubBodega from '#models/sub_bodega'

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

  @hasMany(() => SubBodega, { foreignKey: 'idBodega' })
  declare subBodegas: HasMany<typeof SubBodega>
}
}
