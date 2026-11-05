import { can, resolveScope } from '#services/access_control'
import { Exception } from '@adonisjs/core/exceptions'
import type { PermissionCode } from '#data/permission_catalog'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Blocks the route unless the profile of the logged in user was granted the
 * permission. Runs after `auth` and `account`, so the user is already resolved.
 * 
 * Special case: 'reporte.generar' is always allowed for admins, like other
 * inventory permissions that are not center-only.
 */
export default class PermissionMiddleware {
  async handle(ctx: HttpContext, next: NextFn, code: PermissionCode | PermissionCode[]) {
    const scope = await resolveScope(ctx.auth.getUserOrFail())
    const codes = Array.isArray(code) ? code : [code]

    if (scope.isAdmin && codes.includes('reporte.generar')) {
      return next()
    }

    if (!codes.some((item) => can(scope, item))) {
      throw new Exception('No tienes permiso para realizar esta acción', {
        status: 403,
        code: 'E_FORBIDDEN',
      })
    }

    return next()
  }
}
