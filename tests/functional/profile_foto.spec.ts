import { access, constants } from 'node:fs'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import { fotosDir } from '#config/fotos'

const accessFile = promisify(access)

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
)

async function login(client: ApiClient) {
  const response = await client.post('/api/v1/auth/login').json({
    email: 'carlos@correo.com',
    password: '123456',
  })
  response.assertStatus(200)
  return response.body().data.token as string
}

test.group('Fotografía de perfil', () => {
  test('guarda, muestra y quita la foto del usuario autenticado', async ({ client, assert }) => {
    const token = await login(client)

    const vacio = await client.get('/api/v1/account/profile').bearerToken(token)
    vacio.assertStatus(200)
    const id = vacio.body().data.id as number
    assert.equal(vacio.body().data.avatarUrl, '')

    const sinFoto = await client.get('/api/v1/account/profile/foto').bearerToken(token)
    sinFoto.assertStatus(404)

    const subida = await client
      .post('/api/v1/account/profile/foto')
      .bearerToken(token)
      .file('fotografia', png, { filename: 'foto.png', contentType: 'image/png' })

    subida.assertStatus(200)
    assert.equal(subida.body().data.avatarUrl, '/api/v1/account/profile/foto')
    await accessFile(join(fotosDir, 'perfiles', String(id), 'foto.webp'), constants.R_OK)

    const imagen = await client.get('/api/v1/account/profile/foto').bearerToken(token)
    imagen.assertStatus(200)
    assert.include(String(imagen.header('content-type')), 'image/webp')

    const invalida = await client
      .post('/api/v1/account/profile/foto')
      .bearerToken(token)
      .file('fotografia', Buffer.from('no es una imagen'), {
        filename: 'nota.txt',
        contentType: 'text/plain',
      })
    invalida.assertStatus(422)

    const quitada = await client.delete('/api/v1/account/profile/foto').bearerToken(token)
    quitada.assertStatus(200)
    assert.equal(quitada.body().data.avatarUrl, '')

    const otraVez = await client.get('/api/v1/account/profile/foto').bearerToken(token)
    otraVez.assertStatus(404)
  })
})
