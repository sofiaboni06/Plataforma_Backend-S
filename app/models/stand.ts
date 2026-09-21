import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Bodega from '#models/bodega'

export default class Stand extends BaseModel {
  static table = 'stand'

  @column({ isPrimary: true, columnName: 'id_stand' })
  declare id: number

  @column({ columnName: 'id_bodega' })
  declare id_bodega: number

  @column()
  declare nombre: string

  @column()
  declare estado: boolean

  @belongsTo(() => Bodega, { foreignKey: 'id_bodega"' })
  declare bodega: BelongsTo<typeof Bodega>
}
