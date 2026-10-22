import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import ProgramaFormacion from '#models/programa_formacion'

export default class NivelPrograma extends BaseModel {
  static table = 'nivel_programa'

  @column({ isPrimary: true, columnName: 'id_nivel_programa' })
  declare id: number

  @column({ columnName: 'nivel_programa' })
  declare nombre: string

  @hasMany(() => ProgramaFormacion, { foreignKey: 'idNivelPrograma' })
  declare programas: HasMany<typeof ProgramaFormacion>
}
