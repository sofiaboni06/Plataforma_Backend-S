import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import Item from '#models/item'

async function login(client: ApiClient, email: string) {
  const response = await client.post('/api/v1/auth/login').json({ email, password: '123456' })
  response.assertStatus(200)
  return response.body().data.token as string
}

test.group('Catálogos estándar de la plataforma', () => {
  test('una clasificación o categoría nueva la ven todos y el centro no la crea', async ({
    client,
    assert,
  }) => {
    const admin = await login(client, 'carlos@correo.com')
    const bodegaUser = await login(client, 'adminbodega@correo.com')
    const suffix = Date.now()

    const creada = await client
      .post('/api/v1/clasificaciones-elemento')
      .bearerToken(admin)
      .json({ nombre: `GLOBAL ${suffix}`, caracter: 'consumo' })
    creada.assertStatus(200)

    const delAdmin = await client.get('/api/v1/clasificaciones-elemento').bearerToken(admin)
    const delCentro = await client.get('/api/v1/clasificaciones-elemento').bearerToken(bodegaUser)
    delAdmin.assertStatus(200)
    delCentro.assertStatus(200)

    const idsAdmin = (delAdmin.body().data as { id: number; nombre: string }[]).map((row) => row.id)
    const idsCentro = (delCentro.body().data as { id: number }[]).map((row) => row.id)
    assert.include(idsAdmin, creada.body().data.id)
    assert.include(idsCentro, creada.body().data.id)
    assert.isTrue(
      (delAdmin.body().data as { nombre: string }[]).some((row) => row.nombre === 'CONSUMO')
    )
    assert.isTrue(
      (delCentro.body().data as { nombre: string }[]).some((row) => row.nombre === 'CONSUMO')
    )

    const noPuede = await client
      .post('/api/v1/clasificaciones-elemento')
      .bearerToken(bodegaUser)
      .json({ nombre: `NO ${suffix}`, caracter: 'devolutivo' })
    noPuede.assertStatus(403)

    const categoria = await client
      .post('/api/v1/categorias')
      .bearerToken(admin)
      .json({ nombre: `Cat global ${suffix}` })
    categoria.assertStatus(200)

    const subcategoria = await client
      .post('/api/v1/subcategorias')
      .bearerToken(admin)
      .json({ idCategoria: categoria.body().data.id, nombre: `Sub global ${suffix}` })
    subcategoria.assertStatus(200)

    const categoriasCentro = await client.get('/api/v1/categorias').bearerToken(bodegaUser)
    categoriasCentro.assertStatus(200)
    assert.isTrue(
      (categoriasCentro.body().data as { id: number }[]).some(
        (row) => row.id === categoria.body().data.id
      )
    )

    const categoriaAjena = await client
      .post('/api/v1/categorias')
      .bearerToken(bodegaUser)
      .json({ nombre: `Cat del centro ${suffix}` })
    categoriaAjena.assertStatus(403)

    const itemAjeno = await Item.create({
      idSubcategoria: subcategoria.body().data.id,
      idCformacion: 2,
      nombre: `Item cauca ${suffix}`,
      estado: true,
    })

    const items = await client
      .get('/api/v1/inventario/items')
      .bearerToken(bodegaUser)
      .qs({ search: `Item cauca ${suffix}`, perPage: 100 })
    items.assertStatus(200)
    assert.isFalse((items.body().data as { id: number }[]).some((row) => row.id === itemAjeno.id))

    const itemPropio = await client
      .post('/api/v1/inventario/items')
      .bearerToken(bodegaUser)
      .json({
        nombre: `Item valle ${suffix}`,
        idSubcategoria: subcategoria.body().data.id,
      })
    itemPropio.assertStatus(200)
  })

  test('el administrador crea una bodega en otro centro y queda para asignarla', async ({
    client,
    assert,
  }) => {
    const admin = await login(client, 'carlos@correo.com')
    const suffix = Date.now()

    const creada = await client
      .post('/api/v1/bodegas')
      .bearerToken(admin)
      .json({ nombre: `Bodega para asignar ${suffix}`, idCformacion: 2 })
    creada.assertStatus(200)
    assert.equal(creada.body().data.idCformacion, 2)
    assert.equal(creada.body().data.nombre, `Bodega para asignar ${suffix}`)

    const listado = await client.get('/api/v1/bodegas').bearerToken(admin).qs({ perPage: 100 })
    listado.assertStatus(200)
    const rows = listado.body().data as { id: number }[]
    assert.isFalse(rows.some((row) => row.id === creada.body().data.id))

    const detalle = await client.get(`/api/v1/bodegas/${creada.body().data.id}`).bearerToken(admin)
    detalle.assertStatus(403)

    const options = await client.get('/api/v1/users/options').bearerToken(admin)
    options.assertStatus(200)
    const bodegas = options.body().data.bodegas as { id: number; trainingCenterId: number }[]
    assert.isTrue(
      bodegas.some((bodega) => bodega.id === creada.body().data.id && bodega.trainingCenterId === 2)
    )
  })
})
