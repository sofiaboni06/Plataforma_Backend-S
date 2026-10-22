import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class Vigencia extends BaseModel {
  static table = 'vigencia'

  @column({ isPrimary: true, columnName: 'anio' })
  declare anio: number

  @column()
  declare activa: boolean

  @column.date()
  declare fecha_apertura: DateTime

  @column.date()
  declare fecha_cierre: DateTime
}