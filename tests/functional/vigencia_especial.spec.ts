import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'

async function login(client: ApiClient, email: string) {
  const response = await client.post('/api/v1/auth/login').json({ email, password: '123456' })
  response.assertStatus(200)
  return response.body().data.token as string
}

test.group('Vigencia especial', () => {
  test('abre una vigencia especial y le agrega un programa nuevo', async ({ client, assert }) => {
    const token = await login(client, 'coordinador@correo.com')
    const anio = 2098

    const creada = await client.post('/api/v1/vigencias').bearerToken(token).json({ anio })
    if (creada.status() !== 200 && creada.status() !== 409) {
      creada.assertStatus(200)
    }

    const especial = await client
      .post(`/api/v1/vigencias/${anio}/especiales`)
      .bearerToken(token)
      .json({ nombre: 'Programas nuevos 2098', monto: 5000000 })
    especial.assertStatus(200)
    const id = especial.body().data.id as number
    assert.equal(especial.body().data.nombre, 'Programas nuevos 2098')
    assert.equal(especial.body().data.monto, 5000000)

    const programas = await client.get('/api/v1/programas-formacion').bearerToken(token)
    programas.assertStatus(200)
    const programaId = (programas.body().data as { id: number }[])[0]?.id
    assert.exists(programaId)

    const conPrograma = await client
      .post(`/api/v1/vigencias/${anio}/especiales/${id}/programas`)
      .bearerToken(token)
      .json({ programaId })
    conPrograma.assertStatus(200)
    assert.equal(conPrograma.body().data.programas[0].id, programaId)

    const listado = await client.get(`/api/v1/vigencias/${anio}/especiales`).bearerToken(token)
    listado.assertStatus(200)
    assert.isAtLeast(listado.body().data.length, 1)
  })
})
