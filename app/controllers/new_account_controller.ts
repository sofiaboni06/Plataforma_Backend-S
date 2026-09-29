import User from '#models/usuario'
import { signupValidator } from '#validators/usuario'
import type { HttpContext } from '@adonisjs/core/http'
import UserTransformer from '#transformers/user_transformer'
import ProfileService from '#services/profile_service'
import { effectivePermissionCodes, resolveScope } from '#services/access_control'

export default class NewAccountController {
  async store({ request, serialize }: HttpContext) {
    const payload = await request.validateUsing(signupValidator)

    const user = await User.create({
      nombres: payload.nombres,
      apellidos: payload.apellidos,
      tipoDocumento: payload.tipoDocumento,
      numeroDocumento: payload.numeroDocumento,
      email: payload.email,
      password: payload.password,
      idPerfil: payload.idPerfil,
      idCformacion: payload.idCformacion,
      estado: true,
    })

    const profile = await new ProfileService().load(user)
    const scope = await resolveScope(user)
    const token = await User.accessTokens.create(user)

    return serialize({
      user: UserTransformer.transform(profile, effectivePermissionCodes(scope), scope.isAdmin),
      token: token.value!.release(),
    })
  }
}
