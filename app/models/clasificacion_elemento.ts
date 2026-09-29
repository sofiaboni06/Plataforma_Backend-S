import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Elemento from '#models/elemento'

export default class ClasificacionElemento extends BaseModel {
  static table = 'clasificacion_elemento'

  @column({ isPrimary: true, columnName: 'id_clasificacion_elemento' })
  declare id: number

  @column()
  declare nombre: string

  @column()
  declare estado: boolean

  @hasMany(() => Elemento, { foreignKey: 'idClasificacion' })
  declare elementos: HasMany<typeof Elemento>
}
