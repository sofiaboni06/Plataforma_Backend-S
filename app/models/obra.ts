import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import SolicitudEquipo from '#models/solicitud_equipo'
import SolicitudMaterial from '#models/solicitud_material'
import TrainingCenter from '#models/training_center'

export default class Obra extends BaseModel {
  static table = 'obra'

  @column({ isPrimary: true, columnName: 'id_obra' })
  declare id: number

  @column({ columnName: 'id_cformacion' })
  declare idCformacion: number

  @column()
  declare nombre: string

  @column()
  declare lugar: string | null

  @column()
  declare estado: boolean

  @belongsTo(() => TrainingCenter, { foreignKey: 'idCformacion' })
  declare trainingCenter: BelongsTo<typeof TrainingCenter>

  @hasMany(() => SolicitudMaterial, { foreignKey: 'idObra' })
  declare solicitudesMaterial: HasMany<typeof SolicitudMaterial>

  @hasMany(() => SolicitudEquipo, { foreignKey: 'idObra' })
  declare solicitudesEquipo: HasMany<typeof SolicitudEquipo>
}
