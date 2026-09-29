import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Elemento from '#models/elemento'
import SubBodega from '#models/sub_bodega'

export default class Stand extends BaseModel {
  static table = 'stand'

  @column({ isPrimary: true, columnName: 'id_stand' })
  declare id: number

  @column({ columnName: 'id_sub_bodega' })
  declare idSubBodega: number

  @column()
  declare nombre: string

  @column()
  declare estado: boolean

  @belongsTo(() => SubBodega, { foreignKey: 'idSubBodega' })
  declare subBodega: BelongsTo<typeof SubBodega>

  @hasMany(() => Elemento, { foreignKey: 'idStand' })
  declare elementos: HasMany<typeof Elemento>
}
