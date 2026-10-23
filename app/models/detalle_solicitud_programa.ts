import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import ListaMaestraMaterial from '#models/lista_maestra_material'
import SolicitudMaterialPrograma from '#models/solicitud_material_programa'

export type EstadoDetalleSolicitud = 'pendiente' | 'aprobado' | 'parcial' | 'rechazado'

export default class DetalleSolicitudPrograma extends BaseModel {
  static table = 'detalle_solicitud_programa'

  @column({ isPrimary: true, columnName: 'id_detalle_solicitud' })
  declare id: number

  @column({ columnName: 'id_solicitud_programa' })
  declare solicitudId: number

  @column({ columnName: 'id_programa_formacion' })
  declare programaId: number

  @column({ columnName: 'id_lista_maestra' })
  declare listaMaestraId: number

  @column({
    columnName: 'cantidad_maestra_referencia',
    consume: (value) => (value === null || value === undefined ? null : Number(value)),
  })
  declare cantidadMaestraReferencia: number | null

  @column({
    columnName: 'cantidad_solicitada',
    consume: (value) => (value === null || value === undefined ? 0 : Number(value)),
  })
  declare cantidadSolicitada: number

  @column({
    columnName: 'cantidad_aprobada',
    consume: (value) => (value === null || value === undefined ? null : Number(value)),
  })
  declare cantidadAprobada: number | null

  @column()
  declare estado: EstadoDetalleSolicitud

  @column({ columnName: 'observacion_coordinador' })
  declare observacionCoordinador: string | null

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime

  @belongsTo(() => SolicitudMaterialPrograma, { foreignKey: 'solicitudId' })
  declare solicitud: BelongsTo<typeof SolicitudMaterialPrograma>

  @belongsTo(() => ListaMaestraMaterial, { foreignKey: 'listaMaestraId' })
  declare listaMaestra: BelongsTo<typeof ListaMaestraMaterial>
}
