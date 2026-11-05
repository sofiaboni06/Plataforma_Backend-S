import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'

async function login(client: ApiClient, email: string) {
  const response = await client.post('/api/v1/auth/login').json({ email, password: '123456' })
  response.assertStatus(200)
  return response.body().data.token as string
}

async function anioActivo(client: ApiClient, token: string) {
  const respuesta = await client.get('/api/v1/vigencias/activa').bearerToken(token)
  respuesta.assertStatus(200)
  const anio = respuesta.body().data?.anio as number | undefined
  if (!anio) {
    throw new Error('No hay vigencia activa para el test de vigencia especial')
  }
  return anio
}

test.group('Vigencia especial', () => {
  test('abre una vigencia especial y le agrega un programa nuevo', async ({ client, assert }) => {
    const token = await login(client, 'subdirector@correo.com')
    const anio = await anioActivo(client, token)

    const especial = await client
      .post(`/api/v1/vigencias/${anio}/especiales`)
      .bearerToken(token)
      .json({ nombre: `Programas nuevos ${Date.now()}`, monto: 5_000_000 })
    especial.assertStatus(200)
    const id = especial.body().data.id as number
    assert.equal(especial.body().data.monto, 5_000_000)

    const programas = await client.get('/api/v1/programas-formacion').bearerToken(token)
    programas.assertStatus(200)
    const programaId = (programas.body().data as { id: number }[] | undefined)?.[0]?.id
    if (programaId) {
      const conPrograma = await client
        .post(`/api/v1/vigencias/${anio}/especiales/${id}/programas`)
        .bearerToken(token)
        .json({ programaId })
      conPrograma.assertStatus(200)
      assert.equal(conPrograma.body().data.programas[0].id, programaId)
    }

    const listado = await client.get(`/api/v1/vigencias/${anio}/especiales`).bearerToken(token)
    listado.assertStatus(200)
    assert.isAtLeast(listado.body().data.length, 1)
  })

  test('el coordinador ve el monto especial que le asignaron', async ({ client, assert }) => {
    const subdirectora = await login(client, 'subdirector@correo.com')
    const coordinador = await login(client, 'coordinador@correo.com')
    const anio = await anioActivo(client, subdirectora)

    const especial = await client
      .post(`/api/v1/vigencias/${anio}/especiales`)
      .bearerToken(subdirectora)
      .json({ nombre: `Tardíos coordinador ${Date.now()}`, monto: 4_000_000 })
    especial.assertStatus(200)
    const id = especial.body().data.id as number

    const perfil = await client.get('/api/v1/account/profile').bearerToken(coordinador)
    perfil.assertStatus(200)
    const idUsuario = perfil.body().data.id as number

    const asignado = await client
      .put(`/api/v1/vigencias/${anio}/especiales/${id}/coordinadores`)
      .bearerToken(subdirectora)
      .json({ idUsuario, monto: 4_000_000 })
    asignado.assertStatus(200)

    const paraRepartir = await client
      .get(`/api/v1/vigencias/${anio}/especiales/para-repartir`)
      .bearerToken(coordinador)
    paraRepartir.assertStatus(200)
    const cuerpo = paraRepartir.body() as { data?: Array<{ id: number; monto: number }> } | Array<{
      id: number
      monto: number
    }>
    const filas = Array.isArray(cuerpo) ? cuerpo : (cuerpo.data ?? [])
    assert.equal(filas.find((fila) => fila.id === id)?.monto, 4_000_000)
  })
})
