import type { HttpContext } from '@adonisjs/core/http'
import PasswordRecoveryService from '#services/password_recovery_service'
import {
  confirmAuthenticatorValidator,
  recoverRequestValidator,
  recoverResetValidator,
  recoverVerifyValidator,
} from '#validators/password_recovery'

export default class PasswordRecoveryController {
  private service = new PasswordRecoveryService()

  async request({ request }: HttpContext) {
    const payload = await request.validateUsing(recoverRequestValidator)
    return this.service.request(payload.email)
  }

  async verify({ request }: HttpContext) {
    const payload = await request.validateUsing(recoverVerifyValidator)
    return this.service.verifyCode(payload.email, payload.code)
  }

  async verifyGoogle({ request }: HttpContext) {
    const payload = await request.validateUsing(recoverVerifyValidator)
    return this.service.verifyGoogle(payload.email, payload.code)
  }

  async reset({ request }: HttpContext) {
    const payload = await request.validateUsing(recoverResetValidator)
    return this.service.resetPassword(payload.resetToken, payload.password)
  }

  async setupGoogle({ auth }: HttpContext) {
    const user = auth.getUserOrFail()
    return this.service.setupGoogleAuthenticator(user)
  }

  async confirmGoogle({ request, auth }: HttpContext) {
    const payload = await request.validateUsing(confirmAuthenticatorValidator)
    const user = auth.getUserOrFail()
    return this.service.confirmGoogleAuthenticator(user, payload.code)
  }

  async disableGoogle({ auth }: HttpContext) {
    const user = auth.getUserOrFail()
    user.googleAuthenticatorEnabled = false
    user.googleAuthenticatorSecret = null
    await user.save()

    return { message: 'Google Authenticator fue desactivado.' }
  }
}
