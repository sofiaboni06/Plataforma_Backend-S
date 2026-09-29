import { timingSafeEqual } from 'node:crypto'
import hash from '@adonisjs/core/services/hash'
import { BaseModel, belongsTo, column, computed, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { type AccessToken, DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import Bodega from '#models/bodega'
import Modulo from '#models/modulo'
import Novedad from '#models/novedad'
import Perfil from '#models/perfil'
import Permiso from '#models/permiso'
import Prestamo from '#models/prestamo'
import TrainingCenter from '#models/training_center'

const AuthFinder = withAuthFinder(hash, {
  uids: ['email', 'numeroDocumento'],
  passwordColumnName: 'password',
})

function isHashedPassword(value: string) {
  return value.startsWith('$') && value.length > 20
}

export default class User extends AuthFinder(BaseModel) {
  static table = 'usuario'
  static accessTokens = DbAccessTokensProvider.forModel(User)

  declare currentAccessToken?: AccessToken

  @column({ isPrimary: true, columnName: 'id_usuario' })
  declare id: number

  @column({ columnName: 'id_cformacion' })
  declare idCformacion: number

  @column({ columnName: 'id_perfil' })
  declare idPerfil: number

  @column()
  declare nombres: string

  @column()
  declare apellidos: string

  @column({ columnName: 'tipo_documento' })
  declare tipoDocumento: string

  @column({ columnName: 'numero_documento' })
  declare numeroDocumento: string

  @column({ columnName: 'correo' })
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare estado: boolean

  @belongsTo(() => Perfil, { foreignKey: 'idPerfil' })
  declare perfil: BelongsTo<typeof Perfil>

  @hasMany(() => Prestamo, { foreignKey: 'idUsuario' })
  declare prestamos: HasMany<typeof Prestamo>

  @hasMany(() => Novedad, { foreignKey: 'idUsuario' })
  declare novedades: HasMany<typeof Novedad>

  @belongsTo(() => TrainingCenter, { foreignKey: 'idCformacion' })
  declare trainingCenter: BelongsTo<typeof TrainingCenter>

  @manyToMany(() => Bodega, {
    pivotTable: 'usuario_bodega',
    localKey: 'id',
    pivotForeignKey: 'id_usuario',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'id_bodega',
    pivotColumns: ['estado'],
  })
  declare bodegas: ManyToMany<typeof Bodega>

  @computed()
  get fullName() {
    return `${this.nombres} ${this.apellidos}`.trim()
  }

  @computed()
  get initials() {
    const [first, last] = this.fullName ? this.fullName.split(' ') : this.email.split('@')
    if (first && last) {
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
    }
    return `${first.slice(0, 2)}`.toUpperCase()
  }

  /**
   * The dump stores demo passwords in plain text. Hashed passwords (new
   * accounts created by this API) are verified with scrypt.
   */
  override async verifyPassword(plainPassword: string) {
    const stored = this.password
    if (!stored) {
      return false
    }

    if (isHashedPassword(stored)) {
      return hash.verify(stored, plainPassword)
    }

    const left = Buffer.from(stored)
    const right = Buffer.from(plainPassword)
    if (left.length !== right.length) {
      return false
    }

    return timingSafeEqual(left, right)
  }

  async loadProfileRelations() {
    return User.query()
      .where('id', this.id)
      .preload('perfil')
      .preload('trainingCenter', (query) => {
        query.preload('regional')
      })
      .preload('bodegas', (query) => {
        query.wherePivot('estado', true).orderBy('id_bodega', 'asc')
      })
      .firstOrFail()
  }

  async allowedModules() {
    const user = await User.query()
      .where('id', this.id)
      .preload('perfil', (query) => {
        query.preload('modulos', (modulosQuery) => {
          modulosQuery
            .where('modulo.estado', true)
            .wherePivot('estado', true)
            .orderBy('id_modulo', 'asc')
        })
      })
      .firstOrFail()

    return (user.perfil?.modulos ?? []) as Modulo[]
  }

  async allowedPermissions() {
    const user = await User.query()
      .where('id', this.id)
      .preload('perfil', (query) => {
        query.preload('permisos', (permisosQuery) => {
          permisosQuery
            .where('permiso.estado', true)
            .wherePivot('estado', true)
            .orderBy('id_permiso', 'asc')
        })
      })
      .firstOrFail()

    return (user.perfil?.permisos ?? []) as Permiso[]
  }
}
