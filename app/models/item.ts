import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Elemento from '#models/elemento'
import Subcategoria from '#models/subcategoria'

export default class Item extends BaseModel {
  static table = 'item'

  @column({ isPrimary: true, columnName: 'id_item' })
  declare id: number

  @column({ columnName: 'id_subcategoria' })
  declare idSubcategoria: number

  @column()
  declare nombre: string

  @column()
  declare descripcion: string | null

  @column()
  declare estado: boolean

  @belongsTo(() => Subcategoria, { foreignKey: 'idSubcategoria' })
  declare subcategoria: BelongsTo<typeof Subcategoria>

  @hasMany(() => Elemento, { foreignKey: 'idItem' })
  declare elementos: HasMany<typeof Elemento>
}
