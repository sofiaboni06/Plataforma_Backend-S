import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import Bodega from '#models/bodega'
import { buildPermissionCatalog } from '#data/permission_catalog'
import { ADMIN_BODEGA_EXCLUDED_PERMISSIONS } from '#database/seeders/admin_bodega_seeder'

async function login(client: ApiClient, email = 'adminbodega@correo.com') {
  const response = await client.post('/api/v1/auth/login').json({ email, password: '123456' })
  response.assertStatus(200)
  return response.body().data.token as string
}

test.group('Admin bodega', () => {
  test('tiene todo el inventario pero no es administrador', async ({ client, assert }) => {
    const token = await login(client)
    const profile = await client.get('/api/v1/account/profile').bearerToken(token)
    profile.assertStatus(200)

    const data = profile.body().data as { role: string; isAdmin: boolean; permissions: string[] }
    assert.equal(data.role, 'Admin bodega')
    assert.isFalse(data.isAdmin)

    const inventario = buildPermissionCatalog()
      .filter((definition) => definition.module === 'Inventario')
      .map((definition) => definition.code)
      .filter((code) => !ADMIN_BODEGA_EXCLUDED_PERMISSIONS.has(code))
    assert.includeMembers(data.permissions, inventario)
    assert.isFalse(data.permissions.includes('bodega.crear'))
    assert.isFalse(data.permissions.includes('bodega.eliminar'))

    const users = await client.get('/api/v1/users').bearerToken(token)
    users.assertStatus(403)
  })

  test('solo ve las bodegas de su centro', async ({ client, assert }) => {
    const token = await login(client)
    const otroCentro = await Bodega.create({
      nombre: `Bodega otro centro ${Date.now()}`,
      idCformacion: 2,
      estado: true,
    })

    const bodegas = await client.get('/api/v1/bodegas').bearerToken(token).qs({ perPage: 100 })
    bodegas.assertStatus(200)
    const rows = bodegas.body().data as { id: number; idCformacion: number }[]
    assert.isAbove(rows.length, 0)
    assert.isTrue(rows.every((bodega) => bodega.idCformacion === 1))

    const ajena = await client.get(`/api/v1/bodegas/${otroCentro.id}`).bearerToken(token)
    ajena.assertStatus(403)
  })

  test('no crea bodegas: eso lo hace el administrador', async ({ client }) => {
    const token = await login(client)

    const creada = await client
      .post('/api/v1/bodegas')
      .bearerToken(token)
      .json({ nombre: `Bodega admin bodega ${Date.now()}` })
    creada.assertStatus(403)
  })
})
