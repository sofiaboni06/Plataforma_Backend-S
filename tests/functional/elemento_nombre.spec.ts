import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'

type Elemento = { id: number; nombre: string; idItem: number; item: { nombre: string } | null }

async function login(client: ApiClient, email: string) {
  const response = await client.post('/api/v1/auth/login').json({ email, password: '123456' })
  response.assertStatus(200)
  return response.body().data.token as string
}

function datosDe<T>(response: { body: () => unknown }) {
  return (response.body() as { data: T }).data
}

test.group('Nombre propio del elemento', () => {
  test('el nombre lo escribe bodega, no sale del ítem, y el instructor lo encuentra por él', async ({
    client,
    assert,
  }) => {
    const admin = await login(client, 'carlos@correo.com')
    const bodega = await login(client, 'adminbodega@correo.com')
    const instructor = await login(client, 'instructor@correo.com')
    const suffix = Date.now()

    const categoria = await client
      .post('/api/v1/categorias')
      .bearerToken(admin)
      .json({ nombre: `Nombre propio ${suffix}`, estado: true })
    categoria.assertStatus(200)
    const subcategoria = await client
      .post('/api/v1/subcategorias')
      .bearerToken(admin)
      .json({
        idCategoria: datosDe<{ id: number }>(categoria).id,
        nombre: `Sub nombre ${suffix}`,
        estado: true,
      })
    subcategoria.assertStatus(200)

    const item = await client
      .post('/api/v1/inventario/items')
      .bearerToken(admin)
      .json({
        nombre: `Pintura base agua ${suffix}`,
        descripcion: 'Ficha general',
        idSubcategoria: datosDe<{ id: number }>(subcategoria).id,
      })
    item.assertStatus(200)
    const idItem = datosDe<{ id: number }>(item).id

    const bodegas = await client.get('/api/v1/bodegas').bearerToken(bodega)
    const idBodega = datosDe<{ id: number }[]>(bodegas)[0].id
    const subBodega = await client
      .post(`/api/v1/bodegas/${idBodega}/sub-bodegas`)
      .bearerToken(admin)
      .json({ nombre: `Sub nombre ${suffix}` })
    subBodega.assertStatus(200)
    const stand = await client
      .post(`/api/v1/bodegas/sub-bodegas/${datosDe<{ id: number }>(subBodega).id}/stands`)
      .bearerToken(admin)
      .json({ nombre: `Stand nombre ${suffix}` })
    stand.assertStatus(200)

    const unidades = await client.get('/api/v1/unidades-medida').bearerToken(admin)
    const clasificaciones = await client.get('/api/v1/clasificaciones-elemento').bearerToken(admin)
    const consumo = datosDe<{ id: number; nombre: string }[]>(clasificaciones).find(
      (row) => row.nombre === 'MATERIAL DE CONSUMO'
    )!

    const base = {
      idItem,
      idStand: datosDe<{ id: number }>(stand).id,
      cantidad: 20,
      estado: true,
      idUnidadMedida: datosDe<{ id: number }[]>(unidades)[0].id,
      idClasificacion: consumo.id,
      caracter: 'consumo',
    }

    // Sin nombre no se crea: ya no se copia del ítem.
    const sinNombre = await client
      .post('/api/v1/inventario/elementos')
      .bearerToken(admin)
      .json({ ...base, codigo: `NOM-0-${suffix}` })
    sinNombre.assertStatus(422)

    const creado = await client
      .post('/api/v1/inventario/elementos')
      .bearerToken(admin)
      .json({ ...base, codigo: `NOM-1-${suffix}`, nombre: `  Vinilo blanco techos ${suffix}  ` })
    creado.assertStatus(200)
    const elemento = datosDe<Elemento>(creado)
    assert.equal(elemento.nombre, `Vinilo blanco techos ${suffix}`)
    assert.equal(elemento.idItem, idItem)
    assert.equal(elemento.item?.nombre, `Pintura base agua ${suffix}`)

    // Dos elementos del mismo ítem pueden llamarse distinto.
    const otro = await client
      .post('/api/v1/inventario/elementos')
      .bearerToken(admin)
      .json({ ...base, codigo: `NOM-2-${suffix}`, nombre: `Vinilo gris fachada ${suffix}` })
    otro.assertStatus(200)

    const renombrado = await client
      .patch(`/api/v1/inventario/elementos/${elemento.id}`)
      .bearerToken(admin)
      .json({ nombre: `Vinilo blanco mate ${suffix}` })
    renombrado.assertStatus(200)
    assert.equal(datosDe<Elemento>(renombrado).nombre, `Vinilo blanco mate ${suffix}`)

    const corto = await client
      .patch(`/api/v1/inventario/elementos/${elemento.id}`)
      .bearerToken(admin)
      .json({ nombre: ' a ' })
    corto.assertStatus(422)

    // En blanco llega como null (el bodyparser recorta y vacía): no borra el nombre.
    const vacio = await client
      .patch(`/api/v1/inventario/elementos/${elemento.id}`)
      .bearerToken(admin)
      .json({ nombre: '   ' })
    vacio.assertStatus(200)
    assert.equal(datosDe<Elemento>(vacio).nombre, `Vinilo blanco mate ${suffix}`)

    // Un cambio parcial sin nombre no lo toca.
    const parcial = await client
      .patch(`/api/v1/inventario/elementos/${elemento.id}`)
      .bearerToken(admin)
      .json({ marca: 'Pintuco' })
    parcial.assertStatus(200)
    assert.equal(datosDe<Elemento>(parcial).nombre, `Vinilo blanco mate ${suffix}`)

    // Renombrar el ítem no renombra sus elementos.
    const itemNuevo = await client
      .patch(`/api/v1/inventario/items/${idItem}`)
      .bearerToken(admin)
      .json({ nombre: `Pintura acrílica ${suffix}` })
    itemNuevo.assertStatus(200)
    const despuesDelItem = await client
      .get(`/api/v1/inventario/elementos/${elemento.id}`)
      .bearerToken(admin)
    despuesDelItem.assertStatus(200)
    assert.equal(datosDe<Elemento>(despuesDelItem).nombre, `Vinilo blanco mate ${suffix}`)
    assert.equal(datosDe<Elemento>(despuesDelItem).item?.nombre, `Pintura acrílica ${suffix}`)

    // El instructor ve el elemento con su nombre propio en la lista donde busca al pedir.
    const lista = await client.get('/api/v1/inventario/elementos').bearerToken(instructor)
    lista.assertStatus(200)
    const nombres = datosDe<{ id: number; nombre: string }[]>(lista)
      .filter((row) => row.nombre.toLowerCase().includes('vinilo blanco mate'))
      .map((row) => row.id)
    assert.include(nombres, elemento.id)

    const obra = await client
      .post('/api/v1/obras')
      .bearerToken(bodega)
      .json({ nombre: `Obra nombre ${suffix}` })
    obra.assertStatus(200)
    const pedido = await client
      .post('/api/v1/solicitudes')
      .bearerToken(instructor)
      .json({
        codigoSolicitud: `NOM-${suffix}`,
        idObra: datosDe<{ id: number }>(obra).id,
        tipo: 'consumo',
        elementos: [{ idElemento: elemento.id, cantidad: 2 }],
      })
    pedido.assertStatus(201)
    const detalle = datosDe<{ detalle: { elemento: { nombre: string } }[] }>(pedido).detalle
    assert.equal(detalle[0].elemento.nombre, `Vinilo blanco mate ${suffix}`)
  })
})
