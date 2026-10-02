import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Elemento from '#models/elemento'

export default class UnidadMedida extends BaseModel {
  static table = 'unidad_medida'

  @column({ isPrimary: true, columnName: 'id_unidad_medida' })
  declare id: number

  @column()
  declare nombre: string

  @column()
  declare abreviatura: string

  @column()
  declare estado: boolean

  @hasMany(() => Elemento, { foreignKey: 'idUnidadMedida' })
  declare elementos: HasMany<typeof Elemento>
}
