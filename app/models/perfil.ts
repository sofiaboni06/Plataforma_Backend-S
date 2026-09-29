import { BaseModel, column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import Modulo from '#models/modulo'
import Permiso from '#models/permiso'
import User from '#models/usuario'

export default class Perfil extends BaseModel {
  static table = 'perfil'

  @column({ isPrimary: true, columnName: 'id_perfil' })
  declare id: number

  @column()
  declare nombre: string

  @column()
  declare descripcion: string | null

  @column()
  declare estado: boolean

  @hasMany(() => User, { foreignKey: 'idPerfil' })
  declare users: HasMany<typeof User>

  @manyToMany(() => Modulo, {
    pivotTable: 'modulo_perfil',
    localKey: 'id',
    pivotForeignKey: 'id_perfil',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'id_modulo',
    pivotColumns: ['estado'],
  })
  declare modulos: ManyToMany<typeof Modulo>

  @manyToMany(() => Permiso, {
    pivotTable: 'perfil_permiso',
    localKey: 'id',
    pivotForeignKey: 'id_perfil',
    relatedKey: 'code',
    pivotRelatedForeignKey: 'codigo',
    pivotColumns: ['estado'],
  })
  declare permisos: ManyToMany<typeof Permiso>
}
