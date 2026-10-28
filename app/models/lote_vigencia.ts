import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class LoteVigencia extends BaseModel {
  static table = 'lote_vigencia'

  @column({ isPrimary: true, columnName: 'id_lote' })
  declare id: number

  @column()
  declare anio: number

  @column({ columnName: 'id_cformacion' })
  declare idCformacion: number

  @column()
  declare nombre: string

  @column()
  declare estado: boolean

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime
}
