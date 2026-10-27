import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import CargaListaMaestra from '#models/carga_lista_maestra'
import LoteVigencia from '#models/lote_vigencia'
import ProgramaFormacion from '#models/programa_formacion'
import User from '#models/usuario'

export type CaracterListaMaestra = 'consumo' | 'devolutivo' | 'software'

export default class ListaMaestraMaterial extends BaseModel {
  static table = 'lista_maestra_material'

  @column({ isPrimary: true, columnName: 'id_lista_maestra' })
  declare id: number

  @column({ columnName: 'id_programa_formacion' })
  declare programaId: number

  @column({ columnName: 'codigo_unspsc' })
  declare codigoUnspsc: string

  @column()
  declare producto: string

  @column({ columnName: 'descripcion_tecnica' })
  declare descripcionTecnica: string | null

  @column({ columnName: 'unidad_medida' })
  declare unidadMedida: string | null

  @column({
    columnName: 'valor_unitario',
    consume: (value) => (value === null || value === undefined ? null : Number(value)),
  })
  declare valorUnitario: number | null

  @column({ columnName: 'id_lote' })
  declare loteId: number | null

  @column({
    columnName: 'cantidad_base',
    consume: (value) => (value === null || value === undefined ? 0 : Number(value)),
  })
  declare cantidadBase: number

  @column()
  declare caracter: CaracterListaMaestra | null

  @column()
  declare observaciones: string | null

  @column({ columnName: 'id_carga' })
  declare cargaId: number | null

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

  @belongsTo(() => User, { foreignKey: 'usuarioRegistroId' })
  declare usuarioRegistro: BelongsTo<typeof User>

  @belongsTo(() => CargaListaMaestra, { foreignKey: 'cargaId' })
  declare carga: BelongsTo<typeof CargaListaMaestra>

  @belongsTo(() => LoteVigencia, { foreignKey: 'loteId' })
  declare lote: BelongsTo<typeof LoteVigencia>
}
