import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class PasswordResetCode extends BaseModel {
  static table = 'password_reset_codes'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'id_usuario' })
  declare idUsuario: number

  @column()
  declare correo: string

  @column({ columnName: 'codigo_hash' })
  declare codigoHash: string

  @column.dateTime({ columnName: 'expira_en' })
  declare expiraEn: DateTime

  @column.dateTime({ columnName: 'verificado_en' })
  declare verificadoEn: DateTime | null

  @column.dateTime({ columnName: 'usado_en' })
  declare usadoEn: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: false, autoUpdate: true })
  declare updatedAt: DateTime
}
