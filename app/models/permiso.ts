import { BaseModel, belongsTo, column, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'
import Modulo from '#models/modulo'
import Perfil from '#models/perfil'
import type {
  PermissionAction,
  PermissionCode,
  PermissionResource,
} from '#data/permission_catalog'

export default class Permiso extends BaseModel {
  static table = 'permiso'

  @column({ isPrimary: true, columnName: 'id_permiso' })
  declare id: number

  @column({ columnName: 'id_modulo' })
  declare idModulo: number

  /**
   * Natural key (`recurso.accion`). Profiles are linked through this instead of
   * `id_permiso` so the stored value means the same in every database.
   */
  @column({ columnName: 'codigo' })
  declare code: PermissionCode

  @column()
  declare recurso: PermissionResource

  @column()
  declare accion: PermissionAction

  @column()
  declare nombre: string

  @column()
  declare estado: boolean

  @belongsTo(() => Modulo, { foreignKey: 'idModulo' })
  declare modulo: BelongsTo<typeof Modulo>

  @manyToMany(() => Perfil, {
    pivotTable: 'perfil_permiso',
    localKey: 'code',
    pivotForeignKey: 'codigo',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'id_perfil',
    pivotColumns: ['estado'],
  })
  declare perfiles: ManyToMany<typeof Perfil>
}
