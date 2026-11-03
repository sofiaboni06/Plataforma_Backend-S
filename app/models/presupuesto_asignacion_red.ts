import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import PresupuestoAsignacion from '#models/presupuesto_asignacion'
import RedConocimiento from '#models/red_conocimiento'

export default class PresupuestoAsignacionRed extends BaseModel {
  static table = 'presupuesto_asignacion_red'

  @column({ isPrimary: true, columnName: 'id_presupuesto_asignacion_red' })
  declare id: number

  @column({ columnName: 'id_presupuesto_asignacion' })
  declare asignacionId: number

  @column({ columnName: 'id_red_conocimiento' })
  declare redId: number

  @column({
    consume: (value) => (value === null || value === undefined ? 0 : Number(value)),
  })
  declare monto: number

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime

  @belongsTo(() => PresupuestoAsignacion, { foreignKey: 'asignacionId' })
  declare asignacion: BelongsTo<typeof PresupuestoAsignacion>

  @belongsTo(() => RedConocimiento, { foreignKey: 'redId' })
  declare red: BelongsTo<typeof RedConocimiento>
}
