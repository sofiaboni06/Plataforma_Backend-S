import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Item from '#models/item'
import Stand from '#models/stand'
import Subcategoria from '#models/subcategoria'
import UnidadMedida from '#models/unidad_medida'

export default class Elemento extends BaseModel {
  static table = 'elemento'

  @column({ isPrimary: true, columnName: 'id_elemento' })
  declare id: number

  @column({ columnName: 'id_subcategoria' })
  declare idSubcategoria: number

  @column({ columnName: 'id_stand' })
  declare idStand: number

  @column()
  declare nombre: string

  @column()
  declare cantidad: number

  @column()
  declare estado: boolean

  @column({ columnName: 'id_unidad_medida' })
  declare idUnidadMedida: number

  @column()
  declare codigo: string | null

  @column({ columnName: 'descripcion_tecnica' })
  declare descripcionTecnica: string | null

  @column()
  declare marca: string | null

  @column({ columnName: 'url_fotografia' })
  declare urlFotografia: string | null

  @belongsTo(() => Subcategoria, { foreignKey: 'idSubcategoria' })
  declare subcategoria: BelongsTo<typeof Subcategoria>

  @belongsTo(() => Stand, { foreignKey: 'idStand' })
  declare stand: BelongsTo<typeof Stand>

  @belongsTo(() => UnidadMedida, { foreignKey: 'idUnidadMedida' })
  declare unidadMedida: BelongsTo<typeof UnidadMedida>

  @hasMany(() => Item, { foreignKey: 'idElemento' })
  declare items: HasMany<typeof Item>
}
