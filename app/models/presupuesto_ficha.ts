import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Ficha from '#models/ficha'
import PresupuestoCoordinador from '#models/presupuesto_coordinador'

export default class PresupuestoFicha extends BaseModel {
  static table = 'presupuesto_ficha'

  @column({ isPrimary: true, columnName: 'id_presupuesto_ficha' })
  declare id: number

  @column({ columnName: 'id_presupuesto' })
  declare presupuestoId: number

  @column({ columnName: 'id_ficha' })
  declare fichaId: number

  @column({
    consume: (value) => (value === null || value === undefined ? 0 : Number(value)),
  })
  declare monto: number

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime

  @belongsTo(() => PresupuestoCoordinador, { foreignKey: 'presupuestoId' })
  declare presupuesto: BelongsTo<typeof PresupuestoCoordinador>

  @belongsTo(() => Ficha, { foreignKey: 'fichaId' })
  declare ficha: BelongsTo<typeof Ficha>
}
