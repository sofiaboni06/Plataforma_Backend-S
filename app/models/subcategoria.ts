import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Subcategoria extends BaseModel {
  static table = 'subcategoria'

  @column({ isPrimary: true, columnName: 'id_subcategoria' })
  declare id: number

  @column({ columnName: 'id_categoria' })
  declare idCategoria: number

  @column()
  declare nombre: string

  @column()
  declare estado: boolean
}