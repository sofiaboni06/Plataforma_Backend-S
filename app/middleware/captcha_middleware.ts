import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import CaptchaService from '#services/captcha_service'

export default class CaptchaMiddleware {
  async handle({ request }: HttpContext, next: NextFn) {
    await new CaptchaService().verify(request.input('captchaToken'), request.ip())
    return next()
  }
}