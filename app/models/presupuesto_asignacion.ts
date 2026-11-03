import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import PresupuestoAsignacionFicha from '#models/presupuesto_asignacion_ficha'
import PresupuestoCoordinador from '#models/presupuesto_coordinador'
import User from '#models/usuario'

export default class PresupuestoAsignacion extends BaseModel {
  static table = 'presupuesto_asignacion'

  @column({ isPrimary: true, columnName: 'id_presupuesto_asignacion' })
  declare id: number

  @column({ columnName: 'id_presupuesto' })
  declare presupuestoId: number

  @column({ columnName: 'id_usuario' })
  declare idUsuario: number

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

  @belongsTo(() => User, { foreignKey: 'idUsuario' })
  declare usuario: BelongsTo<typeof User>

  @hasMany(() => PresupuestoAsignacionFicha, { foreignKey: 'asignacionId' })
  declare fichas: HasMany<typeof PresupuestoAsignacionFicha>
}
