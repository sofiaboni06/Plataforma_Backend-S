import { Exception } from '@adonisjs/core/exceptions'
import db from '@adonisjs/lucid/services/db'
import Elemento from '#models/elemento'
import Item from '#models/item'
import { assertStandInScope, standIdsQuery, type AccessScope } from '#services/access_control'
import { rethrowDatabaseError } from '#services/database_error'

type ElementoPayload = {
  idItem: number
  idStand: number
  cantidad: number
  cantidadMinima?: number
  gramaje?: number | null
  estado: boolean
  idUnidadMedida: number
  codigo: string
  descripcion?: string | null
  marca?: string | null
  color?: string | null
  idClasificacion?: number | null
  valorUnitarioPromedio?: number | null
  porcentajeAumento?: number | null
  idCodigoEstandar?: number | null
  idUsoPresupuestal?: number | null
}

type UpdateElementoPayload = Partial<ElementoPayload>

export default class ElementoService {
  async list(scope: AccessScope) {
    return this.query().whereIn('id_stand', standIdsQuery(scope)).orderBy('id_elemento', 'asc')
  }

  async create(scope: AccessScope, payload: ElementoPayload) {
    await assertStandInScope(scope, payload.idStand)
    const item = await this.itemEnUso(scope, payload.idItem)
    await this.assertItemDelCentro(item.id, await this.centerOfStand(payload.idStand))

    try {
      const elemento = await Elemento.create({
        idItem: item.id,
        idSubcategoria: item.idSubcategoria,
        idStand: payload.idStand,
        nombre: item.nombre,
        cantidad: payload.cantidad,
        cantidadMinima: payload.cantidadMinima ?? 10,
        gramaje: payload.gramaje ?? null,
        estado: payload.estado,
        idUnidadMedida: payload.idUnidadMedida,
        codigo: payload.codigo,
        descripcionTecnica: payload.descripcion ?? null,
        marca: payload.marca ?? null,
        color: payload.color ?? null,
        idClasificacion: payload.idClasificacion ?? null,
        valorUnitarioPromedio: payload.valorUnitarioPromedio ?? null,
        porcentajeAumento: payload.porcentajeAumento ?? null,
        idCodigoEstandar: payload.idCodigoEstandar ?? null,
        idUsoPresupuestal: payload.idUsoPresupuestal ?? null,
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

    const idStand = payload.idStand ?? elemento.idStand
    await this.assertItemDelCentro(item?.id ?? elemento.idItem, await this.centerOfStand(idStand))

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
      ...(payload.cantidadMinima !== undefined && { cantidadMinima: payload.cantidadMinima }),
      ...(payload.gramaje !== undefined && { gramaje: payload.gramaje }),
      ...(payload.estado !== undefined && { estado: payload.estado }),
      ...(payload.idUnidadMedida !== undefined && { idUnidadMedida: payload.idUnidadMedida }),
      ...(payload.codigo !== undefined && { codigo: payload.codigo }),
      ...(payload.descripcion !== undefined && { descripcionTecnica: payload.descripcion }),
      ...(payload.marca !== undefined && { marca: payload.marca }),
      ...(payload.color !== undefined && { color: payload.color }),
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
      ...(payload.idUsoPresupuestal !== undefined && {
        idUsoPresupuestal: payload.idUsoPresupuestal,
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
   * The column stores a relative path. Callers pass null to detach the file.
   */
  async asignarFotografia(scope: AccessScope, id: number, ruta: string | null) {
    const elemento = await Elemento.findOrFail(id)
    await assertStandInScope(scope, elemento.idStand)
    elemento.urlFotografia = ruta

    try {
      await elemento.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo guardar la fotografía del elemento')
    }

    return this.findById(scope, id)
  }

  private async centerOfStand(idStand: number) {
    const row = await db
      .from('stand')
      .join('sub_bodega', 'sub_bodega.id_sub_bodega', 'stand.id_sub_bodega')
      .join('bodega', 'bodega.id_bodega', 'sub_bodega.id_bodega')
      .where('stand.id_stand', idStand)
      .select('bodega.id_cformacion')
      .first()

    if (!row) {
      throw new Exception('El stand no existe', { status: 422, code: 'E_STAND_NOT_FOUND' })
    }

    return Number(row.id_cformacion)
  }

  private async assertItemDelCentro(idItem: number | null, idCformacion: number) {
    if (idItem === null) {
      return
    }

    const row = await db.from('item').where('id_item', idItem).select('id_cformacion').first()

    if (!row || Number(row.id_cformacion) !== idCformacion) {
      throw new Exception('El item no pertenece al centro de formación de ese stand', {
        status: 422,
        code: 'E_ITEM_OTRO_CENTRO',
      })
    }
  }

  /**
   * Stock always hangs from a catalog item. A disabled item cannot receive
   * new elementos.
   */
  private async itemEnUso(scope: AccessScope, idItem: number) {
    const item = await Item.findOrFail(idItem)

    if (item.idCformacion !== scope.idCformacion) {
      throw new Exception('El item no pertenece a tu centro de formación', {
        status: 422,
        code: 'E_ITEM_OTRO_CENTRO',
      })
    }

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
      .preload('item', (item) =>
        item.preload('subcategoria', (subcategoria) => subcategoria.preload('categoria'))
      )
      .preload('subcategoria', (subcategoria) => subcategoria.preload('categoria'))
      .preload('stand', (stand) =>
        stand.preload('subBodega', (subBodega) => subBodega.preload('bodega'))
      )
      .preload('clasificacion')
      .preload('unidadMedida')
      .preload('codigoEstandar')
      .preload('usoPresupuestal')
  }
}
