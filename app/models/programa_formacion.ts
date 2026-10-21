import { BaseModel, column } from '@adonisjs/lucid/orm'

/**
 * Programa de formación (tabla `programa_formacion`).
 *
 * Vista mínima del catálogo de programas, solo con los campos que necesita el
 * CRUD de materiales de formación (identificación y estado). Los programas se
 * crean con la gestión de programas de formación; aquí solo se leen.
 */
export default class ProgramaFormacion extends BaseModel {
  static table = 'programa_formacion'

  @column({ isPrimary: true, columnName: 'id_programa_formacion' })
  declare id: number

  @column({ columnName: 'codigo_programa' })
  declare codigo: string

  @column({ columnName: 'nombre_programa' })
  declare nombre: string

  @column()
  declare version: string

  @column({ columnName: 'estado_programa' })
  declare estado: boolean
}
