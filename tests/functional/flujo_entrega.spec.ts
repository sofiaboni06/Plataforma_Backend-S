import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'

async function login(client: ApiClient, email: string) {
  const response = await client.post('/api/v1/auth/login').json({ email, password: '123456' })
  response.assertStatus(200)
  return response.body().data.token as string
}

function datosDe<T>(response: { body(): unknown }) {
  return (response.body() as { data: T }).data
}

test.group('Flujo obra, equipo y material', () => {
  test('el instructor pide, bodega entrega y bodega recibe el equipo con su novedad', async ({
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
    const categoriaId = datosDe<{ id: number }>(categoriaRes).id

    const subcategoriaRes = await client
      .post('/api/v1/subcategorias')
      .bearerToken(admin)
      .json({ idCategoria: categoriaId, nombre: `Sub flujo ${suffix}`, estado: true })
    subcategoriaRes.assertStatus(200)
    const subcategoriaId = datosDe<{ id: number }>(subcategoriaRes).id

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
      .post(`/api/v1/bodegas/sub-bodegas/${datosDe<{ id: number }>(subBodega).id}/stands`)
      .bearerToken(admin)
      .json({ nombre: `Stand flujo ${suffix}` })
    stand.assertStatus(200)
    const standId = datosDe<{ id: number }>(stand).id

    const unidades = await client.get('/api/v1/unidades-medida').bearerToken(admin)
    unidades.assertStatus(200)
    const unidadId = (unidades.body().data as { id: number }[])[0].id

    const clasificaciones = await client.get('/api/v1/clasificaciones-elemento').bearerToken(admin)
    clasificaciones.assertStatus(200)
    const clases = clasificaciones.body().data as { id: number; nombre: string; caracter: string }[]
    const herramienta = clases.find((row) => row.nombre === 'HERRAMIENTA')
    const consumo = clases.find((row) => row.nombre === 'MATERIAL DE CONSUMO')
    assert.exists(herramienta)
    assert.equal(herramienta!.caracter, 'devolutivo')
    assert.exists(consumo)
    assert.equal(consumo!.caracter, 'consumo')

    const equipo = await client
      .post('/api/v1/inventario/elementos')
      .bearerToken(admin)
      .json({
        idItem: datosDe<{ id: number }>(itemHerramienta).id,
        nombre: `Taladro ${suffix}`,
        idStand: standId,
        cantidad: 20,
        estado: true,
        idUnidadMedida: unidadId,
        codigo: `EQ-${suffix}`,
        idClasificacion: herramienta!.id,
        caracter: 'devolutivo',
      })
    equipo.assertStatus(200)
    const equipoId = datosDe<{ id: number }>(equipo).id

    const material = await client
      .post('/api/v1/inventario/elementos')
      .bearerToken(admin)
      .json({
        idItem: datosDe<{ id: number }>(itemMaterial).id,
        nombre: `Tornillo ${suffix}`,
        idStand: standId,
        cantidad: 20,
        estado: true,
        idUnidadMedida: unidadId,
        codigo: `MAT-${suffix}`,
        idClasificacion: consumo!.id,
        caracter: 'consumo',
      })
    material.assertStatus(200)
    const materialId = datosDe<{ id: number }>(material).id

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
    const obraId = datosDe<{ id: number }>(obra).id

    const visto = await client.get(`/api/v1/inventario/elementos/${materialId}`).bearerToken(instructor)
    visto.assertStatus(200)
    assert.notProperty(visto.body().data, 'cantidad')
    assert.notProperty(visto.body().data, 'cantidadMinima')
    assert.isNull(visto.body().data.stand)
    // Solo ve cuánto puede pedir, no la existencia.
    assert.equal(visto.body().data.disponible, 20)

    const enBodega = await client.get(`/api/v1/inventario/elementos/${materialId}`).bearerToken(bodega)
    enBodega.assertStatus(200)
    assert.equal(Number(enBodega.body().data.cantidad), 20)
    assert.equal(Number(enBodega.body().data.disponible), 20)

    const sinCantidad = await client
      .post('/api/v1/solicitudes-material')
      .bearerToken(instructor)
      .json({
        codigoSolicitud: `MAT-MAL-${suffix}`,
        idObra: obraId,
        idElemento: materialId,
        cantidad: 0,
      })
    sinCantidad.assertStatus(422)

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
    const pedidoId = datosDe<{ id: number }>(pedido).id
    assert.equal(datosDe<{ estado: string }>(pedido).estado, 'pendiente')

    const reservado = await client
      .get(`/api/v1/inventario/elementos/${materialId}`)
      .bearerToken(bodega)
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
    const filas = datosDe<{ id: number }[]>(pendientes)
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
    const solicitudId = datosDe<{ id: number }>(prestamo).id
    assert.equal(datosDe<{ estado: string }>(prestamo).estado, 'pendiente')
    assert.equal(datosDe<{ obra: { id: number } }>(prestamo).obra.id, obraId)

    const kardexEquipo = await client
      .get(`/api/v1/inventario/elementos/${equipoId}`)
      .bearerToken(bodega)
    kardexEquipo.assertStatus(200)
    assert.equal(Number(kardexEquipo.body().data.cantidad), 20)
    assert.equal(Number(kardexEquipo.body().data.disponible), 16)

    const entregado = await client
      .patch(`/api/v1/solicitudes-equipo/${solicitudId}/entregar`)
      .bearerToken(bodega)
    entregado.assertStatus(200)
    assert.equal(entregado.body().data.estado, 'entregado')
    assert.equal(Number(entregado.body().data.elemento.cantidad), 16)

    const devolucionInstructor = await client
      .patch(`/api/v1/solicitudes-equipo/${solicitudId}/devolver`)
      .bearerToken(instructor)
      .json({ estadoElemento: 'bueno' })
    devolucionInstructor.assertStatus(403)

    const devuelto = await client
      .patch(`/api/v1/solicitudes-equipo/${solicitudId}/devolver`)
      .bearerToken(bodega)
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
    const danadoId = datosDe<{ id: number }>(prestamoDanado).id

    const entregadoDanado = await client
      .patch(`/api/v1/solicitudes-equipo/${danadoId}/entregar`)
      .bearerToken(bodega)
    entregadoDanado.assertStatus(200)
    assert.equal(Number(entregadoDanado.body().data.elemento.cantidad), 17)

    const devueltoDanado = await client
      .patch(`/api/v1/solicitudes-equipo/${danadoId}/devolver`)
      .bearerToken(bodega)
      .json({ estadoElemento: 'danado', observacion: 'No vuelve al stock' })
    devueltoDanado.assertStatus(200)
    assert.equal(devueltoDanado.body().data.estadoElemento, 'danado')
    assert.equal(Number(devueltoDanado.body().data.elemento.cantidad), 17)
  })
})
