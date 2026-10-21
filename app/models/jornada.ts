import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Ficha from '#models/ficha'

export default class Jornada extends BaseModel {
  static table = 'jornada'

  @column({ isPrimary: true, columnName: 'id_jornada' })
  declare id: number

  @column({ columnName: 'jornada' })
  declare nombre: string

  @hasMany(() => Ficha, { foreignKey: 'idJornada' })
  declare fichas: HasMany<typeof Ficha>
}
