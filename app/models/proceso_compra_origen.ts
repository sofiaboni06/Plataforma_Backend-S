import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import DetalleSolicitudPrograma from '#models/detalle_solicitud_programa'
import ProcesoCompra from '#models/proceso_compra'

export default class ProcesoCompraOrigen extends BaseModel {
  static table = 'proceso_compra_origen'

  @column({ isPrimary: true, columnName: 'id_proceso_origen' })
  declare id: number

  @column({ columnName: 'id_proceso_compra' })
  declare procesoId: number

  @column({ columnName: 'id_detalle_solicitud' })
  declare detalleId: number

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @belongsTo(() => ProcesoCompra, { foreignKey: 'procesoId' })
  declare proceso: BelongsTo<typeof ProcesoCompra>

  @belongsTo(() => DetalleSolicitudPrograma, { foreignKey: 'detalleId' })
  declare detalle: BelongsTo<typeof DetalleSolicitudPrograma>
}
