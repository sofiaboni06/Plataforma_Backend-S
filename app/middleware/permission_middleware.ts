import { assertCan, resolveScope } from '#services/access_control'
import type { PermissionCode } from '#data/permission_catalog'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Blocks the route unless the profile of the logged in user was granted the
 * permission. Runs after `auth` and `account`, so the user is already resolved.
 */
export default class PermissionMiddleware {
  async handle(ctx: HttpContext, next: NextFn, code: PermissionCode) {
    const scope = await resolveScope(ctx.auth.getUserOrFail())
    assertCan(scope, code)

    return next()
  }
}
