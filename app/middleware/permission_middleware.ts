import { assertCan, resolveScope } from '#services/access_control'
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
  async handle(ctx: HttpContext, next: NextFn, code: PermissionCode) {
    const scope = await resolveScope(ctx.auth.getUserOrFail())
    
    // Los administradores pueden generar reportes automáticamente
    if (scope.isAdmin && code === 'reporte.generar') {
      return next()
    }
    
    assertCan(scope, code)

    return next()
  }
}
