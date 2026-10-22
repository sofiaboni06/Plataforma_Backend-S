import { BaseModel, belongsTo, column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import Ficha from '#models/ficha'
import LineaTematica from '#models/linea_tematica'
import NivelPrograma from '#models/nivel_programa'
import RedConocimiento from '#models/red_conocimiento'
import User from '#models/usuario'

export default class ProgramaFormacion extends BaseModel {
  static table = 'programa_formacion'

  @column({ isPrimary: true, columnName: 'id_programa_formacion' })
  declare id: number

  @column({ columnName: 'id_red_conocimiento' })
  declare idRedConocimiento: number

  @column({ columnName: 'id_linea_tematica' })
  declare idLineaTematica: number

  @column({ columnName: 'id_nivel_programa' })
  declare idNivelPrograma: number

  @column({ columnName: 'codigo_programa' })
  declare codigo: string

  @column({ columnName: 'nombre_programa' })
  declare nombre: string

  @column()
  declare version: string

  @column({ columnName: 'duracion_total_horas' })
  declare duracionTotalHoras: number | null

  @column({ columnName: 'cupo_base_aprendices' })
  declare cupoBaseAprendices: number

  @column({ columnName: 'estado_programa' })
  declare estado: boolean

  @belongsTo(() => NivelPrograma, { foreignKey: 'idNivelPrograma' })
  declare nivel: BelongsTo<typeof NivelPrograma>

  @belongsTo(() => RedConocimiento, { foreignKey: 'idRedConocimiento' })
  declare redConocimiento: BelongsTo<typeof RedConocimiento>

  @belongsTo(() => LineaTematica, { foreignKey: 'idLineaTematica' })
  declare lineaTematica: BelongsTo<typeof LineaTematica>

  @hasMany(() => Ficha, { foreignKey: 'programaId' })
  declare fichas: HasMany<typeof Ficha>

  @manyToMany(() => User, {
    pivotTable: 'usuario_programa_formacion',
    localKey: 'id',
    pivotForeignKey: 'id_programa_formacion',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'id_usuario',
    pivotColumns: ['estado'],
    pivotTimestamps: true,
  })
  declare usuarios: ManyToMany<typeof User>
}
