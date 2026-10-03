import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'

async function login(client: ApiClient, email: string) {
  const response = await client.post('/api/v1/auth/login').json({ email, password: '123456' })
  response.assertStatus(200)
  return response.body().data.token as string
}

test.group('Flujo obra, equipo y material', () => {
  test('el instructor pide, bodega entrega y el equipo se devuelve con novedad', async ({
    client,
    assert,
  }) => {
    const admin = await login(client, 'carlos@correo.com')
    const bodega = await login(client, 'adminbodega@correo.com')
    const instructor = await login(client, 'instructor@correo.com')
    const suffix = Date.now()

    const categoriaRes = await client
      .post('/api/v1/categorias')
      .bearerToken(admin)
      .json({ nombre: `Flujo ${suffix}`, estado: true })
    categoriaRes.assertStatus(200)
    const categoriaId = categoriaRes.body().data.id as number

    const subcategoriaRes = await client
      .post('/api/v1/subcategorias')
      .bearerToken(admin)
      .json({ idCategoria: categoriaId, nombre: `Sub flujo ${suffix}`, estado: true })
    subcategoriaRes.assertStatus(200)
    const subcategoriaId = subcategoriaRes.body().data.id as number

    const itemHerramienta = await client
      .post('/api/v1/inventario/items')
      .bearerToken(admin)
      .json({
        nombre: `Taladro ${suffix}`,
        descripcion: 'Equipo devolutivo',
        idSubcategoria: subcategoriaId,
      })
    itemHerramienta.assertStatus(200)

    const itemMaterial = await client
      .post('/api/v1/inventario/items')
      .bearerToken(admin)
      .json({
        nombre: `Tornillo ${suffix}`,
        descripcion: 'Material de consumo',
        idSubcategoria: subcategoriaId,
      })
    itemMaterial.assertStatus(200)

    const bodegas = await client.get('/api/v1/bodegas').bearerToken(bodega)
    bodegas.assertStatus(200)
    const bodegaId = (bodegas.body().data as { id: number }[])[0].id

    const subBodega = await client
      .post(`/api/v1/bodegas/${bodegaId}/sub-bodegas`)
      .bearerToken(admin)
      .json({ nombre: `Sub flujo ${suffix}` })
    subBodega.assertStatus(200)

    const stand = await client
      .post(`/api/v1/bodegas/sub-bodegas/${subBodega.body().data.id}/stands`)
      .bearerToken(admin)
      .json({ nombre: `Stand flujo ${suffix}` })
    stand.assertStatus(200)
    const standId = stand.body().data.id as number

    const unidades = await client.get('/api/v1/unidades-medida').bearerToken(admin)
    unidades.assertStatus(200)
    const unidadId = (unidades.body().data as { id: number }[])[0].id

    const clasificaciones = await client.get('/api/v1/clasificaciones-elemento').bearerToken(admin)
    clasificaciones.assertStatus(200)
    const clases = clasificaciones.body().data as { id: number; nombre: string; caracter: string }[]
    const herramienta = clases.find((row) => row.nombre === 'HERRAMIENTA')
    const consumo = clases.find((row) => row.nombre === 'CONSUMO')
    assert.exists(herramienta)
    assert.equal(herramienta!.caracter, 'devolutivo')
    assert.exists(consumo)
    assert.equal(consumo!.caracter, 'consumo')

    const equipo = await client
      .post('/api/v1/inventario/elementos')
      .bearerToken(admin)
      .json({
        idItem: itemHerramienta.body().data.id,
        idStand: standId,
        cantidad: 20,
        estado: true,
        idUnidadMedida: unidadId,
        codigo: `EQ-${suffix}`,
        idClasificacion: herramienta!.id,
      })
    equipo.assertStatus(200)
    const equipoId = equipo.body().data.id as number

    const material = await client
      .post('/api/v1/inventario/elementos')
      .bearerToken(admin)
      .json({
        idItem: itemMaterial.body().data.id,
        idStand: standId,
        cantidad: 20,
        estado: true,
        idUnidadMedida: unidadId,
        codigo: `MAT-${suffix}`,
        idClasificacion: consumo!.id,
      })
    material.assertStatus(200)
    const materialId = material.body().data.id as number

    const obraAjena = await client
      .post('/api/v1/obras')
      .bearerToken(instructor)
      .json({ nombre: `Obra instructor ${suffix}` })
    obraAjena.assertStatus(403)

    const obra = await client
      .post('/api/v1/obras')
      .bearerToken(bodega)
      .json({ nombre: `Obra flujo ${suffix}`, lugar: 'Taller 1' })
    obra.assertStatus(200)
    const obraId = obra.body().data.id as number

    const visto = await client.get(`/api/v1/inventario/elementos/${materialId}`).bearerToken(instructor)
    visto.assertStatus(200)
    assert.equal(Number(visto.body().data.cantidad), 20)
    assert.equal(Number(visto.body().data.disponible), 20)

    const sinStock = await client
      .post('/api/v1/solicitudes-material')
      .bearerToken(instructor)
      .json({
        codigoSolicitud: `MAT-MAL-${suffix}`,
        idObra: obraId,
        idElemento: materialId,
        cantidad: 21,
      })
    sinStock.assertStatus(422)

    const pedidoBodega = await client
      .post('/api/v1/solicitudes-material')
      .bearerToken(bodega)
      .json({
        codigoSolicitud: `MAT-BOD-${suffix}`,
        idObra: obraId,
        idElemento: materialId,
        cantidad: 1,
      })
    pedidoBodega.assertStatus(403)

    const pedido = await client
      .post('/api/v1/solicitudes-material')
      .bearerToken(instructor)
      .json({
        codigoSolicitud: `MAT-${suffix}`,
        idObra: obraId,
        idElemento: materialId,
        cantidad: 5,
      })
    pedido.assertStatus(201)
    const pedidoId = pedido.body().data.id as number
    assert.equal(pedido.body().data.estado, 'pendiente')

    const reservado = await client
      .get(`/api/v1/inventario/elementos/${materialId}`)
      .bearerToken(instructor)
    reservado.assertStatus(200)
    assert.equal(Number(reservado.body().data.cantidad), 20)
    assert.equal(Number(reservado.body().data.disponible), 15)

    const entregaInstructor = await client
      .patch(`/api/v1/solicitudes-material/${pedidoId}/entregar`)
      .bearerToken(instructor)
    entregaInstructor.assertStatus(403)

    const pendientes = await client
      .get('/api/v1/solicitudes-material')
      .bearerToken(bodega)
      .qs({ estado: 'pendiente' })
    pendientes.assertStatus(200)
    const filas = pendientes.body().data as { id: number }[]
    assert.isTrue(filas.some((row) => row.id === pedidoId))

    const materialEntregado = await client
      .patch(`/api/v1/solicitudes-material/${pedidoId}/entregar`)
      .bearerToken(bodega)
    materialEntregado.assertStatus(200)
    assert.equal(materialEntregado.body().data.estado, 'entregado')

    const stockMaterial = await client
      .get(`/api/v1/inventario/elementos/${materialId}`)
      .bearerToken(bodega)
    stockMaterial.assertStatus(200)
    assert.equal(Number(stockMaterial.body().data.cantidad), 15)
    assert.equal(Number(stockMaterial.body().data.disponible), 15)

    const equipoEnMaterial = await client
      .post('/api/v1/solicitudes-equipo')
      .bearerToken(instructor)
      .json({
        codigoSolicitud: `EQ-MAL-${suffix}`,
        idObra: obraId,
        idElemento: materialId,
        cantidad: 1,
      })
    equipoEnMaterial.assertStatus(422)

    const prestamo = await client
      .post('/api/v1/solicitudes-equipo')
      .bearerToken(instructor)
      .json({
        codigoSolicitud: `EQ-${suffix}`,
        idObra: obraId,
        idElemento: equipoId,
        cantidad: 4,
        observacion: 'Para la obra',
      })
    prestamo.assertStatus(201)
    const solicitudId = prestamo.body().data.id as number
    assert.equal(prestamo.body().data.estado, 'pendiente')
    assert.equal(prestamo.body().data.obra.id, obraId)

    const kardexEquipo = await client
      .get(`/api/v1/inventario/elementos/${equipoId}`)
      .bearerToken(instructor)
    kardexEquipo.assertStatus(200)
    assert.equal(Number(kardexEquipo.body().data.cantidad), 20)
    assert.equal(Number(kardexEquipo.body().data.disponible), 16)

    const entregado = await client
      .patch(`/api/v1/solicitudes-equipo/${solicitudId}/entregar`)
      .bearerToken(bodega)
    entregado.assertStatus(200)
    assert.equal(entregado.body().data.estado, 'entregado')
    assert.equal(Number(entregado.body().data.elemento.cantidad), 16)

    const devolucionBodega = await client
      .patch(`/api/v1/solicitudes-equipo/${solicitudId}/devolver`)
      .bearerToken(bodega)
      .json({ estadoElemento: 'bueno' })
    devolucionBodega.assertStatus(403)

    const devuelto = await client
      .patch(`/api/v1/solicitudes-equipo/${solicitudId}/devolver`)
      .bearerToken(instructor)
      .json({ estadoElemento: 'bueno', observacion: 'Regresa completo' })
    devuelto.assertStatus(200)
    assert.equal(devuelto.body().data.estado, 'devuelto')
    assert.equal(devuelto.body().data.estadoElemento, 'bueno')
    assert.equal(Number(devuelto.body().data.elemento.cantidad), 20)

    const prestamoDanado = await client
      .post('/api/v1/solicitudes-equipo')
      .bearerToken(instructor)
      .json({
        codigoSolicitud: `EQ-DAN-${suffix}`,
        idObra: obraId,
        idElemento: equipoId,
        cantidad: 3,
      })
    prestamoDanado.assertStatus(201)
    const danadoId = prestamoDanado.body().data.id as number

    const entregadoDanado = await client
      .patch(`/api/v1/solicitudes-equipo/${danadoId}/entregar`)
      .bearerToken(bodega)
    entregadoDanado.assertStatus(200)
    assert.equal(Number(entregadoDanado.body().data.elemento.cantidad), 17)

    const devueltoDanado = await client
      .patch(`/api/v1/solicitudes-equipo/${danadoId}/devolver`)
      .bearerToken(instructor)
      .json({ estadoElemento: 'danado', observacion: 'No vuelve al stock' })
    devueltoDanado.assertStatus(200)
    assert.equal(devueltoDanado.body().data.estadoElemento, 'danado')
    assert.equal(Number(devueltoDanado.body().data.elemento.cantidad), 17)
  })
})
