import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import PresupuestoCoordinador from '#models/presupuesto_coordinador'
import ProgramaFormacion from '#models/programa_formacion'

export default class PresupuestoPrograma extends BaseModel {
  static table = 'presupuesto_programa'

  @column({ isPrimary: true, columnName: 'id_presupuesto_programa' })
  declare id: number

  @column({ columnName: 'id_presupuesto' })
  declare presupuestoId: number

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

  @belongsTo(() => PresupuestoCoordinador, { foreignKey: 'presupuestoId' })
  declare presupuesto: BelongsTo<typeof PresupuestoCoordinador>

  @belongsTo(() => ProgramaFormacion, { foreignKey: 'programaId' })
  declare programa: BelongsTo<typeof ProgramaFormacion>
}
