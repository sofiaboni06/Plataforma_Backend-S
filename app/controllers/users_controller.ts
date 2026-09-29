import UsuarioService from '#services/usuario_service'
import AdminUserTransformer from '#transformers/admin_user_transformer'
import {
  assignBodegasValidator,
  createUserValidator,
  updateUserValidator,
} from '#validators/usuario'
import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

export default class UsersController {
  async options({ serialize }: HttpContext) {
    return serialize(await new UsuarioService().options())
  }

  async index({ serialize }: HttpContext) {
    const users = await new UsuarioService().list()
    return serialize(AdminUserTransformer.transform(users))
  }

  async show({ params, serialize }: HttpContext) {
    const user = await new UsuarioService().show(Number(params.id))
    return serialize(AdminUserTransformer.transform(user))
  }

  async store({ request, serialize }: HttpContext) {
    const payload = await request.validateUsing(createUserValidator)
    const user = await new UsuarioService().create({
      nombres: payload.nombres,
      apellidos: payload.apellidos,
      tipoDocumento: payload.tipoDocumento,
      numeroDocumento: payload.numeroDocumento,
      email: payload.email,
      password: payload.password,
      idPerfil: payload.idPerfil,
      idCformacion: payload.idCformacion,
      bodegaIds: payload.bodegaIds,
    })
    return serialize(AdminUserTransformer.transform(user))
  }

  async update({ auth, params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(updateUserValidator)

    if (payload.password || payload.passwordConfirmation) {
      if (payload.password !== payload.passwordConfirmation) {
        throw new Exception('La confirmación de la contraseña no coincide', {
          status: 422,
          code: 'E_VALIDATION_ERROR',
        })
      }
    }

    const actor = auth.getUserOrFail()
    const user = await new UsuarioService().update(
      Number(params.id),
      {
        nombres: payload.nombres,
        apellidos: payload.apellidos,
        tipoDocumento: payload.tipoDocumento,
        numeroDocumento: payload.numeroDocumento,
        email: payload.email,
        password: payload.password,
        idPerfil: payload.idPerfil,
        idCformacion: payload.idCformacion,
        active: payload.active,
      },
      actor.id
    )
    return serialize(AdminUserTransformer.transform(user))
  }

  async syncBodegas({ params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(assignBodegasValidator)
    const user = await new UsuarioService().syncBodegas(Number(params.id), payload.bodegaIds)
    return serialize(AdminUserTransformer.transform(user))
  }
}
