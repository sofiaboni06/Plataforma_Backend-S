import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'

async function login(client: ApiClient, email: string) {
  const response = await client.post('/api/v1/auth/login').json({ email, password: '123456' })
  response.assertStatus(200)
  return response.body().data.token as string
}

type ObraRow = { id: number; idCformacion: number; nombre: string; lugar: string | null; estado: boolean }

test.group('Obras (CRUD)', () => {
  test('crear, listar, cambiar y apagar una obra', async ({ client, assert }) => {
    const token = await login(client, 'adminbodega@correo.com')
    const suffix = Date.now()
    const nombre = `Obra prueba ${suffix}`

    // 1) Creas una obra con nombre y lugar. La lista y aparece esa misma.
    const creada = await client
      .post('/api/v1/obras')
      .bearerToken(token)
      .json({ nombre, lugar: 'Bloque A' })
    creada.assertStatus(200)
    const obra = creada.body().data as ObraRow
    assert.equal(obra.nombre, nombre)
    assert.equal(obra.lugar, 'Bloque A')
    assert.isTrue(obra.estado)
    // el centro sale del usuario logueado, no de la bodega
    assert.equal(obra.idCformacion, 1)

    const lista = await client.get('/api/v1/obras').bearerToken(token)
    lista.assertStatus(200)
    const rows = lista.body().data as ObraRow[]
    assert.isTrue(rows.some((row) => row.id === obra.id && row.nombre === nombre))

    // 2) Le cambias el nombre y el listado muestra el nombre nuevo.
    const nuevoNombre = `${nombre} editada`
    const editada = await client
      .patch(`/api/v1/obras/${obra.id}`)
      .bearerToken(token)
      .json({ nombre: nuevoNombre })
    editada.assertStatus(200)
    assert.equal(editada.body().data.nombre, nuevoNombre)

    const listaEditada = await client.get('/api/v1/obras').bearerToken(token)
    const rowsEditadas = listaEditada.body().data as ObraRow[]
    assert.isTrue(rowsEditadas.some((row) => row.id === obra.id && row.nombre === nuevoNombre))
    assert.isFalse(rowsEditadas.some((row) => row.nombre === nombre))

    // 3) La apagas: estado false y deja de salir como activa.
    const apagada = await client.delete(`/api/v1/obras/${obra.id}`).bearerToken(token)
    apagada.assertStatus(200)

    const detalle = await client.get(`/api/v1/obras/${obra.id}`).bearerToken(token)
    detalle.assertStatus(200)
    assert.isFalse(detalle.body().data.estado)

    const listaActivas = await client.get('/api/v1/obras').bearerToken(token)
    const activas = listaActivas.body().data as ObraRow[]
    assert.isFalse(activas.some((row) => row.id === obra.id))

    const listaInactivas = await client.get('/api/v1/obras').bearerToken(token).qs({ estado: false })
    const inactivas = listaInactivas.body().data as ObraRow[]
    assert.isTrue(inactivas.some((row) => row.id === obra.id))

    // apagarla otra vez es un conflicto, no un error 500
    const otraVez = await client.delete(`/api/v1/obras/${obra.id}`).bearerToken(token)
    otraVez.assertStatus(409)
  })

  test('una obra de otro centro no aparece en el listado', async ({ client, assert }) => {
    const admin = await login(client, 'carlos@correo.com')
    const bodegaUser = await login(client, 'adminbodega@correo.com')
    const suffix = Date.now()
    const nombre = `Obra centro 2 ${suffix}`

    // 4) Una obra con otro id_cformacion no aparece en tu listado.
    const ajena = await client
      .post('/api/v1/obras')
      .bearerToken(admin)
      .json({ nombre, lugar: 'Sede 2', idCformacion: 2 })
    ajena.assertStatus(200)
    assert.equal(ajena.body().data.idCformacion, 2)

    const propias = await client.get('/api/v1/obras').bearerToken(bodegaUser)
    propias.assertStatus(200)
    const rows = propias.body().data as ObraRow[]
    assert.isTrue(rows.every((row) => row.idCformacion === 1))
    assert.isFalse(rows.some((row) => row.nombre === nombre))

    // no puede verla ni cambiarla por id
    const detalle = await client.get(`/api/v1/obras/${ajena.body().data.id}`).bearerToken(bodegaUser)
    detalle.assertStatus(403)
    const cambio = await client
      .patch(`/api/v1/obras/${ajena.body().data.id}`)
      .bearerToken(bodegaUser)
      .json({ nombre: 'hackeada' })
    cambio.assertStatus(403)

    // un usuario normal no puede forzar el centro desde el body
    const forzada = await client
      .post('/api/v1/obras')
      .bearerToken(bodegaUser)
      .json({ nombre: `Forzada ${suffix}`, idCformacion: 2 })
    forzada.assertStatus(200)
    assert.equal(forzada.body().data.idCformacion, 1)
  })

  test('no se repite el nombre dentro del mismo centro', async ({ client }) => {
    const token = await login(client, 'adminbodega@correo.com')
    const nombre = `Obra duplicada ${Date.now()}`

    const primera = await client.post('/api/v1/obras').bearerToken(token).json({ nombre })
    primera.assertStatus(200)

    const segunda = await client.post('/api/v1/obras').bearerToken(token).json({ nombre })
    segunda.assertStatus(409)
  })
})
