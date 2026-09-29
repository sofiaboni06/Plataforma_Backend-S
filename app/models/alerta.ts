import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Elemento from '#models/elemento'

export type TipoAlerta = 'por_agotarse' | 'agotado'

export default class Alerta extends BaseModel {
  static table = 'alerta'

  @column({ isPrimary: true, columnName: 'id_alerta' })
  declare id: number

  @column({ columnName: 'id_elemento' })
  declare idElemento: number

  @column()
  declare tipo: TipoAlerta

  @column()
  declare cantidad: number

  @column({ columnName: 'cantidad_minima' })
  declare cantidadMinima: number

  @column()
  declare estado: boolean

  @column.dateTime()
  declare fecha: DateTime

  @belongsTo(() => Elemento, { foreignKey: 'idElemento' })
  declare elemento: BelongsTo<typeof Elemento>
}
