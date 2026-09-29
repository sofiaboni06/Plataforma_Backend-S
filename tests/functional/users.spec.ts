import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'

type AdminUserPayload = {
  id: number
  email: string
  role: string
  active: boolean
}

async function login(client: ApiClient, email: string, password = '123456') {
  const response = await client.post('/api/v1/auth/login').json({ email, password })
  response.assertStatus(200)
  return response.body().data.token as string
}

test.group('Admin users', () => {
  test('rejects unauthenticated access', async ({ client }) => {
    const response = await client.get('/api/v1/users')
    response.assertStatus(401)
  })

  test('rejects a non-admin listing users', async ({ client }) => {
    const token = await login(client, 'maria@correo.com')
    const response = await client.get('/api/v1/users').bearerToken(token)
    response.assertStatus(403)
  })

  test('admin lists existing dump users', async ({ client, assert }) => {
    const token = await login(client, 'carlos@correo.com')
    const response = await client.get('/api/v1/users').bearerToken(token)
    response.assertStatus(200)

    const emails = (response.body().data as { email: string }[]).map((item) => item.email)
    assert.include(emails, 'carlos@correo.com')
    assert.include(emails, 'juan@correo.com')
    assert.include(emails, 'maria@correo.com')
  })

  test('admin creates a user, assigns Almacenista, and that user only sees Inventario', async ({
    client,
    assert,
  }) => {
    const token = await login(client, 'carlos@correo.com')
    const options = await client.get('/api/v1/users/options').bearerToken(token)
    options.assertStatus(200)

    const roles = options.body().data.roles as { id: number; name: string }[]
    const centers = options.body().data.centers as { id: number }[]
    const almacenista = roles.find((role) => role.name === 'Almacenista')
    assert.exists(almacenista)
    assert.isAbove(centers.length, 0)

    const created = await client.post('/api/v1/users').bearerToken(token).json({
      nombres: 'Luisa',
      apellidos: 'Gomez',
      tipoDocumento: 'CC',
      numeroDocumento: '9009009009',
      email: 'luisa.gomez@correo.com',
      password: '123456',
      passwordConfirmation: '123456',
      idPerfil: almacenista!.id,
      idCformacion: centers[0].id,
    })

    created.assertStatus(200)
    const createdUser = created.body().data as AdminUserPayload
    assert.equal(createdUser.email, 'luisa.gomez@correo.com')
    assert.equal(createdUser.role, 'Almacenista')
    assert.equal(createdUser.active, true)

    const userToken = await login(client, 'luisa.gomez@correo.com', '123456')
    const modules = await client.get('/api/v1/modules').bearerToken(userToken)
    modules.assertStatus(200)
    assert.deepEqual(
      (modules.body().data as { label: string }[]).map((item) => item.label),
      ['Inventario']
    )
  })

  test('admin can change a user profile and the modules follow the new role', async ({
    client,
    assert,
  }) => {
    const token = await login(client, 'carlos@correo.com')
    const options = await client.get('/api/v1/users/options').bearerToken(token)
    const roles = options.body().data.roles as { id: number; name: string }[]
    const centers = options.body().data.centers as { id: number }[]
    const almacenista = roles.find((role) => role.name === 'Almacenista')
    const funcionario = roles.find((role) => role.name === 'Funcionario')
    assert.exists(almacenista)
    assert.exists(funcionario)

    const created = await client.post('/api/v1/users').bearerToken(token).json({
      nombres: 'Andres',
      apellidos: 'Rojas',
      tipoDocumento: 'CC',
      numeroDocumento: '9009009010',
      email: 'andres.rojas@correo.com',
      password: '123456',
      passwordConfirmation: '123456',
      idPerfil: almacenista!.id,
      idCformacion: centers[0].id,
    })
    created.assertStatus(200)
    const createdUser = created.body().data as AdminUserPayload

    const updated = await client
      .patch(`/api/v1/users/${createdUser.id}`)
      .bearerToken(token)
      .json({
        idPerfil: funcionario!.id,
      })
    updated.assertStatus(200)
    assert.equal((updated.body().data as AdminUserPayload).role, 'Funcionario')

    const userToken = await login(client, 'andres.rojas@correo.com')
    const modules = await client.get('/api/v1/modules').bearerToken(userToken)
    modules.assertStatus(200)
    assert.deepEqual(
      (modules.body().data as { code: string }[]).map((item) => item.code),
      ['inventario', 'materiales-de-formacion']
    )
  })
})
