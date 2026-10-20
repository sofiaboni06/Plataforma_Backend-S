
import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import RedConocimiento from '#models/red_conocimiento'

export default class LineaTematica extends BaseModel {
  static table = 'lineas_tematicas'

  @column({ isPrimary: true, columnName: 'id_linea_tematica' })
  declare id: number

  @column({ columnName: 'linea_tematica' })
  declare lineaTematica: string

  @column({ columnName: 'descripcion_linea_tematica' })
  declare descripcionLineaTematica: string | null

  @column()
  declare estado: boolean

  @column.dateTime({ columnName: 'created_at', autoCreate: true })
  declare createdAt: import('luxon').DateTime

  @column.dateTime({
    columnName: 'updated_at',
    autoCreate: true,
    autoUpdate: true,
  })
  declare updatedAt: import('luxon').DateTime

  @manyToMany(() => RedConocimiento, {
    pivotTable: 'redes_conocimiento_lineas_tematicas',
    localKey: 'id',
    pivotForeignKey: 'linea_tematica_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'red_conocimiento_id',
    pivotTimestamps: true,
  })
  declare redesConocimiento: ManyToMany<typeof RedConocimiento>
}
