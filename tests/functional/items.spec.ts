import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'

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

    const categoriaRes = await client
      .post('/api/v1/categorias')
      .bearerToken(token)
      .json({ nombre: `Pinturas ${suffix}`, estado: true })
    categoriaRes.assertStatus(200)
    const categoria = categoriaRes.body().data as { id: number; nombre: string }

    const subcategoriaRes = await client
      .post('/api/v1/subcategorias')
      .bearerToken(token)
      .json({ idCategoria: categoria.id, nombre: `Vinilos ${suffix}`, estado: true })
    subcategoriaRes.assertStatus(200)
    const subcategoria = subcategoriaRes.body().data as {
      id: number
      idCategoria: number
      nombre: string
    }
    assert.equal(subcategoria.idCategoria, categoria.id)

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
    assert.equal(item.subcategoria.categoria?.id, categoria.id)
    assert.equal(item.subcategoria.categoria?.nombre, categoria.nombre)

    const bodegas = await client.get('/api/v1/bodegas').bearerToken(token)
    bodegas.assertStatus(200)
    const bodega = (bodegas.body().data as { id: number; idCformacion: number }[])[0]
    assert.exists(bodega)
    assert.exists(bodega.idCformacion)

    const subRes = await client
      .post(`/api/v1/bodegas/${bodega.id}/sub-bodegas`)
      .bearerToken(token)
      .json({ nombre: `Madera ${suffix}` })
    subRes.assertStatus(200)
    const subBodega = subRes.body().data as {
      id: number
      idBodega: number
      bodega: { id: number }
    }
    assert.equal(subBodega.idBodega, bodega.id)
    assert.equal(subBodega.bodega.id, bodega.id)

    const standRes = await client
      .post(`/api/v1/bodegas/sub-bodegas/${subBodega.id}/stands`)
      .bearerToken(token)
      .json({ nombre: `Estante 1 ${suffix}` })
    standRes.assertStatus(200)
    const stand = standRes.body().data as {
      id: number
      idSubBodega: number
      subBodega: { id: number; idBodega: number }
      bodega: { id: number }
    }
    assert.equal(stand.idSubBodega, subBodega.id)
    assert.equal(stand.subBodega.idBodega, bodega.id)
    assert.equal(stand.bodega.id, bodega.id)

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
      cantidadMinima: number
      idUsoPresupuestal: number | null
      valorUnitarioPromedio: number | null
      porcentajeAumento: number | null
      valorConAumento: number | null
      item: {
        nombre: string
        subcategoria: { id: number; categoria: { id: number; nombre: string } }
      }
      idSubcategoria: number
      subcategoria: { id: number; nombre: string; categoria: { id: number; nombre: string } }
      stand: {
        id: number
        subBodega: { id: number; idBodega: number; bodega: { id: number } }
      }
    }
    assert.equal(elemento.cantidad, 10)
    assert.equal(elemento.cantidadMinima, 10)
    assert.isNull(elemento.idUsoPresupuestal)
    assert.equal(elemento.gramaje, 1.5)
    assert.equal(elemento.idItem, item.id)
    assert.equal(elemento.nombre, item.nombre)
    assert.equal(elemento.item.nombre, item.nombre)
    assert.equal(elemento.idSubcategoria, subcategoria.id)
    assert.equal(elemento.subcategoria.id, subcategoria.id)
    assert.equal(elemento.subcategoria.categoria.id, categoria.id)
    assert.equal(elemento.subcategoria.categoria.nombre, categoria.nombre)
    assert.equal(elemento.item.subcategoria.id, subcategoria.id)
    assert.equal(elemento.item.subcategoria.categoria.nombre, categoria.nombre)
    assert.equal(elemento.stand.id, stand.id)
    assert.equal(elemento.stand.subBodega.id, subBodega.id)
    assert.equal(elemento.stand.subBodega.idBodega, bodega.id)
    assert.equal(elemento.stand.subBodega.bodega.id, bodega.id)
    assert.isNull(elemento.valorConAumento)
    assert.isNull(elemento.idClasificacion)

    const clasificaciones = await client.get('/api/v1/clasificaciones-elemento').bearerToken(token)
    clasificaciones.assertStatus(200)
    const consumo = (clasificaciones.body().data as { id: number; nombre: string }[]).find(
      (itemClasificacion) => itemClasificacion.nombre === 'CONSUMO'
    )
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

    const usos = await client.get('/api/v1/usos-presupuestales').bearerToken(token)
    usos.assertStatus(200)
    const minerales = (usos.body().data as { id: number; nombre: string }[]).find(
      (uso) => uso.nombre === 'MINERALES; ELECTRICIDAD, GAS Y AGUA'
    )
    assert.exists(minerales)

    const conUso = await client
      .patch(`/api/v1/inventario/elementos/${elemento.id}`)
      .bearerToken(token)
      .json({ idUsoPresupuestal: minerales!.id, cantidadMinima: 15 })
    conUso.assertStatus(200)
    assert.equal(conUso.body().data.idUsoPresupuestal, minerales!.id)
    assert.equal(conUso.body().data.usoPresupuestal.nombre, 'MINERALES; ELECTRICIDAD, GAS Y AGUA')
    assert.equal(conUso.body().data.cantidadMinima, 15)
  })
})
