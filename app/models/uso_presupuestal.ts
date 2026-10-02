import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Elemento from '#models/elemento'

export default class UsoPresupuestal extends BaseModel {
  static table = 'uso_presupuestal'

  @column({ isPrimary: true, columnName: 'id_uso_presupuestal' })
  declare id: number

  @column()
  declare nombre: string

  @column()
  declare estado: boolean

  @hasMany(() => Elemento, { foreignKey: 'idUsoPresupuestal' })
  declare elementos: HasMany<typeof Elemento>
}
