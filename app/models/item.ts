import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Elemento from '#models/elemento'

export default class Item extends BaseModel {
  static table = 'item'

  @column({ isPrimary: true, columnName: 'id_item' })
  declare id: number

  @column({ columnName: 'id_elemento' })
  declare idElemento: number

  @column({ columnName: 'numero_serial' })
  declare numeroSerial: string

  @column()
  declare estado: boolean

  @belongsTo(() => Elemento, { foreignKey: 'idElemento' })
  declare elemento: BelongsTo<typeof Elemento>
}
