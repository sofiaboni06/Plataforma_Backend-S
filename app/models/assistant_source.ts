import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class AssistantSource extends BaseModel {
  static table = 'assistant_source'

  @column({ isPrimary: true, columnName: 'id_source' })
  declare id: number

  @column()
  declare titulo: string

  @column()
  declare modulo: string

  @column()
  declare contenido: string

  @column()
  declare estado: boolean
}
