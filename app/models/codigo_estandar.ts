import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Elemento from '#models/elemento'

export default class CodigoEstandar extends BaseModel {
  static table = 'codigo_estandar'

  @column({ isPrimary: true, columnName: 'id_codigo_estandar' })
  declare id: number

  @column({ columnName: 'id_cformacion' })
  declare idCformacion: number

  @column()
  declare codigo: string

  @column()
  declare nombre: string

  @hasMany(() => Elemento, { foreignKey: 'idCodigoEstandar' })
  declare elementos: HasMany<typeof Elemento>
}
