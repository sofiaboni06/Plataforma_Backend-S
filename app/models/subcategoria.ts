import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Categoria from '#models/categoria'
import Elemento from '#models/elemento'
import Item from '#models/item'

export default class Subcategoria extends BaseModel {
  static table = 'subcategoria'

  @column({ isPrimary: true, columnName: 'id_subcategoria' })
  declare id: number

  @column({ columnName: 'id_categoria' })
  declare idCategoria: number

  @column()
  declare nombre: string

  @column()
  declare estado: boolean

  @belongsTo(() => Categoria, { foreignKey: 'idCategoria' })
  declare categoria: BelongsTo<typeof Categoria>

  @hasMany(() => Elemento, { foreignKey: 'idSubcategoria' })
  declare elementos: HasMany<typeof Elemento>

  @hasMany(() => Item, { foreignKey: 'idSubcategoria' })
  declare items: HasMany<typeof Item>
}