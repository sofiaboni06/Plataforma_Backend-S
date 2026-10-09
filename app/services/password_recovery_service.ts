import { randomInt } from 'node:crypto'
import { DateTime } from 'luxon'
import { Exception } from '@adonisjs/core/exceptions'
import encryption from '@adonisjs/core/services/encryption'
import hash from '@adonisjs/core/services/hash'
import logger from '@adonisjs/core/services/logger'
import { generateSecret, generateURI, verify as verifyTotp } from 'otplib'
import env from '#start/env'
import User from '#models/usuario'
import PasswordResetCode from '#models/password_reset_code'
import nodemailer from 'nodemailer'

type Mailer = ReturnType<typeof nodemailer.createTransport>

const CODE_MINUTES = 10
const RESET_TOKEN_MINUTES = 15

/**
 * Misma respuesta exista o no la cuenta: no se revela quién está registrado,
 * y el código nunca viaja en la respuesta, en ningún entorno.
 */
const RECOVER_MESSAGE = 'Si el correo corresponde a una cuenta, te enviamos un código.'

export default class PasswordRecoveryService {
  private mailer(): Mailer | null {
    const host = env.get('MAIL_HOST')
    const username = env.get('MAIL_USERNAME')
    const password = env.get('MAIL_PASSWORD')

    if (!host || !username || !password) return null

    return nodemailer.createTransport({
      host,
      port: env.get('MAIL_PORT') ?? 465,
      secure: env.get('MAIL_SECURE') ?? true,
      auth: { user: username, pass: password },
    })
  }

  /** En desarrollo y pruebas se puede trabajar sin correo; fuera de ahí no. */
  private assertMailConfigured() {
    if (this.mailer()) return

    const nodeEnv = env.get('NODE_ENV')
    if (nodeEnv === 'test' || nodeEnv === 'development') return

    throw new Exception('El servicio de correo no está configurado', {
      status: 503,
      code: 'E_MAIL_NOT_CONFIGURED',
    })
  }

  private async sendCode(email: string, code: string) {
    const transporter = this.mailer()

    if (!transporter) {
      // Solo nombres de variables: nunca valores, correos ni códigos.
      logger.warn('Correo no configurado: faltan MAIL_HOST/MAIL_USERNAME/MAIL_PASSWORD')
      return
    }

    try {
      await this.deliver(transporter, email, code)
    } catch {
      // Sin detalles: el error de SMTP puede traer credenciales o el destinatario.
      logger.error('No se pudo enviar el correo de recuperación')
    }
  }

  private async deliver(transporter: Mailer, email: string, code: string) {
    await transporter.sendMail({
      from: `"${env.get('MAIL_FROM_NAME') ?? 'Plataforma SENA'}" <${env.get('MAIL_FROM') ?? env.get('MAIL_USERNAME')}>`,
      to: email,
      subject: 'Código para recuperar tu contraseña',
      text: `Tu código de recuperación es ${code}. Este código vence en ${CODE_MINUTES} minutos. Si no solicitaste este cambio, ignora este mensaje.`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#073b2a;max-width:560px;margin:auto">
          <h2 style="color:#005c3b">Recuperación de contraseña</h2>
          <p>Recibimos una solicitud para cambiar la contraseña de tu cuenta.</p>
          <p style="font-size:30px;font-weight:700;letter-spacing:8px;text-align:center;color:#00a651">${code}</p>
          <p>Este código vence en <strong>${CODE_MINUTES} minutos</strong>.</p>
          <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
        </div>
      `,
    })
  }

  private async findUser(email: string) {
    return User.query().whereRaw('LOWER(correo) = ?', [email.toLowerCase()]).first()
  }

  private createResetToken(resetId: number, userId: number) {
    return encryption.encrypt(
      { resetId, userId },
      { expiresIn: `${RESET_TOKEN_MINUTES}m`, purpose: 'password-reset' }
    )
  }

  async request(email: string) {
    // Antes de buscar la cuenta: si falta el correo, la respuesta es igual para todos.
    this.assertMailConfigured()

    const normalizedEmail = email.trim().toLowerCase()
    const user = await this.findUser(normalizedEmail)

    if (!user || !user.estado) {
      return { message: RECOVER_MESSAGE }
    }

    const now = DateTime.now()

    await PasswordResetCode.query()
      .where('id_usuario', user.id)
      .whereNull('usado_en')
      .update({ usado_en: now })

    const code = String(randomInt(100000, 1000000))
    const codeHash = await hash.make(code)

    await PasswordResetCode.create({
      idUsuario: user.id,
      correo: normalizedEmail,
      codigoHash: codeHash,
      expiraEn: now.plus({ minutes: CODE_MINUTES }),
      usadoEn: null,
      verificadoEn: null,
    })

    await this.sendCode(normalizedEmail, code)

    return { message: RECOVER_MESSAGE }
  }

  async verifyCode(email: string, code: string) {
    const normalizedEmail = email.trim().toLowerCase()

    const user = await this.findUser(normalizedEmail)

    if (!user || !user.estado) {
      throw new Exception('El código no es válido o ya expiró', {
        status: 422,
        code: 'E_INVALID_RECOVERY_CODE',
      })
    }

    const reset = await PasswordResetCode.query()
      .where('id_usuario', user.id)
      .where('correo', normalizedEmail)
      .whereNull('usado_en')
      .where('expira_en', '>', DateTime.now().toSQL()!)
      .orderBy('id', 'desc')
      .first()

    if (!reset) {
      throw new Exception('El código no es válido o ya expiró', {
        status: 422,
        code: 'E_INVALID_RECOVERY_CODE',
      })
    }

    const isValidCode = await hash.verify(reset.codigoHash, code)

    if (!isValidCode) {
      throw new Exception('El código no es válido o ya expiró', {
        status: 422,
        code: 'E_INVALID_RECOVERY_CODE',
      })
    }

    reset.verificadoEn = DateTime.now()
    await reset.save()

    return {
      message: 'Código verificado correctamente.',
      resetToken: this.createResetToken(reset.id, user.id),
    }
  }

  async verifyGoogle(email: string, code: string) {
    const normalizedEmail = email.trim().toLowerCase()
    const user = await this.findUser(normalizedEmail)

    if (
      !user ||
      !user.estado ||
      !user.googleAuthenticatorEnabled ||
      !user.googleAuthenticatorSecret
    ) {
      throw new Exception('No se pudo validar Google Authenticator', {
        status: 422,
        code: 'E_INVALID_AUTHENTICATOR',
      })
    }

    const reset = await PasswordResetCode.query()
      .where('id_usuario', user.id)
      .where('correo', normalizedEmail)
      .whereNull('usado_en')
      .whereNotNull('verificado_en')
      .where('expira_en', '>', DateTime.now().toSQL()!)
      .orderBy('id', 'desc')
      .first()

    if (!reset) {
      throw new Exception('La sesión de recuperación no es válida o expiró', {
        status: 422,
        code: 'E_INVALID_RECOVERY_SESSION',
      })
    }

    const secret = encryption.decrypt(user.googleAuthenticatorSecret, 'google-authenticator')
    if (typeof secret !== 'string') {
      throw new Exception('No se pudo validar Google Authenticator', {
        status: 500,
        code: 'E_INVALID_AUTHENTICATOR_SECRET',
      })
    }

    const result = await verifyTotp({ secret, token: code })
    if (!result.valid) {
      throw new Exception('El código de Google Authenticator no es válido', {
        status: 422,
        code: 'E_INVALID_AUTHENTICATOR',
      })
    }

    return {
      message: 'Verificación completada.',
      resetToken: this.createResetToken(reset.id, user.id),
    }
  }

  async resetPassword(resetToken: string, password: string) {
    const payload = encryption.decrypt(resetToken, 'password-reset') as {
      resetId: number
      userId: number
    } | null

    if (!payload?.resetId || !payload.userId) {
      throw new Exception('El enlace de recuperación no es válido o expiró', {
        status: 422,
        code: 'E_INVALID_RESET_TOKEN',
      })
    }

    const reset = await PasswordResetCode.query()
      .where('id', payload.resetId)
      .where('id_usuario', payload.userId)
      .whereNull('usado_en')
      .whereNotNull('verificado_en')
      .where('expira_en', '>', DateTime.now().toSQL()!)
      .first()

    if (!reset) {
      throw new Exception('El enlace de recuperación no es válido o expiró', {
        status: 422,
        code: 'E_INVALID_RESET_TOKEN',
      })
    }

    const user = await User.find(payload.userId)
    if (!user || !user.estado) {
      throw new Exception('La cuenta no está disponible', {
        status: 403,
        code: 'E_ACCOUNT_INACTIVE',
      })
    }

    user.password = password
    await user.save()

    reset.usadoEn = DateTime.now()
    await reset.save()

    return { message: 'Contraseña actualizada correctamente.' }
  }

  async setupGoogleAuthenticator(user: User) {
    const secret = generateSecret()
    const uri = generateURI({
      issuer: 'Plataforma SENA',
      label: user.email,
      secret,
    })

    user.googleAuthenticatorSecret = encryption.encrypt(secret, {
      purpose: 'google-authenticator',
    })
    user.googleAuthenticatorEnabled = false
    await user.save()

    return { secret, uri }
  }

  async confirmGoogleAuthenticator(user: User, code: string) {
    if (!user.googleAuthenticatorSecret) {
      throw new Exception('Primero debes iniciar la configuración de Google Authenticator', {
        status: 422,
        code: 'E_AUTHENTICATOR_NOT_CONFIGURED',
      })
    }

    const secret = encryption.decrypt(user.googleAuthenticatorSecret, 'google-authenticator')
    if (typeof secret !== 'string') {
      throw new Exception('No se pudo leer la configuración de Google Authenticator', {
        status: 500,
        code: 'E_INVALID_AUTHENTICATOR_SECRET',
      })
    }

    const result = await verifyTotp({ secret, token: code })
    if (!result.valid) {
      throw new Exception('El código de Google Authenticator no es válido', {
        status: 422,
        code: 'E_INVALID_AUTHENTICATOR',
      })
    }

    user.googleAuthenticatorEnabled = true
    await user.save()

    return { message: 'Google Authenticator quedó activado correctamente.' }
  }
}
