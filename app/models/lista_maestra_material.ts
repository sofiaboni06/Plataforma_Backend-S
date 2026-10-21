import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Elemento from '#models/elemento'
import ProgramaFormacion from '#models/programa_formacion'
import User from '#models/usuario'

/**
 * Material de formación: un elemento del inventario que un programa de
 * formación necesita, con su cantidad base de referencia (tabla
 * `lista_maestra_material`).
 *
 * La pareja programa+elemento es única. Las solicitudes de materiales por
 * programa referencian esta fila con FK RESTRICT, por lo que la baja es
 * lógica (`estado = false`) y nunca un borrado físico.
 */
export default class ListaMaestraMaterial extends BaseModel {
  static table = 'lista_maestra_material'

  @column({ isPrimary: true, columnName: 'id_lista_maestra' })
  declare id: number

  @column({ columnName: 'id_programa_formacion' })
  declare idProgramaFormacion: number

  @column({ columnName: 'id_elemento' })
  declare idElemento: number

  @column({
    columnName: 'cantidad_base',
    consume: (value) => (value === null || value === undefined ? null : Number(value)),
  })
  declare cantidadBase: number

  @column()
  declare observaciones: string | null

  @column({ columnName: 'id_usuario_registro' })
  declare idUsuarioRegistro: number | null

  @column()
  declare estado: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => ProgramaFormacion, { foreignKey: 'idProgramaFormacion' })
  declare programa: BelongsTo<typeof ProgramaFormacion>

  @belongsTo(() => Elemento, { foreignKey: 'idElemento' })
  declare elemento: BelongsTo<typeof Elemento>

  @belongsTo(() => User, { foreignKey: 'idUsuarioRegistro' })
  declare usuarioRegistro: BelongsTo<typeof User>
}
