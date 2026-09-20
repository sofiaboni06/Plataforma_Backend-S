import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Categoria extends BaseModel {
  static table = 'categoria'

  @column({ isPrimary: true, columnName: 'id_categoria' })
  declare id: number

  @column({ columnName: 'id_cformacion' })
  declare idCformacion: number

  @column()
  declare nombre: string

  @column()
  declare estado: boolean
}