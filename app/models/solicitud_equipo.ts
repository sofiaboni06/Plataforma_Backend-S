import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Devolucion from '#models/devolucion'
import Elemento from '#models/elemento'
import Entrega from '#models/entrega'
import Obra from '#models/obra'
import User from '#models/usuario'
import { fechaDia, type FechaDia } from '#services/plazo'

export type EstadoSolicitudEquipo = 'pendiente' | 'parcial' | 'entregado' | 'devuelto'
export type EstadoElementoEquipo = 'bueno' | 'danado' | 'perdido' | 'en_reparacion'

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

  /** Admin bodega que la hizo a nombre del instructor. Null si la pidió él. */
  @column({ columnName: 'id_usuario_registra' })
  declare idUsuarioRegistra: number | null

  @column({ columnName: 'id_usuario_entrega' })
  declare idUsuarioEntrega: number | null

  @column()
  declare cantidad: number

  @column({ columnName: 'cantidad_entregada' })
  declare cantidadEntregada: number

  @column({ columnName: 'cantidad_devuelta' })
  declare cantidadDevuelta: number

  @column()
  declare ficha: string | null

  @column()
  declare estado: EstadoSolicitudEquipo

  /** El peor estado con que ha vuelto el equipo de esta fila. */
  @column({ columnName: 'estado_elemento' })
  declare estadoElemento: EstadoElementoEquipo | null

  @column.dateTime()
  declare fecha: DateTime

  @column.dateTime({ columnName: 'fecha_entrega' })
  declare fechaEntrega: DateTime | null

  @column.dateTime({ columnName: 'fecha_devolucion' })
  declare fechaDevolucion: DateTime | null

  /** Desde cuándo lo necesita (inicio del préstamo). `YYYY-MM-DD`. */
  @column({ columnName: 'fecha_inicio', consume: fechaDia })
  declare fechaInicio: FechaDia | null

  /** Hasta cuándo lo pide el instructor. */
  @column({ columnName: 'fecha_devolucion_propuesta', consume: fechaDia })
  declare fechaDevolucionPropuesta: FechaDia | null

  /** La que bodega confirma o ajusta al entregar: desde ese día se avisa si sigue afuera. */
  @column({ columnName: 'fecha_devolucion_limite', consume: fechaDia })
  declare fechaDevolucionLimite: FechaDia | null

  @column()
  declare observacion: string | null

  @belongsTo(() => Obra, { foreignKey: 'idObra' })
  declare obra: BelongsTo<typeof Obra>

  @belongsTo(() => Elemento, { foreignKey: 'idElemento' })
  declare elemento: BelongsTo<typeof Elemento>

  @belongsTo(() => User, { foreignKey: 'idUsuario' })
  declare usuario: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'idUsuarioRegistra' })
  declare usuarioRegistra: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'idUsuarioEntrega' })
  declare usuarioEntrega: BelongsTo<typeof User>

  @hasMany(() => Entrega, { foreignKey: 'idSolicitudEquipo' })
  declare entregas: HasMany<typeof Entrega>

  @hasMany(() => Devolucion, { foreignKey: 'idSolicitudEquipo' })
  declare devoluciones: HasMany<typeof Devolucion>
}
