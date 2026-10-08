import transmit from '@adonisjs/transmit/services/main'
import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'

type Aviso = {
  id: number
  tipo: string
  leida: boolean
  idReferencia: number | null
  titulo: string
}

async function login(client: ApiClient, email: string) {
  const response = await client.post('/api/v1/auth/login').json({ email, password: '123456' })
  response.assertStatus(200)
  return response.body().data.token as string
}

async function bandeja(client: ApiClient, token: string) {
  const response = await client
    .get('/api/v1/account/notifications')
    .bearerToken(token)
    .qs({ perPage: 100 })
  response.assertStatus(200)
  return response.body().data as Aviso[]
}

/**
 * Transmit rechaza la suscripción de un uid que no tiene el stream de eventos
 * abierto, así que la prueba de autorización necesita uno vivo.
 */
async function abrirStream(uid: string) {
  const conectado = new Promise<void>((resolve) => {
    const stop = transmit.on('connect', (event) => {
      if (event.uid === uid) {
        stop()
        resolve()
      }
    })
  })

  const controller = new AbortController()
  fetch(`http://${process.env.HOST}:${process.env.PORT}/__transmit/events?uid=${uid}`, {
    signal: controller.signal,
  }).catch(() => undefined)

  await conectado
  return () => controller.abort()
}

test.group('Notificaciones', () => {
  test('avisa el pedido, la entrega, la devolución y el stock que se acaba', async ({
    client,
    assert,
  }) => {
    const admin = await login(client, 'carlos@correo.com')
    const bodega = await login(client, 'adminbodega@correo.com')
    const instructor = await login(client, 'instructor@correo.com')
    const suffix = Date.now()

    const perfilBodega = await client.get('/api/v1/account/profile').bearerToken(bodega)
    perfilBodega.assertStatus(200)
    const idBodegaUser = perfilBodega.body().data.id as number

    const perfilInstructor = await client.get('/api/v1/account/profile').bearerToken(instructor)
    perfilInstructor.assertStatus(200)
    const idInstructor = perfilInstructor.body().data.id as number

    const categoriaRes = await client
      .post('/api/v1/categorias')
      .bearerToken(admin)
      .json({ nombre: `Aviso ${suffix}`, estado: true })
    categoriaRes.assertStatus(200)

    const subcategoriaRes = await client
      .post('/api/v1/subcategorias')
      .bearerToken(admin)
      .json({
        idCategoria: categoriaRes.body().data.id,
        nombre: `Sub aviso ${suffix}`,
        estado: true,
      })
    subcategoriaRes.assertStatus(200)

    const itemMaterial = await client
      .post('/api/v1/inventario/items')
      .bearerToken(admin)
      .json({
        nombre: `Cemento ${suffix}`,
        descripcion: 'Material de consumo',
        idSubcategoria: subcategoriaRes.body().data.id,
      })
    itemMaterial.assertStatus(200)

    const itemEquipo = await client
      .post('/api/v1/inventario/items')
      .bearerToken(admin)
      .json({
        nombre: `Taladro aviso ${suffix}`,
        descripcion: 'Equipo devolutivo',
        idSubcategoria: subcategoriaRes.body().data.id,
      })
    itemEquipo.assertStatus(200)

    const bodegas = await client.get('/api/v1/bodegas').bearerToken(bodega)
    bodegas.assertStatus(200)
    const bodegaId = (bodegas.body().data as { id: number }[])[0].id

    const subBodega = await client
      .post(`/api/v1/bodegas/${bodegaId}/sub-bodegas`)
      .bearerToken(admin)
      .json({ nombre: `Sub aviso ${suffix}` })
    subBodega.assertStatus(200)

    const stand = await client
      .post(`/api/v1/bodegas/sub-bodegas/${subBodega.body().data.id}/stands`)
      .bearerToken(admin)
      .json({ nombre: `Stand aviso ${suffix}` })
    stand.assertStatus(200)
    const standId = stand.body().data.id as number

    const unidades = await client.get('/api/v1/unidades-medida').bearerToken(admin)
    unidades.assertStatus(200)
    const unidadId = (unidades.body().data as { id: number }[])[0].id

    const clasificaciones = await client.get('/api/v1/clasificaciones-elemento').bearerToken(admin)
    clasificaciones.assertStatus(200)
    const clases = clasificaciones.body().data as { id: number; nombre: string }[]
    const consumo = clases.find((row) => row.nombre === 'MATERIAL DE CONSUMO')
    const herramienta = clases.find((row) => row.nombre === 'HERRAMIENTA')
    assert.exists(consumo)
    assert.exists(herramienta)

    const material = await client
      .post('/api/v1/inventario/elementos')
      .bearerToken(admin)
      .json({
        idItem: itemMaterial.body().data.id,
        nombre: `Cemento ${suffix}`,
        idStand: standId,
        cantidad: 12,
        cantidadMinima: 10,
        estado: true,
        idUnidadMedida: unidadId,
        codigo: `AV-MAT-${suffix}`,
        idClasificacion: consumo!.id,
        caracter: 'consumo',
      })
    material.assertStatus(200)
    const materialId = material.body().data.id as number

    const equipo = await client
      .post('/api/v1/inventario/elementos')
      .bearerToken(admin)
      .json({
        idItem: itemEquipo.body().data.id,
        nombre: `Taladro aviso ${suffix}`,
        idStand: standId,
        cantidad: 20,
        cantidadMinima: 10,
        estado: true,
        idUnidadMedida: unidadId,
        codigo: `AV-EQ-${suffix}`,
        idClasificacion: herramienta!.id,
        caracter: 'devolutivo',
      })
    equipo.assertStatus(200)
    const equipoId = equipo.body().data.id as number

    const obra = await client
      .post('/api/v1/obras')
      .bearerToken(bodega)
      .json({ nombre: `Obra aviso ${suffix}` })
    obra.assertStatus(200)
    const obraId = obra.body().data.id as number

    const broadcasts: { channel: string; payload: { tipo?: string } }[] = []
    const stopListening = transmit.on('broadcast', (event) => {
      broadcasts.push(event as { channel: string; payload: { tipo?: string } })
    })

    const pedido = await client
      .post('/api/v1/solicitudes-material')
      .bearerToken(instructor)
      .json({
        codigoSolicitud: `AV-MAT-${suffix}`,
        idObra: obraId,
        idElemento: materialId,
        cantidad: 3,
      })
    pedido.assertStatus(201)
    const pedidoId = pedido.body().data.id as number

    stopListening()
    assert.isTrue(
      broadcasts.some(
        (event) =>
          event.channel === `notificaciones/${idBodegaUser}` &&
          event.payload.tipo === 'solicitud_material'
      )
    )

    const bandejaBodega = await bandeja(client, bodega)
    assert.isTrue(
      bandejaBodega.some(
        (row) => row.tipo === 'solicitud_material' && row.idReferencia === pedidoId
      )
    )

    const bandejaInstructor = await bandeja(client, instructor)
    assert.isFalse(
      bandejaInstructor.some(
        (row) => row.tipo === 'solicitud_material' && row.idReferencia === pedidoId
      )
    )

    const entrega = await client
      .patch(`/api/v1/solicitudes-material/${pedidoId}/entregar`)
      .bearerToken(bodega)
    entrega.assertStatus(200)

    const trasEntrega = await bandeja(client, instructor)
    const entregaAviso = trasEntrega.find(
      (row) => row.tipo === 'entrega_material' && row.idReferencia === pedidoId
    )
    assert.exists(entregaAviso)
    assert.isFalse(entregaAviso!.leida)
    assert.isFalse(
      trasEntrega.some(
        (row) => row.tipo === 'por_agotarse' && row.titulo.includes(`Cemento ${suffix}`)
      )
    )

    const stockBodega = await bandeja(client, bodega)
    assert.isTrue(
      stockBodega.some(
        (row) => row.tipo === 'por_agotarse' && row.titulo.includes(`Cemento ${suffix}`)
      )
    )
    assert.isFalse(
      stockBodega.some((row) => row.tipo === 'entrega_material' && row.idReferencia === pedidoId)
    )

    const bandejaAdmin = await bandeja(client, admin)
    assert.isFalse(
      bandejaAdmin.some(
        (row) =>
          (row.tipo === 'solicitud_material' && row.idReferencia === pedidoId) ||
          (row.tipo === 'por_agotarse' && row.titulo.includes(`Cemento ${suffix}`))
      )
    )

    const alertasAdmin = await client.get('/api/v1/inventario/alertas').bearerToken(admin)
    alertasAdmin.assertStatus(403)

    const alertasInstructor = await client.get('/api/v1/inventario/alertas').bearerToken(instructor)
    alertasInstructor.assertStatus(403)

    const alertas = await client.get('/api/v1/inventario/alertas').bearerToken(bodega)
    alertas.assertStatus(200)
    const activas = alertas.body().data as { idElemento: number; tipo: string; estado: boolean }[]
    assert.isTrue(
      activas.some(
        (row) => row.idElemento === materialId && row.tipo === 'por_agotarse' && row.estado
      )
    )

    const todas = await client
      .patch('/api/v1/account/notifications')
      .bearerToken(instructor)
      .json({ leida: true })
    todas.assertStatus(200)
    assert.isAtLeast(todas.body().data.total, 1)
    const bandejaLeida = await bandeja(client, instructor)
    assert.isFalse(bandejaLeida.some((row) => !row.leida))

    const leida = await client
      .patch(`/api/v1/account/notifications/${entregaAviso!.id}`)
      .bearerToken(instructor)
      .json({ leida: true })
    leida.assertStatus(200)
    assert.isTrue(leida.body().data.leida)

    const ajena = await client
      .patch(`/api/v1/account/notifications/${entregaAviso!.id}`)
      .bearerToken(bodega)
      .json({ leida: true })
    ajena.assertStatus(404)

    const prestamo = await client
      .post('/api/v1/solicitudes-equipo')
      .bearerToken(instructor)
      .json({
        codigoSolicitud: `AV-EQ-${suffix}`,
        idObra: obraId,
        idElemento: equipoId,
        cantidad: 2,
      })
    prestamo.assertStatus(201)
    const prestamoId = prestamo.body().data.id as number

    const pedidoEquipo = await bandeja(client, bodega)
    assert.isTrue(
      pedidoEquipo.some((row) => row.tipo === 'solicitud_equipo' && row.idReferencia === prestamoId)
    )

    const entregado = await client
      .patch(`/api/v1/solicitudes-equipo/${prestamoId}/entregar`)
      .bearerToken(bodega)
    entregado.assertStatus(200)

    const equipoEntregado = await bandeja(client, instructor)
    assert.isTrue(
      equipoEntregado.some(
        (row) => row.tipo === 'entrega_equipo' && row.idReferencia === prestamoId
      )
    )

    const devuelto = await client
      .patch(`/api/v1/solicitudes-equipo/${prestamoId}/devolver`)
      .bearerToken(bodega)
      .json({ estadoElemento: 'bueno' })
    devuelto.assertStatus(200)

    const devolucion = await bandeja(client, instructor)
    assert.isTrue(
      devolucion.some((row) => row.tipo === 'devolucion_equipo' && row.idReferencia === prestamoId)
    )

    const uid = `notificaciones-spec-${suffix}`
    const cerrarStream = await abrirStream(uid)

    try {
      const propia = await client
        .post('/__transmit/subscribe')
        .bearerToken(instructor)
        .json({
          uid,
          channel: `notificaciones/${idInstructor}`,
        })
      propia.assertStatus(204)

      const deOtro = await client
        .post('/__transmit/subscribe')
        .bearerToken(instructor)
        .json({
          uid,
          channel: `notificaciones/${idBodegaUser}`,
        })
      deOtro.assertStatus(400)

      const anonima = await client.post('/__transmit/subscribe').json({
        uid,
        channel: `notificaciones/${idInstructor}`,
      })
      anonima.assertStatus(401)
    } finally {
      cerrarStream()
    }
  })
})
