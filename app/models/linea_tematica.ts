import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import RedConocimiento from '#models/red_conocimiento'

export default class LineaTematica extends BaseModel {
  static table = 'lineas_tematicas'

  @column({ isPrimary: true, columnName: 'id_linea_tematica' })
  declare id: number

  @column({ columnName: 'linea_tematica' })
  declare nombre: string

  @column({ columnName: 'descripcion_linea_tematica' })
  declare descripcion: string | null

  @column()
  declare estado: boolean

  @manyToMany(() => RedConocimiento, {
    pivotTable: 'redes_conocimiento_lineas_tematicas',
    localKey: 'id',
    pivotForeignKey: 'linea_tematica_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'red_conocimiento_id',
  })
  declare redesConocimiento: ManyToMany<typeof RedConocimiento>
}
