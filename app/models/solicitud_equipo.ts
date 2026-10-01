import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Elemento from '#models/elemento'
import Obra from '#models/obra'
import User from '#models/usuario'

export type EstadoSolicitudEquipo = 'pendiente' | 'entregado' | 'devuelto'

export type EstadoElementoPrestado = 'bueno' | 'danado' | 'perdido' | 'en_reparacion'

export default class SolicitudEquipo extends BaseModel {
  static table = 'solicitud_equipo'

  @column({ isPrimary: true, columnName: 'id_solicitud_equipo' })
  declare id: number

  @column({ columnName: 'codigo_solicitud' })
  declare codigoSolicitud: string

  @column({ columnName: 'id_obra' })
  declare idObra: number

  @column({ columnName: 'id_elemento' })
  declare idElemento: number

  @column({ columnName: 'id_usuario' })
  declare idUsuario: number

  @column({ columnName: 'id_usuario_entrega' })
  declare idUsuarioEntrega: number | null

  @column()
  declare cantidad: number

  @column()
  declare ficha: string | null

  @column.dateTime()
  declare fecha: DateTime

  @column.dateTime({ columnName: 'fecha_entrega' })
  declare fechaEntrega: DateTime | null

  @column.dateTime({ columnName: 'fecha_devolucion' })
  declare fechaDevolucion: DateTime | null

  @column()
  declare estado: EstadoSolicitudEquipo

  /**
   * Novedad del bien prestado. Null mientras está pendiente o recién
   * entregado; se llena al devolver. No hay tabla de novedad ni de devolución.
   */
  @column({ columnName: 'estado_elemento' })
  declare estadoElemento: EstadoElementoPrestado | null

  @column()
  declare observacion: string | null

  @belongsTo(() => Obra, { foreignKey: 'idObra' })
  declare obra: BelongsTo<typeof Obra>

  @belongsTo(() => Elemento, { foreignKey: 'idElemento' })
  declare elemento: BelongsTo<typeof Elemento>

  @belongsTo(() => User, { foreignKey: 'idUsuario' })
  declare usuario: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'idUsuarioEntrega' })
  declare usuarioEntrega: BelongsTo<typeof User>
}
