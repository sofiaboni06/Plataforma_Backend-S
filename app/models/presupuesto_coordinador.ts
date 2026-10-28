import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import PresupuestoFicha from '#models/presupuesto_ficha'

export default class PresupuestoCoordinador extends BaseModel {
  static table = 'presupuesto_coordinador'

  @column({ isPrimary: true, columnName: 'id_presupuesto' })
  declare id: number

  @column()
  declare anio: number

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

  @hasMany(() => PresupuestoFicha, { foreignKey: 'presupuestoId' })
  declare fichas: HasMany<typeof PresupuestoFicha>
}
