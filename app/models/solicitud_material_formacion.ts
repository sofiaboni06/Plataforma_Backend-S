import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import ListaMaestraMaterial from '#models/lista_maestra_material'
import User from '#models/usuario'

export type EstadoSolicitudMaterialFormacion = 'pendiente' | 'atendida' | 'cancelada'

/**
 * Solicitud de material de formación: un usuario pide, para un programa, un
 * material de la lista maestra de ese programa (tabla
 * `solicitud_material_formacion`). Referencia la fila de
 * `lista_maestra_material` con FK RESTRICT —nunca la destruye— y no forma
 * parte del flujo de inventario (obras, bodega, entregas ni devoluciones).
 */
export default class SolicitudMaterialFormacion extends BaseModel {
  static table = 'solicitud_material_formacion'

  @column({ isPrimary: true, columnName: 'id_solicitud_formacion' })
  declare id: number

  @column({ columnName: 'id_lista_maestra' })
  declare idListaMaestra: number

  @column({ columnName: 'id_usuario' })
  declare idUsuario: number

  @column({ columnName: 'cantidad_solicitada' })
  declare cantidadSolicitada: number

  @column()
  declare observaciones: string | null

  @column()
  declare estado: EstadoSolicitudMaterialFormacion

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => ListaMaestraMaterial, { foreignKey: 'idListaMaestra' })
  declare material: BelongsTo<typeof ListaMaestraMaterial>

  @belongsTo(() => User, { foreignKey: 'idUsuario' })
  declare usuario: BelongsTo<typeof User>
}
