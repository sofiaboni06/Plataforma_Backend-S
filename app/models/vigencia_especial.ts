import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Vigencia from '#models/vigencia'
import VigenciaEspecialPrograma from '#models/vigencia_especial_programa'

export default class VigenciaEspecial extends BaseModel {
  static table = 'vigencia_especial'

  @column({ isPrimary: true, columnName: 'id_vigencia_especial' })
  declare id: number

  @column()
  declare anio: number

  @column({ columnName: 'id_cformacion' })
  declare idCformacion: number

  @column()
  declare nombre: string

  @column({
    consume: (value) => (value === null || value === undefined ? 0 : Number(value)),
  })
  declare monto: number

  @column()
  declare activa: boolean

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime

  @belongsTo(() => Vigencia, { foreignKey: 'anio', localKey: 'anio' })
  declare vigencia: BelongsTo<typeof Vigencia>

  @hasMany(() => VigenciaEspecialPrograma, { foreignKey: 'vigenciaEspecialId' })
  declare programas: HasMany<typeof VigenciaEspecialPrograma>
}
