import User from '#models/usuario'
import { loginValidator } from '#validators/usuario'
import type { HttpContext } from '@adonisjs/core/http'
import UserTransformer from '#transformers/user_transformer'
import { Exception } from '@adonisjs/core/exceptions'
import ProfileService from '#services/profile_service'
import { effectivePermissionCodes, resolveScope } from '#services/access_control'

export default class AccessTokensController {
  async store({ request, serialize }: HttpContext) {
    const payload = await request.validateUsing(loginValidator)
    const identifier = payload.usuario ?? payload.email

    if (!identifier) {
      throw new Exception('Ingresa tu correo o documento', {
        status: 422,
        code: 'E_VALIDATION_ERROR',
      })
    }

    const user = await User.verifyCredentials(identifier, payload.password)
    if (!user.estado) {
      throw new Exception('La cuenta está inactiva', {
        status: 403,
        code: 'E_ACCOUNT_INACTIVE',
      })
    }

    const profile = await new ProfileService().load(user)
    const scope = await resolveScope(user)
    const token = await User.accessTokens.create(user)

    return serialize({
      user: UserTransformer.transform(profile, effectivePermissionCodes(scope), scope.isAdmin),
      token: token.value!.release(),
    })
  }

  async destroy({ auth }: HttpContext) {
    const user = auth.getUserOrFail()
    if (user.currentAccessToken) {
      await User.accessTokens.delete(user, user.currentAccessToken.identifier)
    }

    return {
      message: 'Logged out successfully',
    }
  }
}
