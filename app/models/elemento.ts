import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Elemento extends BaseModel {
  static table = 'elemento'

  @column({ isPrimary: true, columnName: 'id_elemento' })
  declare id: number

  @column({ columnName: 'id_subcategoria' })
  declare idSubcategoria: number

  @column({ columnName: 'id_stand' })
  declare idStand: number

  @column()
  declare nombre: string

  @column()
  declare cantidad: number

  @column()
  declare estado: boolean

  @column({ columnName: 'id_unidad_medida' })
  declare idUnidadMedida: number

  @column()
  declare codigo: string

  @column()
  declare descripcion: string
}
