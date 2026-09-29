import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Elemento from '#models/elemento'
import Prestamo from '#models/prestamo'
import User from '#models/usuario'

export default class Novedad extends BaseModel {
  static table = 'novedad'

  @column({ isPrimary: true, columnName: 'id_novedad' })
  declare id: number

  @column({ columnName: 'id_prestamo' })
  declare idPrestamo: number

  @column({ columnName: 'id_elemento' })
  declare idElemento: number

  @column({ columnName: 'id_usuario' })
  declare idUsuario: number

  @column()
  declare cantidad: number

  @column.dateTime()
  declare fecha: DateTime

  @column()
  declare observacion: string | null

  @column()
  declare estado: boolean

  @belongsTo(() => Prestamo, { foreignKey: 'idPrestamo' })
  declare prestamo: BelongsTo<typeof Prestamo>

  @belongsTo(() => Elemento, { foreignKey: 'idElemento' })
  declare elemento: BelongsTo<typeof Elemento>

  @belongsTo(() => User, { foreignKey: 'idUsuario' })
  declare usuario: BelongsTo<typeof User>
}
