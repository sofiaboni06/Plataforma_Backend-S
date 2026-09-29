import ProfileService from '#services/profile_service'
import UserTransformer from '#transformers/user_transformer'
import { effectivePermissionCodes, resolveScope } from '#services/access_control'
import { changePasswordValidator, updateProfileValidator } from '#validators/usuario'
import type { HttpContext } from '@adonisjs/core/http'
import type User from '#models/usuario'

export default class ProfileController {
  async show({ auth, serialize }: HttpContext) {
    const account = auth.getUserOrFail()
    const user = await new ProfileService().load(account)
    return serialize(await this.present(account, user))
  }

  async update({ auth, request, serialize }: HttpContext) {
    const account = auth.getUserOrFail()
    const payload = await request.validateUsing(updateProfileValidator)
    const user = await new ProfileService().update(account, payload)
    return serialize(await this.present(account, user))
  }

  async changePassword({ auth, request }: HttpContext) {
    const account = auth.getUserOrFail()
    const payload = await request.validateUsing(changePasswordValidator)
    await new ProfileService().changePassword(account, payload.currentPassword, payload.password)

    return {
      message: 'Contraseña actualizada',
    }
  }

  private async present(account: User, user: User) {
    const scope = await resolveScope(account)
    return UserTransformer.transform(user, effectivePermissionCodes(scope), scope.isAdmin)
  }
}
