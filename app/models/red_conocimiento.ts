import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import LineaTematica from '#models/linea_tematica'

export default class RedConocimiento extends BaseModel {
  static table = 'redes_conocimiento'

  @column({ isPrimary: true, columnName: 'id_red_conocimiento' })
  declare id: number

  @column({ columnName: 'red_conocimiento' })
  declare nombre: string

  @column({ columnName: 'nombre_gestor' })
  declare nombreGestor: string | null

  @column({ columnName: 'tel_gestor' })
  declare telGestor: string | null

  @column({ columnName: 'mail_gestor' })
  declare mailGestor: string | null

  @column({ columnName: 'nombre_asesor' })
  declare nombreAsesor: string | null

  @column({ columnName: 'tel_asesor' })
  declare telAsesor: string | null

  @column({ columnName: 'mail_asesor' })
  declare mailAsesor: string | null

  @column()
  declare estado: boolean

  @manyToMany(() => LineaTematica, {
    pivotTable: 'redes_conocimiento_lineas_tematicas',
    localKey: 'id',
    pivotForeignKey: 'red_conocimiento_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'linea_tematica_id',
  })
  declare lineasTematicas: ManyToMany<typeof LineaTematica>
}
