import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import SubBodega from '#models/sub_bodega'
import Subcategoria from '#models/subcategoria'

async function login(client: ApiClient, email = 'carlos@correo.com') {
  const response = await client.post('/api/v1/auth/login').json({ email, password: '123456' })
  response.assertStatus(200)
  return response.body().data.token as string
}

test.group('Items y elementos', () => {
  test('el item es la ficha y el elemento exige cantidad minima de 10', async ({
    client,
    assert,
  }) => {
    const token = await login(client)
    const suffix = Date.now()

    const subcategoria = await Subcategoria.query()
      .where('estado', true)
      .orderBy('id_subcategoria', 'asc')
      .firstOrFail()

    const creado = await client
      .post('/api/v1/inventario/items')
      .bearerToken(token)
      .json({
        nombre: `Pintura para techos vinilo color rojo ${suffix}`,
        descripcion: 'Vinilo para techo, acabado mate',
        idSubcategoria: subcategoria.id,
      })
    creado.assertStatus(200)

    const item = creado.body().data as {
      id: number
      nombre: string
      descripcion: string
      idSubcategoria: number
      subcategoria: { id: number; categoria: { id: number; nombre: string } | null }
    }
    assert.equal(item.nombre, `Pintura para techos vinilo color rojo ${suffix}`)
    assert.equal(item.descripcion, 'Vinilo para techo, acabado mate')
    assert.equal(item.idSubcategoria, subcategoria.id)
    assert.equal(item.subcategoria.id, subcategoria.id)
    assert.exists(item.subcategoria.categoria)

    const bodegas = await client.get('/api/v1/bodegas').bearerToken(token)
    bodegas.assertStatus(200)
    const bodega = (bodegas.body().data as { id: number; idCformacion: number }[])[0]
    assert.exists(bodega)
    assert.exists(bodega.idCformacion)

    const subBodega = await SubBodega.create({
      idBodega: bodega.id,
      nombre: `Madera ${suffix}`,
      estado: true,
    })
    assert.equal(subBodega.idBodega, bodega.id)

    const standRes = await client
      .post(`/api/v1/bodegas/sub-bodegas/${subBodega.id}/stands`)
      .bearerToken(token)
      .json({ nombre: `Estante 1 ${suffix}` })
    standRes.assertStatus(200)
    const stand = standRes.body().data as { id: number; idSubBodega: number }
    assert.equal(stand.idSubBodega, subBodega.id)

    const unidades = await client.get('/api/v1/unidades-medida').bearerToken(token)
    unidades.assertStatus(200)
    const unidad = (unidades.body().data as { id: number }[])[0]
    assert.exists(unidad)

    const corto = await client
      .post('/api/v1/inventario/elementos')
      .bearerToken(token)
      .json({
        idItem: item.id,
        idStand: stand.id,
        cantidad: 9,
        gramaje: 1.5,
        estado: true,
        idUnidadMedida: unidad.id,
        codigo: `VIN-TECHO-${suffix}`,
      })
    corto.assertStatus(422)

    const stock = await client
      .post('/api/v1/inventario/elementos')
      .bearerToken(token)
      .json({
        idItem: item.id,
        idStand: stand.id,
        cantidad: 10,
        gramaje: 1.5,
        estado: true,
        idUnidadMedida: unidad.id,
        codigo: `VIN-TECHO-${suffix}`,
        marca: 'Pintuco',
        color: 'Rojo',
      })
    stock.assertStatus(200)

    const elemento = stock.body().data as {
      id: number
      nombre: string
      cantidad: number
      gramaje: number
      idItem: number
      idClasificacion: number | null
      clasificacion: { id: number; nombre: string } | null
      valorUnitarioPromedio: number | null
      porcentajeAumento: number | null
      valorConAumento: number | null
      item: { nombre: string }
    }
    assert.equal(elemento.cantidad, 10)
    assert.equal(elemento.gramaje, 1.5)
    assert.equal(elemento.idItem, item.id)
    assert.equal(elemento.nombre, item.nombre)
    assert.equal(elemento.item.nombre, item.nombre)
    assert.isNull(elemento.valorConAumento)
    assert.isNull(elemento.idClasificacion)

    const clasificaciones = await client.get('/api/v1/clasificaciones-elemento').bearerToken(token)
    clasificaciones.assertStatus(200)
    const consumo = (
      clasificaciones.body().data as { id: number; nombre: string }[]
    ).find((itemClasificacion) => itemClasificacion.nombre === 'CONSUMO')
    assert.exists(consumo)

    const ficha = await client
      .patch(`/api/v1/inventario/elementos/${elemento.id}`)
      .bearerToken(token)
      .json({
        idClasificacion: consumo!.id,
        valorUnitarioPromedio: 1000,
        porcentajeAumento: 15,
      })
    ficha.assertStatus(200)

    const conQuince = ficha.body().data as {
      idClasificacion: number
      clasificacion: { nombre: string }
      valorUnitarioPromedio: number
      porcentajeAumento: number
      valorConAumento: number
    }
    assert.equal(conQuince.idClasificacion, consumo!.id)
    assert.equal(conQuince.clasificacion.nombre, 'CONSUMO')
    assert.equal(conQuince.valorUnitarioPromedio, 1000)
    assert.equal(conQuince.porcentajeAumento, 15)
    assert.equal(conQuince.valorConAumento, 11500)

    const otroAnio = await client
      .patch(`/api/v1/inventario/elementos/${elemento.id}`)
      .bearerToken(token)
      .json({ porcentajeAumento: 9 })
    otroAnio.assertStatus(200)
    assert.equal(otroAnio.body().data.valorConAumento, 10900)
    assert.equal(otroAnio.body().data.porcentajeAumento, 9)

    const codigos = await client.get('/api/v1/codigos-estandar').bearerToken(token)
    codigos.assertStatus(200)
    const resina = (codigos.body().data as { id: number; codigo: string; nombre: string }[]).find(
      (codigo) => codigo.codigo === '13111305'
    )
    assert.exists(resina)
    assert.equal(resina!.nombre, 'RESINA O ESPUMA')

    const conCodigo = await client
      .patch(`/api/v1/inventario/elementos/${elemento.id}`)
      .bearerToken(token)
      .json({ idCodigoEstandar: resina!.id })
    conCodigo.assertStatus(200)
    assert.equal(conCodigo.body().data.idCodigoEstandar, resina!.id)
    assert.equal(conCodigo.body().data.codigoEstandar.codigo, '13111305')
    assert.equal(conCodigo.body().data.codigoEstandar.nombre, 'RESINA O ESPUMA')
  })
})
