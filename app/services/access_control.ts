import { Exception } from '@adonisjs/core/exceptions'
import db from '@adonisjs/lucid/services/db'
import User from '#models/usuario'
import { buildPermissionCatalog, type PermissionCode } from '#data/permission_catalog'

/**
 * The dump ships a profile literally named "Administrador" and the platform
 * treats it as the super user: it skips permission checks and sees every
 * training center, which is what lets it assign bodegas across centers.
 */
export const ADMIN_PROFILE_NAME = 'Administrador'

export type AccessScope = {
  isAdmin: boolean
  /** Training center the user belongs to (`usuario.id_cformacion`). */
  idCformacion: number
  /** Bodegas the admin assigned to this user through `usuario_bodega`. */
  bodegaIds: number[]
  permissions: Set<string>
}

const scopeCache = new WeakMap<User, Promise<AccessScope>>()

/**
 * Resolved once per request. `auth.getUserOrFail()` hands back the same
 * instance for the whole request, so the cache keeps this to a single query.
 */
export function resolveScope(user: User): Promise<AccessScope> {
  let pending = scopeCache.get(user)

  if (!pending) {
    pending = loadScope(user)
    scopeCache.set(user, pending)
  }

  return pending
}

async function loadScope(user: User): Promise<AccessScope> {
  const account = await User.query()
    .where('id', user.id)
    .preload('perfil', (query) => {
      query.preload('permisos', (permisosQuery) => {
        permisosQuery.where('permiso.estado', true).wherePivot('estado', true)
      })
    })
    .preload('bodegas', (query) => {
      query.wherePivot('estado', true).where('bodega.estado', true)
    })
    .firstOrFail()

  return {
    isAdmin: account.perfil?.nombre === ADMIN_PROFILE_NAME,
    idCformacion: account.idCformacion,
    bodegaIds: account.bodegas.map((bodega) => bodega.id),
    permissions: new Set(account.perfil?.permisos.map((permiso) => permiso.code) ?? []),
  }
}

export function can(scope: AccessScope, code: PermissionCode) {
  return scope.isAdmin || scope.permissions.has(code)
}

export function assertCan(scope: AccessScope, code: PermissionCode) {
  if (!can(scope, code)) {
    throw new Exception('No tienes permiso para realizar esta acción', {
      status: 403,
      code: 'E_FORBIDDEN',
    })
  }
}

export function forbidden(message: string) {
  return new Exception(message, { status: 403, code: 'E_FORBIDDEN' })
}

/**
 * Codes the frontend uses to show or hide buttons. An admin skips the checks at
 * runtime, so it gets the whole catalog instead of an empty list.
 */
export function effectivePermissionCodes(scope: AccessScope): string[] {
  if (scope.isAdmin) {
    return buildPermissionCatalog().map((definition) => definition.code)
  }

  return [...scope.permissions]
}

/**
 * Subquery with the stands reachable by the user, used to scope elementos
 * without loading ids into memory.
 */
export function standIdsQuery(scope: AccessScope) {
  return db
    .from('stand')
    .select('stand.id_stand')
    .join('sub_bodega', 'sub_bodega.id_sub_bodega', 'stand.id_sub_bodega')
    .join('bodega', 'bodega.id_bodega', 'sub_bodega.id_bodega')
    .where('bodega.id_cformacion', scope.idCformacion)
    .whereIn('sub_bodega.id_bodega', scope.bodegaIds)
}

export function categoriaIdsQuery(scope: AccessScope) {
  return db.from('categoria').select('id_categoria').where('id_cformacion', scope.idCformacion)
}

/**
 * Items hang from a subcategory, which hangs from a category of the user's
 * training center.
 */
export function subcategoriaIdsQuery(scope: AccessScope) {
  return db
    .from('subcategoria')
    .select('id_subcategoria')
    .whereIn('id_categoria', categoriaIdsQuery(scope))
}

export async function assertBodegaInScope(scope: AccessScope, idBodega: number) {
  if (scope.isAdmin) {
    return
  }

  if (!scope.bodegaIds.includes(idBodega)) {
    throw forbidden('Esa bodega no está asignada a tu usuario')
  }

  const bodega = await db
    .from('bodega')
    .select('id_cformacion')
    .where('id_bodega', idBodega)
    .first()

  if (!bodega || Number(bodega.id_cformacion) !== scope.idCformacion) {
    throw forbidden('Esa bodega no pertenece a tu centro de formación')
  }
}

export async function assertStandInScope(scope: AccessScope, idStand: number) {
  if (scope.isAdmin) {
    return
  }

  const stand = await db
    .from('stand')
    .select('stand.id_stand')
    .join('sub_bodega', 'sub_bodega.id_sub_bodega', 'stand.id_sub_bodega')
    .join('bodega', 'bodega.id_bodega', 'sub_bodega.id_bodega')
    .where('stand.id_stand', idStand)
    .where('bodega.id_cformacion', scope.idCformacion)
    .whereIn('sub_bodega.id_bodega', scope.bodegaIds)
    .first()

  if (!stand) {
    throw forbidden('Ese stand no pertenece a una bodega de tu centro de formación')
  }
}

export async function assertSubBodegaInScope(scope: AccessScope, idSubBodega: number) {
  if (scope.isAdmin) {
    return
  }

  const subBodega = await db
    .from('sub_bodega')
    .select('sub_bodega.id_sub_bodega')
    .join('bodega', 'bodega.id_bodega', 'sub_bodega.id_bodega')
    .where('sub_bodega.id_sub_bodega', idSubBodega)
    .where('bodega.id_cformacion', scope.idCformacion)
    .whereIn('sub_bodega.id_bodega', scope.bodegaIds)
    .first()

  if (!subBodega) {
    throw forbidden('Esa sub-bodega no pertenece a una bodega de tu centro de formación')
  }
}

export async function assertCategoriaInScope(scope: AccessScope, idCategoria: number) {
  if (scope.isAdmin) {
    return
  }

  const categoria = await db
    .from('categoria')
    .select('id_categoria')
    .where('id_categoria', idCategoria)
    .where('id_cformacion', scope.idCformacion)
    .first()

  if (!categoria) {
    throw forbidden('Esa categoría no pertenece a tu centro de formación')
  }
}

export async function assertSubcategoriaInScope(scope: AccessScope, idSubcategoria: number) {
  if (scope.isAdmin) {
    return
  }

  const subcategoria = await db
    .from('subcategoria')
    .select('id_subcategoria')
    .where('id_subcategoria', idSubcategoria)
    .whereIn('id_categoria', categoriaIdsQuery(scope))
    .first()

  if (!subcategoria) {
    throw forbidden('Esa subcategoría no pertenece a tu centro de formación')
  }
}
