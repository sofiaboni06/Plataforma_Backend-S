import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Alerta from '#models/alerta'
import ClasificacionElemento from '#models/clasificacion_elemento'
import CodigoEstandar from '#models/codigo_estandar'
import Item from '#models/item'
import SolicitudEquipo from '#models/solicitud_equipo'
import SolicitudMaterial from '#models/solicitud_material'
import Stand from '#models/stand'
import Subcategoria from '#models/subcategoria'
import UnidadMedida from '#models/unidad_medida'
import UsoPresupuestal from '#models/uso_presupuestal'

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

  @column({ columnName: 'cantidad_minima' })
  declare cantidadMinima: number

  @column()
  declare estado: boolean

  @column({ columnName: 'id_unidad_medida' })
  declare idUnidadMedida: number

  @column()
  declare codigo: string | null

  @column({ columnName: 'descripcion_tecnica' })
  declare descripcionTecnica: string | null

  @column()
  declare marca: string | null

  @column()
  declare color: string | null

  @column({
    consume: (value) => (value === null || value === undefined ? null : Number(value)),
  })
  declare gramaje: number | null

  @column({ columnName: 'id_clasificacion_elemento' })
  declare idClasificacion: number | null

  @column({
    columnName: 'valor_unitario_promedio',
    consume: (value) => (value === null || value === undefined ? null : Number(value)),
  })
  declare valorUnitarioPromedio: number | null

  @column({
    columnName: 'porcentaje_aumento',
    consume: (value) => (value === null || value === undefined ? null : Number(value)),
  })
  declare porcentajeAumento: number | null

  /**
   * cantidad × valor unitario promedio × (1 + porcentaje / 100).
   * Null until both the unit value and the percentage have been entered.
   */
  valorConAumento() {
    const valor = this.valorUnitarioPromedio
    const porcentaje = this.porcentajeAumento

    if (valor === null || valor === undefined || porcentaje === null || porcentaje === undefined) {
      return null
    }

    const total = (this.cantidad * valor * (100 + porcentaje)) / 100
    return Math.round(total * 100) / 100
  }

  @column({ columnName: 'id_codigo_estandar' })
  declare idCodigoEstandar: number | null

  @column({ columnName: 'id_uso_presupuestal' })
  declare idUsoPresupuestal: number | null

  @column({ columnName: 'id_item' })
  declare idItem: number | null

  @column({ columnName: 'url_fotografia' })
  declare urlFotografia: string | null

  @belongsTo(() => Subcategoria, { foreignKey: 'idSubcategoria' })
  declare subcategoria: BelongsTo<typeof Subcategoria>

  @belongsTo(() => Stand, { foreignKey: 'idStand' })
  declare stand: BelongsTo<typeof Stand>

  @belongsTo(() => UnidadMedida, { foreignKey: 'idUnidadMedida' })
  declare unidadMedida: BelongsTo<typeof UnidadMedida>

  @belongsTo(() => Item, { foreignKey: 'idItem' })
  declare item: BelongsTo<typeof Item>

  @belongsTo(() => CodigoEstandar, { foreignKey: 'idCodigoEstandar' })
  declare codigoEstandar: BelongsTo<typeof CodigoEstandar>

  @belongsTo(() => ClasificacionElemento, { foreignKey: 'idClasificacion' })
  declare clasificacion: BelongsTo<typeof ClasificacionElemento>

  @belongsTo(() => UsoPresupuestal, { foreignKey: 'idUsoPresupuestal' })
  declare usoPresupuestal: BelongsTo<typeof UsoPresupuestal>

  @hasMany(() => SolicitudMaterial, { foreignKey: 'idElemento' })
  declare solicitudesMaterial: HasMany<typeof SolicitudMaterial>

  @hasMany(() => SolicitudEquipo, { foreignKey: 'idElemento' })
  declare solicitudesEquipo: HasMany<typeof SolicitudEquipo>

  @hasMany(() => Alerta, { foreignKey: 'idElemento' })
  declare alertas: HasMany<typeof Alerta>
}
