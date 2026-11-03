import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import PresupuestoAsignacion from '#models/presupuesto_asignacion'
import ProgramaFormacion from '#models/programa_formacion'

export default class PresupuestoAsignacionArea extends BaseModel {
  static table = 'presupuesto_asignacion_area'

  @column({ isPrimary: true, columnName: 'id_presupuesto_asignacion_area' })
  declare id: number

  @column({ columnName: 'id_presupuesto_asignacion' })
  declare asignacionId: number

  @column({ columnName: 'id_programa_formacion' })
  declare programaId: number

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

  @belongsTo(() => ProgramaFormacion, { foreignKey: 'programaId' })
  declare programa: BelongsTo<typeof ProgramaFormacion>
}
