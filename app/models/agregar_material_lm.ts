import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import ProgramaFormacion from '#models/programa_formacion'
import TrainingCenter from '#models/training_center'
import Elemento from '#models/elemento'
import User from '#models/usuario'

export default class AgregarMaterialLm extends BaseModel {
  static table = 'agregar_material_lm'

  @column({ isPrimary: true, columnName: 'id_agregar_material_lm' })
  declare id: number

  @column({ columnName: 'id_programa_formacion' })
  declare programaId: number

  @column({ columnName: 'id_cformacion' })
  declare centroId: number | null

  @column({ columnName: 'id_elemento' })
  declare elementoId: number

  @column({ columnName: 'cantidad_base', consume: (value) => Number(value) })
  declare cantidadBase: number

  @column()
  declare observaciones: string | null

  @column({ columnName: 'id_usuario_registro' })
  declare usuarioRegistroId: number | null

  @column()
  declare estado: boolean

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime

  @belongsTo(() => ProgramaFormacion, { foreignKey: 'programaId' })
  declare programa: BelongsTo<typeof ProgramaFormacion>

  @belongsTo(() => TrainingCenter, { foreignKey: 'centroId' })
  declare centro: BelongsTo<typeof TrainingCenter>

  @belongsTo(() => Elemento, { foreignKey: 'elementoId' })
  declare elemento: BelongsTo<typeof Elemento>

  @belongsTo(() => User, { foreignKey: 'usuarioRegistroId' })
  declare usuarioRegistro: BelongsTo<typeof User>
}