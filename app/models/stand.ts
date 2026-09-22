import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Bodega from '#models/bodega'
import Elemento from '#models/elemento'

export default class Stand extends BaseModel {
  static table = 'stand'

  @column({ isPrimary: true, columnName: 'id_stand' })
  declare id: number

  @column({ columnName: 'id_bodega' })
  declare idBodega: number

  @column()
  declare nombre: string

  @column()
  declare estado: boolean

  @belongsTo(() => Bodega, { foreignKey: 'idBodega' })
  declare bodega: BelongsTo<typeof Bodega>

  @hasMany(() => Elemento, { foreignKey: 'idStand' })
  declare elementos: HasMany<typeof Elemento>
}
