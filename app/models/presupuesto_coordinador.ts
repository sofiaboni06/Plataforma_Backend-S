import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import PresupuestoAsignacion from '#models/presupuesto_asignacion'

export default class PresupuestoCoordinador extends BaseModel {
  static table = 'presupuesto_coordinador'

  @column({ isPrimary: true, columnName: 'id_presupuesto' })
  declare id: number

  @column()
  declare anio: number

  @column({ columnName: 'id_cformacion' })
  declare idCformacion: number

  @column({
    consume: (value) => (value === null || value === undefined ? 0 : Number(value)),
  })
  declare monto: number

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime

  @hasMany(() => PresupuestoAsignacion, { foreignKey: 'presupuestoId' })
  declare asignaciones: HasMany<typeof PresupuestoAsignacion>
}
