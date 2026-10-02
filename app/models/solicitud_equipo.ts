import { DateTime } from 'luxon'
import {
  BaseModel,
  column,
  belongsTo,
} from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

import Elemento from '#models/elemento'
import Obra from '#models/obra'
import User from '#models/usuario'

export default class SolicitudEquipo extends BaseModel {
  public static table = 'solicitud_equipo'

  @column({ isPrimary: true })
  declare idSolicitudEquipo: number

  @column()
  declare codigoSolicitud: string

  @column()
  declare idObra: number

  @column()
  declare idElemento: number

  @column()
  declare idUsuario: number

  @column()
  declare idUsuarioEntrega: number | null

  @column()
  declare cantidad: number

  @column()
  declare ficha: string | null

  @column()
  declare estado: 'pendiente' | 'entregado' | 'devuelto'

  @column()
  declare estadoElemento: 'bueno' | 'danado' | 'perdido' | 'en_reparacion' | null

  @column.dateTime({ autoCreate: true })
  declare fecha: DateTime

  @column.dateTime()
  declare fechaEntrega: DateTime | null

  @column.dateTime()
  declare fechaDevolucion: DateTime | null

  @column()
  declare observacion: string | null

  @belongsTo(() => Elemento, {
    foreignKey: 'idElemento',
  })
  declare elemento: BelongsTo<typeof Elemento>

  @belongsTo(() => Obra, {
    foreignKey: 'idObra',
  })
  declare obra: BelongsTo<typeof Obra>

  @belongsTo(() => User, {
    foreignKey: 'idUsuario',
  })
  declare usuario: BelongsTo<typeof User>
}