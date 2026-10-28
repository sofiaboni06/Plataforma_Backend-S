import { Exception } from '@adonisjs/core/exceptions'
import User from '#models/usuario'
import { rethrowDatabaseError } from '#services/database_error'

type ProfileUpdate = {
  nombres?: string
  apellidos?: string
  tipoDocumento?: string
  numeroDocumento?: string
  email?: string
}

export default class ProfileService {
  async load(user: User) {
    return user.loadProfileRelations()
  }

  async update(user: User, payload: ProfileUpdate) {
    if (payload.email) {
      const taken = await User.query().where('email', payload.email).whereNot('id', user.id).first()
      if (taken) {
        throw new Exception('El correo ya está en uso', {
          status: 422,
          code: 'E_VALIDATION_ERROR',
        })
      }
    }

    if (payload.numeroDocumento) {
      const taken = await User.query()
        .where('numeroDocumento', payload.numeroDocumento)
        .whereNot('id', user.id)
        .first()
      if (taken) {
        throw new Exception('El documento ya está en uso', {
          status: 422,
          code: 'E_VALIDATION_ERROR',
        })
      }
    }

    user.merge({
      ...(payload.nombres !== undefined ? { nombres: payload.nombres } : {}),
      ...(payload.apellidos !== undefined ? { apellidos: payload.apellidos } : {}),
      ...(payload.tipoDocumento !== undefined ? { tipoDocumento: payload.tipoDocumento } : {}),
      ...(payload.numeroDocumento !== undefined
        ? { numeroDocumento: payload.numeroDocumento }
        : {}),
      ...(payload.email !== undefined ? { email: payload.email } : {}),
    })
    await user.save()
    return this.load(user)
  }

  async changePassword(user: User, currentPassword: string, nextPassword: string) {
    const matches = await user.verifyPassword(currentPassword)
    if (!matches) {
      throw new Exception('La contraseña actual no es correcta', {
        status: 422,
        code: 'E_INVALID_CURRENT_PASSWORD',
      })
    }

    user.password = nextPassword
    await user.save()
    return this.load(user)
  }

  async asignarFotografia(user: User, ruta: string | null) {
    user.urlFotografia = ruta

    try {
      await user.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo guardar la fotografía del perfil')
    }

    return this.load(user)
  }
}
