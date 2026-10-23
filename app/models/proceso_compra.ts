import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import ProcesoCompraOrigen from '#models/proceso_compra_origen'
import User from '#models/usuario'
import Vigencia from '#models/vigencia'

export default class ProcesoCompra extends BaseModel {
  static table = 'proceso_compra'

  @column({ isPrimary: true, columnName: 'id_proceso_compra' })
  declare id: number

  @column()
  declare vigencia: number

  @column({ columnName: 'codigo_proceso' })
  declare codigoProceso: string

  @column()
  declare descripcion: string | null

  @column({ columnName: 'id_usuario_compras' })
  declare usuarioComprasId: number

  @column()
  declare estado: 'borrador' | 'generado' | 'cerrado' | 'anulado'

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime

  @belongsTo(() => Vigencia, { foreignKey: 'vigencia', localKey: 'anio' })
  declare vigenciaRow: BelongsTo<typeof Vigencia>

  @belongsTo(() => User, { foreignKey: 'usuarioComprasId' })
  declare usuarioCompras: BelongsTo<typeof User>

  @hasMany(() => ProcesoCompraOrigen, { foreignKey: 'procesoId' })
  declare origenes: HasMany<typeof ProcesoCompraOrigen>
}
