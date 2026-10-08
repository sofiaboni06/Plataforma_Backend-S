import { Exception } from '@adonisjs/core/exceptions'
import db from '@adonisjs/lucid/services/db'
import Item from '#models/item'
import Subcategoria from '#models/subcategoria'
import {
  assertCan,
  assertSubcategoriaInScope,
  forbidden,
  type AccessScope,
} from '#services/access_control'
import { rethrowDatabaseError } from '#services/database_error'

export type ItemPayload = {
  idSubcategoria?: number
  nombre?: string
  descripcion?: string | null
  estado?: boolean
}

export default class ItemService {
  async list(
    scope: AccessScope,
    options: {
      page: number
      perPage: number
      idSubcategoria?: number
      search?: string
      estado?: boolean
    }
  ) {
    const query = Item.query()
      .preload('subcategoria', (subcategoria) => subcategoria.preload('categoria'))
      .orderBy('id_item', 'asc')
      .where('id_cformacion', scope.idCformacion)

    if (options.idSubcategoria) {
      await assertSubcategoriaInScope(scope, options.idSubcategoria)
      query.where('id_subcategoria', options.idSubcategoria)
    }

    if (options.search) {
      const term = `%${options.search}%`
      query.where((builder) => {
        builder.whereILike('nombre', term).orWhereILike('descripcion', term)
      })
    }

    if (options.estado === undefined) {
      query.where((builder) => builder.where('estado', true).orWhereNull('estado'))
    } else {
      query.where('estado', options.estado)
    }

    return query.paginate(options.page, options.perPage)
  }

  async show(scope: AccessScope, id: number) {
    const item = await this.query().where('id_item', id).firstOrFail()
    this.assertDelCentro(scope, item)

    return item
  }

  async create(
    scope: AccessScope,
    payload: Required<Pick<ItemPayload, 'idSubcategoria' | 'nombre'>> &
      Pick<ItemPayload, 'descripcion' | 'estado'>
  ) {
    await assertSubcategoriaInScope(scope, payload.idSubcategoria)
    await this.assertSubcategoriaActiva(payload.idSubcategoria)

    if (payload.estado === false) {
      assertCan(scope, 'item.eliminar')
    }

    try {
      const item = await Item.create({
        idSubcategoria: payload.idSubcategoria,
        idCformacion: scope.idCformacion,
        nombre: payload.nombre,
        descripcion: payload.descripcion ?? null,
        estado: payload.estado ?? true,
      })

      return this.show(scope, item.id)
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo crear el item')
    }
  }

  async update(scope: AccessScope, id: number, payload: ItemPayload) {
    const item = await Item.findOrFail(id)
    this.assertDelCentro(scope, item)

    if (payload.idSubcategoria !== undefined && payload.idSubcategoria !== item.idSubcategoria) {
      await assertSubcategoriaInScope(scope, payload.idSubcategoria)
      await this.assertSubcategoriaActiva(payload.idSubcategoria)
    }

    if (payload.estado !== undefined && payload.estado !== item.estado) {
      assertCan(scope, 'item.eliminar')
    }

    item.merge({
      ...(payload.idSubcategoria !== undefined ? { idSubcategoria: payload.idSubcategoria } : {}),
      ...(payload.nombre !== undefined ? { nombre: payload.nombre } : {}),
      ...(payload.descripcion !== undefined ? { descripcion: payload.descripcion } : {}),
      ...(payload.estado !== undefined ? { estado: payload.estado } : {}),
    })

    try {
      await item.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo actualizar el item')
    }

    // Los elementos siguen la subcategoría del ítem, pero su nombre es propio:
    // renombrar el ítem no les cambia el nombre.
    if (payload.idSubcategoria !== undefined) {
      await db.from('elemento').where('id_item', item.id).update({
        id_subcategoria: item.idSubcategoria,
      })
    }

    return this.show(scope, id)
  }

  /**
   * Soft delete. An item with stock still in use stays in the catalog until
   * those elementos are disabled.
   */
  async remove(scope: AccessScope, id: number) {
    const item = await Item.findOrFail(id)
    this.assertDelCentro(scope, item)

    if (item.estado === false) {
      throw new Exception('El item ya está deshabilitado', {
        status: 409,
        code: 'E_ALREADY_DISABLED',
      })
    }

    await this.assertNoActiveElementos(id)

    item.estado = false

    try {
      await item.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo deshabilitar el item')
    }

    return { message: 'Item deshabilitado correctamente' }
  }

  private assertDelCentro(scope: AccessScope, item: Item) {
    if (item.idCformacion !== scope.idCformacion) {
      throw forbidden('Ese item no pertenece a tu centro de formación')
    }
  }

  private query() {
    return Item.query().preload('subcategoria', (subcategoria) => subcategoria.preload('categoria'))
  }

  private async assertSubcategoriaActiva(idSubcategoria: number) {
    const subcategoria = await Subcategoria.findOrFail(idSubcategoria)

    if (subcategoria.estado === false) {
      throw new Exception('La subcategoría está deshabilitada', {
        status: 409,
        code: 'E_SUBCATEGORIA_DISABLED',
      })
    }
  }

  private async assertNoActiveElementos(id: number) {
    const rows = await db
      .from('elemento')
      .where('id_item', id)
      .where('estado', true)
      .count('* as total')

    if (Number(rows[0].total) > 0) {
      throw new Exception(
        'No se puede deshabilitar el item porque tiene elementos activos. Deshabilítalos primero.',
        { status: 409, code: 'E_ITEM_HAS_ELEMENTOS' }
      )
    }
  }
}
