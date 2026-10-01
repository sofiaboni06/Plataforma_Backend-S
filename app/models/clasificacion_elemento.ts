import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import type { CaracterElemento } from '#data/clasificaciones_elemento'
import Elemento from '#models/elemento'

export default class ClasificacionElemento extends BaseModel {
  static table = 'clasificacion_elemento'

  @column({ isPrimary: true, columnName: 'id_clasificacion_elemento' })
  declare id: number

  @column({ columnName: 'id_cformacion' })
  declare idCformacion: number

  @column()
  declare nombre: string

  @column()
  declare caracter: CaracterElemento

  @column()
  declare estado: boolean

  @hasMany(() => Elemento, { foreignKey: 'idClasificacion' })
  declare elementos: HasMany<typeof Elemento>
}
