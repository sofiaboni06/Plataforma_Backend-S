import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Prestamo from '#models/prestamo'

export default class Actividad extends BaseModel {
  static table = 'actividad'

  @column({ isPrimary: true, columnName: 'id_actividad' })
  declare id: number

  @column()
  declare nombre: string

  @column()
  declare lugar: string | null

  @column()
  declare estado: boolean

  @hasMany(() => Prestamo, { foreignKey: 'idActividad' })
  declare prestamos: HasMany<typeof Prestamo>
}
