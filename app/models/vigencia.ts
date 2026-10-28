import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class Vigencia extends BaseModel {
  static table = 'vigencia'

  @column({ isPrimary: true })
  declare anio: number

  @column()
  declare activa: boolean

  @column.date({ columnName: 'fecha_apertura' })
  declare fechaApertura: DateTime | null

  @column.date({ columnName: 'fecha_cierre' })
  declare fechaCierre: DateTime | null

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime
}
