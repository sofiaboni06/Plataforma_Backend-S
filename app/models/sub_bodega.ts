import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Bodega from '#models/bodega'
import Stand from '#models/stand'

export default class SubBodega extends BaseModel {
  static table = 'sub_bodega'

  @column({ isPrimary: true, columnName: 'id_sub_bodega' })
  declare id: number

  @column({ columnName: 'id_bodega' })
  declare idBodega: number

  @column()
  declare nombre: string

  @column()
  declare estado: boolean

  @belongsTo(() => Bodega, { foreignKey: 'idBodega' })
  declare bodega: BelongsTo<typeof Bodega>

  @hasMany(() => Stand, { foreignKey: 'idSubBodega' })
  declare stands: HasMany<typeof Stand>
}