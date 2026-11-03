import env from '#start/env'
import { Exception } from '@adonisjs/core/exceptions'

const VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify'

type VerifyResponse = {
  success?: boolean
  'error-codes'?: string[]
}

export default class CaptchaService {
  get enabled() {
    return env.get('CAPTCHA_ENABLED', true)
  }

  async verify(token: string | undefined, ip: string | null) {
    if (!this.enabled) return

    if (!token) {
      throw new Exception('Completa la verificación captcha', {
        status: 422,
        code: 'E_CAPTCHA_REQUIRED',
      })
    }

    const secret = env.get('RECAPTCHA_SECRET_KEY')
    if (!secret) {
      throw new Exception('El captcha no está configurado en el servidor', {
        status: 500,
        code: 'E_CAPTCHA_CONFIG',
      })
    }

    const body = new URLSearchParams({ secret, response: token })
    if (ip) body.set('remoteip', ip)

    let outcome: VerifyResponse
    try {
      const response = await fetch(VERIFY_URL, {
        method: 'POST',
        body,
        signal: AbortSignal.timeout(5000),
      })
      outcome = (await response.json()) as VerifyResponse
    } catch {
      // Si Google no responde, se rechaza el login: nunca se deja pasar sin verificar.
      throw new Exception('No se pudo validar el captcha, inténtalo de nuevo', {
        status: 503,
        code: 'E_CAPTCHA_UNAVAILABLE',
      })
    }

    if (!outcome.success) {
      const codes = outcome['error-codes'] ?? []

      // Llave secreta mal copiada: es un error de configuración, no del usuario.
      if (codes.includes('invalid-input-secret') || codes.includes('missing-input-secret')) {
        throw new Exception('El captcha no está configurado correctamente en el servidor', {
          status: 500,
          code: 'E_CAPTCHA_CONFIG',
        })
      }

      throw new Exception('La verificación captcha falló, inténtalo de nuevo', {
        status: 422,
        code: 'E_CAPTCHA_FAILED',
      })
    }
  }
}