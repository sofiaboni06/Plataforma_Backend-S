import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'

async function login(client: ApiClient, email: string, password = '123456') {
  const response = await client.post('/api/v1/auth/login').json({ email, password })
  response.assertStatus(200)
  return response.body().data.token as string
}

test.group('Profile', () => {
  test('rejects unauthenticated access', async ({ client }) => {
    const response = await client.get('/api/v1/account/profile')
    response.assertStatus(401)
  })

  test('returns the authenticated user from plataforma_1.sql', async ({ client, assert }) => {
    const token = await login(client, 'carlos@correo.com')
    const response = await client.get('/api/v1/account/profile').bearerToken(token)

    response.assertStatus(200)
    const profile = response.body().data

    assert.equal(profile.fullName, 'Carlos Perez')
    assert.equal(profile.email, 'carlos@correo.com')
    assert.equal(profile.documentId, '1001001001')
    assert.equal(profile.documentType, 'CC')
    assert.equal(profile.role, 'Administrador')
    assert.equal(profile.roleLabel, 'Administrador')
    assert.equal(profile.trainingCenter, 'Centro de Comercio y Servicios')
    assert.equal(profile.regional, 'Regional Cauca')
    assert.equal(profile.location, 'Centro de Comercio y Servicios — Regional Cauca')
  })
})

test.group('Modules', () => {
  test('rejects unauthenticated access', async ({ client }) => {
    const response = await client.get('/api/v1/modules')
    response.assertStatus(401)
  })

  test('returns all modules for Administrador', async ({ client, assert }) => {
    const token = await login(client, 'carlos@correo.com')
    const response = await client.get('/api/v1/modules').bearerToken(token)

    response.assertStatus(200)
    const modules = response.body().data as { code: string; label: string }[]
    assert.deepEqual(
      modules.map((item) => item.code),
      ['inventario', 'materiales-de-formacion', 'ambiental']
    )
  })

  test('filters modules by Almacenista permissions', async ({ client, assert }) => {
    const token = await login(client, 'juan@correo.com')
    const response = await client.get('/api/v1/modules').bearerToken(token)

    response.assertStatus(200)
    const modules = response.body().data as { code: string; label: string }[]
    assert.deepEqual(
      modules.map((item) => item.label),
      ['Inventario']
    )
  })

  test('filters modules by Funcionario permissions', async ({ client, assert }) => {
    const token = await login(client, 'maria@correo.com')
    const response = await client.get('/api/v1/modules').bearerToken(token)

    response.assertStatus(200)
    const modules = response.body().data as { code: string }[]
    assert.deepEqual(
      modules.map((item) => item.code),
      ['inventario', 'materiales-de-formacion']
    )
  })
})

test.group('Roles and module tree', () => {
  test('rejects unauthenticated access to roles', async ({ client }) => {
    const response = await client.get('/api/v1/roles')
    response.assertStatus(401)
  })

  test('rejects a non-admin creating a role', async ({ client }) => {
    const token = await login(client, 'maria@correo.com')
    const response = await client.post('/api/v1/roles').bearerToken(token).json({
      name: 'Aprendiz',
      description: 'Perfil de aprendiz',
    })
    response.assertStatus(403)
  })

  test('admin creates Aprendiz and it appears in the list', async ({ client, assert }) => {
    const token = await login(client, 'carlos@correo.com')
    const created = await client.post('/api/v1/roles').bearerToken(token).json({
      name: 'Aprendiz laboratorio',
      description: 'Puede usar solo lo que le asignen después',
    })

    created.assertStatus(200)
    const createdRole = created.body().data as { name: string; active: boolean }
    assert.equal(createdRole.name, 'Aprendiz laboratorio')
    assert.equal(createdRole.active, true)

    const list = await client.get('/api/v1/roles').bearerToken(token)
    list.assertStatus(200)
    const names = (list.body().data as { name: string }[]).map((item) => item.name)
    assert.include(names, 'Aprendiz laboratorio')
    assert.include(names, 'Administrador')
    assert.include(names, 'Funcionario')
  })

  test('assigns a grandchild without granting parent or siblings', async ({ client, assert }) => {
    const token = await login(client, 'carlos@correo.com')

    const parent = await client.post('/api/v1/modules/catalog').bearerToken(token).json({
      name: 'Aplicacion demo',
      description: 'Ejemplo de app dentro de la plataforma',
    })
    parent.assertStatus(200)
    const parentId = (parent.body() as { data: { id: number } }).data.id

    const child = await client.post('/api/v1/modules/catalog').bearerToken(token).json({
      name: 'Seccion demo',
      parentId,
    })
    child.assertStatus(200)
    const childId = (child.body() as { data: { id: number } }).data.id

    const grandchild = await client.post('/api/v1/modules/catalog').bearerToken(token).json({
      name: 'Accion demo',
      parentId: childId,
    })
    grandchild.assertStatus(200)
    const grandchildId = (grandchild.body() as { data: { id: number } }).data.id

    const sibling = await client.post('/api/v1/modules/catalog').bearerToken(token).json({
      name: 'Otra accion demo',
      parentId: childId,
    })
    sibling.assertStatus(200)

    const role = await client.post('/api/v1/roles').bearerToken(token).json({
      name: 'Votante demo',
    })
    role.assertStatus(200)
    const roleId = (role.body().data as { id: number }).id

    const assigned = await client.put(`/api/v1/roles/${roleId}/modules`).bearerToken(token).json({
      moduleIds: [grandchildId],
    })
    assigned.assertStatus(200)
    assert.deepEqual(assigned.body().data.moduleIds, [grandchildId])

    const appNode = (assigned.body().data.tree as Array<{
      label: string
      granted: boolean
      children: Array<{
        label: string
        granted: boolean
        children: Array<{ label: string; granted: boolean; id: number }>
      }>
    }>).find((item) => item.label === 'Aplicacion demo')

    assert.exists(appNode)
    assert.isFalse(appNode!.granted)
    assert.lengthOf(appNode!.children, 1)
    assert.equal(appNode!.children[0].label, 'Seccion demo')
    assert.isFalse(appNode!.children[0].granted)

    const actions = appNode!.children[0].children
    const grantedAction = actions.find((item) => item.label === 'Accion demo')
    const otherAction = actions.find((item) => item.label === 'Otra accion demo')
    assert.isTrue(grantedAction!.granted)
    assert.isFalse(otherAction!.granted)

    const flatModules = await client.get('/api/v1/modules').bearerToken(token)
    flatModules.assertStatus(200)
    const labels = (flatModules.body().data as { label: string }[]).map((item) => item.label)
    assert.notInclude(labels, 'Accion demo')
    assert.include(labels, 'Inventario')
  })
})

test.group('Profile writes', () => {
  test('rejects a document that already belongs to another user', async ({ client }) => {
    const juanToken = await login(client, 'juan@correo.com')
    const juan = await client.get('/api/v1/account/profile').bearerToken(juanToken)
    juan.assertStatus(200)

    const token = await login(client, 'carlos@correo.com')
    const response = await client.patch('/api/v1/account/profile').bearerToken(token).json({
      numeroDocumento: juan.body().data.documentId,
    })

    response.assertStatus(422)
  })

  test('updates email and then password of the authenticated user', async ({ client, assert }) => {
    const token = await login(client, 'carlos@correo.com')
    const updated = await client.patch('/api/v1/account/profile').bearerToken(token).json({
      email: 'carlos.nuevo@correo.com',
      numeroDocumento: '1991991991',
    })

    updated.assertStatus(200)
    assert.equal(updated.body().data.email, 'carlos.nuevo@correo.com')
    assert.equal(updated.body().data.documentId, '1991991991')

    const persisted = await client.get('/api/v1/account/profile').bearerToken(token)
    persisted.assertStatus(200)
    assert.equal(persisted.body().data.email, 'carlos.nuevo@correo.com')

    const passwordResponse = await client.patch('/api/v1/account/password').bearerToken(token).json({
      currentPassword: '123456',
      password: 'NuevaClave1',
      passwordConfirmation: 'NuevaClave1',
    })
    passwordResponse.assertStatus(200)

    const failed = await client.post('/api/v1/auth/login').json({
      email: 'carlos.nuevo@correo.com',
      password: '123456',
    })
    failed.assertStatus(400)

    const nextLogin = await client.post('/api/v1/auth/login').json({
      usuario: '1991991991',
      password: 'NuevaClave1',
    })
    nextLogin.assertStatus(200)
  })
})
