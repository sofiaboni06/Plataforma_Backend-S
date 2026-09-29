import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Actividad from '#models/actividad'
import Elemento from '#models/elemento'
import Novedad from '#models/novedad'
import User from '#models/usuario'

export type EstadoPrestamo = 'prestado' | 'devuelto' | 'consumido'

export default class Prestamo extends BaseModel {
  static table = 'prestamo'

  @column({ isPrimary: true, columnName: 'id_prestamo' })
  declare id: number

  @column({ columnName: 'id_elemento' })
  declare idElemento: number

  @column({ columnName: 'id_usuario' })
  declare idUsuario: number

  @column({ columnName: 'id_actividad' })
  declare idActividad: number

  @column()
  declare cantidad: number

  @column()
  declare ficha: string | null

  @column.dateTime()
  declare fecha: DateTime

  @column()
  declare estado: EstadoPrestamo

  @column()
  declare observacion: string | null

  @belongsTo(() => Elemento, { foreignKey: 'idElemento' })
  declare elemento: BelongsTo<typeof Elemento>

  @belongsTo(() => User, { foreignKey: 'idUsuario' })
  declare usuario: BelongsTo<typeof User>

  @belongsTo(() => Actividad, { foreignKey: 'idActividad' })
  declare actividad: BelongsTo<typeof Actividad>

  @hasMany(() => Novedad, { foreignKey: 'idPrestamo' })
  declare novedades: HasMany<typeof Novedad>
}
