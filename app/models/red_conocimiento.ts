
import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import LineaTematica from '#models/linea_tematica'

export default class RedConocimiento extends BaseModel {
  static table = 'redes_conocimiento'

  @column({ isPrimary: true, columnName: 'id_red_conocimiento' })
  declare id: number

  @column({ columnName: 'red_conocimiento' })
  declare redConocimiento: string

  @column({ columnName: 'nombre_gestor' })
  declare nombreGestor: string

  @column({ columnName: 'tel_gestor' })
  declare telGestor: string

  @column({ columnName: 'mail_gestor' })
  declare mailGestor: string

  @column({ columnName: 'nombre_asesor' })
  declare nombreAsesor: string

  @column({ columnName: 'tel_asesor' })
  declare telAsesor: string

  @column({ columnName: 'mail_asesor' })
  declare mailAsesor: string

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

  @manyToMany(() => LineaTematica, {
    pivotTable: 'redes_conocimiento_lineas_tematicas',
    localKey: 'id',
    pivotForeignKey: 'red_conocimiento_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'linea_tematica_id',
    pivotTimestamps: true,
  })
  declare lineasTematicas: ManyToMany<typeof LineaTematica>
}
