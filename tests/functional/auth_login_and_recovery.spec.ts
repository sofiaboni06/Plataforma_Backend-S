import { test } from '@japa/runner'
import hash from '@adonisjs/core/services/hash'
import db from '@adonisjs/lucid/services/db'
import User from '#models/usuario'

/**
 * Recuperar contraseña: POST /auth/recover → /auth/recover/verify → /auth/recover/reset.
 * El código nunca viaja en la respuesta. Para probar el flujo completo, el test
 * reemplaza el hash del último código por uno conocido directamente en la base.
 */

const MENSAJE = 'Si el correo corresponde a una cuenta, te enviamos un código.'
const CORREO = 'carlos@correo.com'

async function fijarCodigo(correo: string, codigo: string) {
  const fila = await db
    .from('password_reset_codes')
    .where('correo', correo)
    .whereNull('usado_en')
    .orderBy('id', 'desc')
    .first()

  await db
    .from('password_reset_codes')
    .where('id', fila.id)
    .update({ codigo_hash: await hash.make(codigo) })
}

test.group('Password recovery', () => {
  test('accepts a recover request even if the email does not exist', async ({ client, assert }) => {
    const response = await client.post('/api/v1/auth/recover').json({
      email: 'nadie@correo.com',
    })

    response.assertStatus(200)
    assert.deepEqual(response.body(), { message: MENSAJE })
  })

  test('does not include a reset code in the recover response', async ({ client, assert }) => {
    const response = await client.post('/api/v1/auth/recover').json({ email: CORREO })

    response.assertStatus(200)
    // Igual que para un correo que no existe: solo el mensaje, sin código ni debugCode.
    assert.deepEqual(response.body(), { message: MENSAJE })
  })

  test('rejects an invalid recovery code', async ({ client }) => {
    await client.post('/api/v1/auth/recover').json({ email: CORREO })

    const response = await client.post('/api/v1/auth/recover/verify').json({
      email: CORREO,
      code: '000000',
    })

    response.assertStatus(422)
  })

  test('resets the password with a valid code and allows login', async ({ client, assert }) => {
    try {
      const recover = await client.post('/api/v1/auth/recover').json({ email: CORREO })
      recover.assertStatus(200)

      await fijarCodigo(CORREO, '654321')

      const verify = await client.post('/api/v1/auth/recover/verify').json({
        email: CORREO,
        code: '654321',
      })
      verify.assertStatus(200)
      const resetToken = (verify.body() as { resetToken: string }).resetToken
      assert.isString(resetToken)

      const reset = await client.post('/api/v1/auth/recover/reset').json({
        resetToken,
        password: 'NuevaClave1',
        passwordConfirmation: 'NuevaClave1',
      })
      reset.assertStatus(200)

      const oldLogin = await client.post('/api/v1/auth/login').json({
        email: CORREO,
        password: '123456',
      })
      oldLogin.assertStatus(400)

      const nextLogin = await client.post('/api/v1/auth/login').json({
        email: CORREO,
        password: 'NuevaClave1',
      })
      nextLogin.assertStatus(200)
    } finally {
      // Los demás specs entran con la clave de siempre.
      const user = await User.findByOrFail('correo', CORREO)
      user.password = '123456'
      await user.save()
    }
  })
})
