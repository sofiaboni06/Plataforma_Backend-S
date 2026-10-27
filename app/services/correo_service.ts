import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import logger from '@adonisjs/core/services/logger'
import env from '#start/env'
import nodemailer from 'nodemailer'

const logos = join(dirname(fileURLToPath(import.meta.url)), '../../resources/mail')

function transporte() {
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

export function correoConfigurado() {
  return transporte() !== null
}

function textoPlano(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function parrafos(texto: string) {
  return texto
    .split(/(?<=\.)\s+/)
    .map((parte) => parte.trim())
    .filter(Boolean)
    .map(
      (parte) =>
        `<p style="margin:0 0 14px;font-size:16px;line-height:1.65;color:#1c3d30">${textoPlano(parte)}</p>`
    )
    .join('')
}

function plantilla(subject: string, text: string) {
  return `<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:0;background:#eef4f0">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef4f0;padding:28px 12px">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden">
          <tr>
            <td style="padding:18px 28px 14px;font-family:Arial,sans-serif">
              <img src="cid:logo-sena" alt="SENA" height="48" style="height:48px;width:auto;vertical-align:middle" />
              <img src="cid:logo-fabrica" alt="Fábrica de Software" height="64" style="height:64px;width:auto;vertical-align:middle;margin-left:18px" />
              <img src="cid:logo-sigma" alt="Sigma" height="52" style="height:52px;width:auto;vertical-align:middle;margin-left:18px" />
            </td>
          </tr>
          <tr>
            <td style="background:#005c3b;padding:18px 28px">
              <div style="font-family:Arial,sans-serif;font-size:22px;line-height:1.35;font-weight:700;color:#ffffff">${textoPlano(subject)}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 28px 8px;font-family:Arial,sans-serif">${parrafos(text)}</td>
          </tr>
          <tr>
            <td style="padding:8px 28px 24px;font-family:Arial,sans-serif;font-size:12px;line-height:1.5;color:#6b7f76">
              Aviso automático de Sigma. No hace falta responder este correo.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/**
 * Envía un correo con la cuenta SMTP de las variables MAIL_*.
 * Si no hay cuenta configurada, no falla el flujo que lo llamó.
 */
export async function enviarCorreo(input: { to: string; subject: string; text: string }) {
  const transporter = transporte()

  if (!transporter) {
    logger.warn('Correo no configurado: faltan MAIL_HOST/MAIL_USERNAME/MAIL_PASSWORD')
    return false
  }

  const fromName = env.get('MAIL_FROM_NAME') ?? 'Sigma'
  const fromAddress = env.get('MAIL_FROM') ?? env.get('MAIL_USERNAME')

  await transporter.sendMail({
    from: `"${fromName}" <${fromAddress}>`,
    to: input.to,
    subject: input.subject.slice(0, 200),
    text: input.text,
    html: plantilla(input.subject.slice(0, 200), input.text),
    attachments: [
      {
        filename: 'logo-sena.jpg',
        path: join(logos, 'logo-sena.jpg'),
        cid: 'logo-sena',
      },
      {
        filename: 'logo-fabrica-completo.png',
        path: join(logos, 'logo-fabrica-completo.png'),
        cid: 'logo-fabrica',
      },
      {
        filename: 'logo-sigma.png',
        path: join(logos, 'logo-sigma.png'),
        cid: 'logo-sigma',
      },
    ],
  })

  return true
}
