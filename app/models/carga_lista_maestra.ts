import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import ListaMaestraMaterial from '#models/lista_maestra_material'
import ProgramaFormacion from '#models/programa_formacion'
import User from '#models/usuario'

export default class CargaListaMaestra extends BaseModel {
  static table = 'carga_lista_maestra'

  @column({ isPrimary: true, columnName: 'id_carga' })
  declare id: number

  @column({ columnName: 'id_programa_formacion' })
  declare programaId: number

  @column({ columnName: 'id_usuario_carga' })
  declare usuarioCargaId: number

  @column({ columnName: 'nombre_archivo' })
  declare nombreArchivo: string

  @column({ columnName: 'ruta_archivo' })
  declare rutaArchivo: string | null

  @column({ columnName: 'total_registros' })
  declare totalRegistros: number

  @column({ columnName: 'registros_ok' })
  declare registrosOk: number

  @column({ columnName: 'registros_error' })
  declare registrosError: number

  @column()
  declare estado: 'procesando' | 'completada' | 'con_errores' | 'fallida'

  @column()
  declare observaciones: string | null

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime

  @belongsTo(() => ProgramaFormacion, { foreignKey: 'programaId' })
  declare programa: BelongsTo<typeof ProgramaFormacion>

  @belongsTo(() => User, { foreignKey: 'usuarioCargaId' })
  declare usuarioCarga: BelongsTo<typeof User>

  @hasMany(() => ListaMaestraMaterial, { foreignKey: 'cargaId' })
  declare items: HasMany<typeof ListaMaestraMaterial>
}
