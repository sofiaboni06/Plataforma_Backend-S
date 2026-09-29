import { Exception } from '@adonisjs/core/exceptions'
import { resolveScope } from '#services/access_control'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class AdminMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const scope = await resolveScope(ctx.auth.getUserOrFail())

    if (!scope.isAdmin) {
      throw new Exception('Solo un administrador puede hacer esta acción', {
        status: 403,
        code: 'E_FORBIDDEN',
      })
    }

    return next()
  }
}
