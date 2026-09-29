import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'

async function login(client: ApiClient, email: string) {
  const response = await client.post('/api/v1/auth/login').json({ email, password: '123456' })
  response.assertStatus(200)
  return response.body().data.token as string
}

test.group('Catálogos del elemento por centro', () => {
  test('un centro no ve clasificaciones, unidades, usos ni UNSPSC de otro', async ({
    client,
    assert,
  }) => {
    const admin = await login(client, 'carlos@correo.com')
    const bodegaUser = await login(client, 'adminbodega@correo.com')
    const suffix = Date.now()

    const clasificacionAjena = await client
      .post('/api/v1/clasificaciones-elemento')
      .bearerToken(admin)
      .json({ nombre: `SOLO CENTRO 2 ${suffix}`, idCformacion: 2 })
    clasificacionAjena.assertStatus(200)
    assert.equal(clasificacionAjena.body().data.idCformacion, 2)

    const propias = await client.get('/api/v1/clasificaciones-elemento').bearerToken(admin)
    propias.assertStatus(200)
    const propiasRows = propias.body().data as {
      id: number
      nombre: string
      idCformacion: number
    }[]
    assert.isTrue(propiasRows.every((row) => row.idCformacion === 1))
    assert.isTrue(propiasRows.some((row) => row.nombre === 'CONSUMO'))
    assert.isFalse(propiasRows.some((row) => row.nombre === `SOLO CENTRO 2 ${suffix}`))

    const delCentro2 = await client
      .get('/api/v1/clasificaciones-elemento')
      .bearerToken(admin)
      .qs({ idCformacion: 2 })
    delCentro2.assertStatus(200)
    const centro2Rows = delCentro2.body().data as { nombre: string; idCformacion: number }[]
    assert.isTrue(centro2Rows.every((row) => row.idCformacion === 2))
    assert.isTrue(centro2Rows.some((row) => row.nombre === `SOLO CENTRO 2 ${suffix}`))
    assert.isFalse(centro2Rows.some((row) => row.nombre === 'CONSUMO'))

    const comoBodega = await client.get('/api/v1/clasificaciones-elemento').bearerToken(bodegaUser)
    comoBodega.assertStatus(200)
    const bodegaRows = comoBodega.body().data as { nombre: string; idCformacion: number }[]
    assert.isTrue(bodegaRows.every((row) => row.idCformacion === 1))
    assert.isFalse(bodegaRows.some((row) => row.nombre === `SOLO CENTRO 2 ${suffix}`))

    const forzada = await client
      .post('/api/v1/clasificaciones-elemento')
      .bearerToken(bodegaUser)
      .json({ nombre: `FORZADA ${suffix}`, idCformacion: 2 })
    forzada.assertStatus(200)
    assert.equal(forzada.body().data.idCformacion, 1)

    const unidadAjena = await client
      .post('/api/v1/unidades-medida')
      .bearerToken(admin)
      .json({
        nombre: `Libra ${suffix}`,
        abreviatura: `LB${String(suffix).slice(-6)}`,
        idCformacion: 2,
      })
    unidadAjena.assertStatus(200)
    assert.equal(unidadAjena.body().data.idCformacion, 2)

    const unidades = await client.get('/api/v1/unidades-medida').bearerToken(bodegaUser)
    unidades.assertStatus(200)
    const unidadRows = unidades.body().data as { id: number; idCformacion: number }[]
    assert.isAbove(unidadRows.length, 0)
    assert.isTrue(unidadRows.every((row) => row.idCformacion === 1))
    assert.isFalse(unidadRows.some((row) => row.id === unidadAjena.body().data.id))

    const unidadesCentro2 = await client
      .get('/api/v1/unidades-medida')
      .bearerToken(admin)
      .qs({ idCformacion: 2 })
    unidadesCentro2.assertStatus(200)
    const unidades2 = unidadesCentro2.body().data as { id: number; idCformacion: number }[]
    assert.isTrue(unidades2.every((row) => row.idCformacion === 2))
    assert.isTrue(unidades2.some((row) => row.id === unidadAjena.body().data.id))

    const codigoAjeno = await client
      .post('/api/v1/codigos-estandar')
      .bearerToken(admin)
      .json({ codigo: `U${String(suffix).slice(-8)}`, nombre: `Resina ${suffix}`, idCformacion: 2 })
    codigoAjeno.assertStatus(200)
    assert.equal(codigoAjeno.body().data.idCformacion, 2)

    const codigos = await client.get('/api/v1/codigos-estandar').bearerToken(bodegaUser)
    codigos.assertStatus(200)
    const codigoRows = codigos.body().data as { id: number; codigo: string; idCformacion: number }[]
    assert.isAbove(codigoRows.length, 0)
    assert.isTrue(codigoRows.every((row) => row.idCformacion === 1))
    assert.isTrue(codigoRows.some((row) => row.codigo === '13111305'))
    assert.isFalse(codigoRows.some((row) => row.id === codigoAjeno.body().data.id))

    const usoAjeno = await client
      .post('/api/v1/usos-presupuestales')
      .bearerToken(admin)
      .json({ nombre: `PARTIDA ${suffix}`, idCformacion: 2 })
    usoAjeno.assertStatus(200)
    assert.equal(usoAjeno.body().data.idCformacion, 2)

    const usos = await client.get('/api/v1/usos-presupuestales').bearerToken(bodegaUser)
    usos.assertStatus(200)
    const usoRows = usos.body().data as { id: number; nombre: string; idCformacion: number }[]
    assert.isTrue(usoRows.every((row) => row.idCformacion === 1))
    assert.isTrue(usoRows.some((row) => row.nombre === 'MINERALES; ELECTRICIDAD, GAS Y AGUA'))
    assert.isFalse(usoRows.some((row) => row.id === usoAjeno.body().data.id))

    const categoriaRes = await client
      .post('/api/v1/categorias')
      .bearerToken(admin)
      .json({ nombre: `Cat centro ${suffix}` })
    categoriaRes.assertStatus(200)

    const subcategoriaRes = await client
      .post('/api/v1/subcategorias')
      .bearerToken(admin)
      .json({ idCategoria: categoriaRes.body().data.id, nombre: `Sub centro ${suffix}` })
    subcategoriaRes.assertStatus(200)

    const itemRes = await client
      .post('/api/v1/inventario/items')
      .bearerToken(admin)
      .json({
        nombre: `Item centro ${suffix}`,
        idSubcategoria: subcategoriaRes.body().data.id,
      })
    itemRes.assertStatus(200)

    const bodegas = await client.get('/api/v1/bodegas').bearerToken(admin).qs({ idCformacion: 1 })
    const bodega = (bodegas.body().data as { id: number; idCformacion: number }[]).find(
      (row) => row.idCformacion === 1
    )
    assert.exists(bodega)

    const subRes = await client
      .post(`/api/v1/bodegas/${bodega!.id}/sub-bodegas`)
      .bearerToken(admin)
      .json({ nombre: `Sub bodega ${suffix}` })
    subRes.assertStatus(200)

    const standRes = await client
      .post(`/api/v1/bodegas/sub-bodegas/${subRes.body().data.id}/stands`)
      .bearerToken(admin)
      .json({ nombre: `Stand ${suffix}` })
    standRes.assertStatus(200)

    const cruzado = await client
      .post('/api/v1/inventario/elementos')
      .bearerToken(admin)
      .json({
        idItem: itemRes.body().data.id,
        idStand: standRes.body().data.id,
        cantidad: 10,
        estado: true,
        idUnidadMedida: unidadRows[0].id,
        idClasificacion: clasificacionAjena.body().data.id,
        codigo: `CRUZ-${suffix}`,
      })
    cruzado.assertStatus(422)

    const consumo = propiasRows.find((row) => row.nombre === 'CONSUMO')
    assert.exists(consumo)

    const propio = await client
      .post('/api/v1/inventario/elementos')
      .bearerToken(admin)
      .json({
        idItem: itemRes.body().data.id,
        idStand: standRes.body().data.id,
        cantidad: 10,
        estado: true,
        idUnidadMedida: unidadRows[0].id,
        idClasificacion: consumo!.id,
        codigo: `OK-${suffix}`,
      })
    propio.assertStatus(200)
    assert.equal(propio.body().data.clasificacion.nombre, 'CONSUMO')
  })
})
