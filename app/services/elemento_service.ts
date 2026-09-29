import { Exception } from '@adonisjs/core/exceptions'
import Elemento from '#models/elemento'
import Item from '#models/item'
import {
  assertStandInScope,
  assertSubcategoriaInScope,
  standIdsQuery,
  type AccessScope,
} from '#services/access_control'
import { rethrowDatabaseError } from '#services/database_error'

type ElementoPayload = {
  idItem: number
  idStand: number
  cantidad: number
  gramaje?: number | null
  estado: boolean
  idUnidadMedida: number
  codigo: string
  descripcion?: string | null
  marca?: string | null
  color?: string | null
  urlFotografia?: string | null
  idClasificacion?: number | null
  valorUnitarioPromedio?: number | null
  porcentajeAumento?: number | null
  idCodigoEstandar?: number | null
}

type UpdateElementoPayload = Partial<ElementoPayload>

export default class ElementoService {
  async list(scope: AccessScope) {
    const query = this.query().orderBy('id_elemento', 'asc')

    if (!scope.isAdmin) {
      query.whereIn('id_stand', standIdsQuery(scope))
    }

    return query
  }

  async create(scope: AccessScope, payload: ElementoPayload) {
    await assertStandInScope(scope, payload.idStand)
    const item = await this.itemEnUso(scope, payload.idItem)

    try {
      const elemento = await Elemento.create({
        idItem: item.id,
        idSubcategoria: item.idSubcategoria,
        idStand: payload.idStand,
        nombre: item.nombre,
        cantidad: payload.cantidad,
        gramaje: payload.gramaje ?? null,
        estado: payload.estado,
        idUnidadMedida: payload.idUnidadMedida,
        codigo: payload.codigo,
        descripcionTecnica: payload.descripcion ?? null,
        marca: payload.marca ?? null,
        color: payload.color ?? null,
        urlFotografia: payload.urlFotografia ?? null,
        idClasificacion: payload.idClasificacion ?? null,
        valorUnitarioPromedio: payload.valorUnitarioPromedio ?? null,
        porcentajeAumento: payload.porcentajeAumento ?? null,
        idCodigoEstandar: payload.idCodigoEstandar ?? null,
      })

      return this.findById(scope, elemento.id)
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo crear el elemento')
    }
  }

  async findById(scope: AccessScope, id: number) {
    const elemento = await this.query().where('id_elemento', id).firstOrFail()
    await assertStandInScope(scope, elemento.idStand)

    return elemento
  }

  async update(scope: AccessScope, id: number, payload: UpdateElementoPayload) {
    const elemento = await Elemento.findOrFail(id)
    await assertStandInScope(scope, elemento.idStand)

    if (payload.idStand !== undefined) {
      await assertStandInScope(scope, payload.idStand)
    }

    const item =
      payload.idItem !== undefined ? await this.itemEnUso(scope, payload.idItem) : undefined

    elemento.merge({
      ...(item
        ? {
            idItem: item.id,
            idSubcategoria: item.idSubcategoria,
            nombre: item.nombre,
          }
        : {}),
      ...(payload.idStand !== undefined && { idStand: payload.idStand }),
      ...(payload.cantidad !== undefined && { cantidad: payload.cantidad }),
      ...(payload.gramaje !== undefined && { gramaje: payload.gramaje }),
      ...(payload.estado !== undefined && { estado: payload.estado }),
      ...(payload.idUnidadMedida !== undefined && { idUnidadMedida: payload.idUnidadMedida }),
      ...(payload.codigo !== undefined && { codigo: payload.codigo }),
      ...(payload.descripcion !== undefined && { descripcionTecnica: payload.descripcion }),
      ...(payload.marca !== undefined && { marca: payload.marca }),
      ...(payload.color !== undefined && { color: payload.color }),
      ...(payload.urlFotografia !== undefined && { urlFotografia: payload.urlFotografia }),
      ...(payload.idClasificacion !== undefined && { idClasificacion: payload.idClasificacion }),
      ...(payload.valorUnitarioPromedio !== undefined && {
        valorUnitarioPromedio: payload.valorUnitarioPromedio,
      }),
      ...(payload.porcentajeAumento !== undefined && {
        porcentajeAumento: payload.porcentajeAumento,
      }),
      ...(payload.idCodigoEstandar !== undefined && {
        idCodigoEstandar: payload.idCodigoEstandar,
      }),
    })

    try {
      await elemento.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo actualizar el elemento')
    }

    return this.findById(scope, id)
  }

  /**
   * Stock always hangs from a catalog item. A disabled item cannot receive
   * new elementos.
   */
  private async itemEnUso(scope: AccessScope, idItem: number) {
    const item = await Item.findOrFail(idItem)
    await assertSubcategoriaInScope(scope, item.idSubcategoria)

    if (item.estado === false) {
      throw new Exception('El item está deshabilitado', {
        status: 409,
        code: 'E_ITEM_DISABLED',
      })
    }

    return item
  }

  private query() {
    return Elemento.query()
      .preload('item')
      .preload('subcategoria')
      .preload('stand', (query) => query.preload('subBodega'))
      .preload('clasificacion')
      .preload('unidadMedida')
      .preload('codigoEstandar')
  }
}
