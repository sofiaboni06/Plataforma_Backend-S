import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Subcategoria from '#models/subcategoria'

export default class Categoria extends BaseModel {
  static table = 'categoria'

  @column({ isPrimary: true, columnName: 'id_categoria' })
  declare id: number

  @column({ columnName: 'id_cformacion' })
  declare idCformacion: number

  @column()
  declare nombre: string

  @column()
  declare estado: boolean

  @hasMany(() => Subcategoria, { foreignKey: 'idCategoria' })
  declare subcategorias: HasMany<typeof Subcategoria>
}