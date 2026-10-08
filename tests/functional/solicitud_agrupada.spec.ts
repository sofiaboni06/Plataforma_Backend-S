import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import db from '@adonisjs/lucid/services/db'

type Fila = {
  id: number
  tipo: 'material' | 'equipo'
  idElemento: number
  estado: string
  cantidad: number
  cantidadEntregada: number
  cantidadPendiente: number
}

type Factura = {
  codigoSolicitud: string
  estado: string
  totales: { lineas: number; cantidadPendiente: number }
  detalle: Fila[]
}

type Aviso = { tipo: string; titulo: string; mensaje: string }

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

async function avisosDonde(client: ApiClient, token: string, cumple: (row: Aviso) => boolean) {
  const avisos = await bandeja(client, token)
  return avisos.filter(cumple)
}

function datosDe<T>(response: { body: () => unknown }) {
  return (response.body() as { data: T }).data
}

async function preparar(client: ApiClient, admin: string, bodega: string, suffix: number) {
  const categoria = await client
    .post('/api/v1/categorias')
    .bearerToken(admin)
    .json({ nombre: `Agrupada ${suffix}`, estado: true })
  categoria.assertStatus(200)

  const subcategoria = await client
    .post('/api/v1/subcategorias')
    .bearerToken(admin)
    .json({ idCategoria: categoria.body().data.id, nombre: `Sub agrupada ${suffix}`, estado: true })
  subcategoria.assertStatus(200)
  const idSubcategoria = subcategoria.body().data.id as number

  const bodegas = await client.get('/api/v1/bodegas').bearerToken(bodega)
  bodegas.assertStatus(200)
  const bodegaId = (bodegas.body().data as { id: number }[])[0].id

  const subBodega = await client
    .post(`/api/v1/bodegas/${bodegaId}/sub-bodegas`)
    .bearerToken(admin)
    .json({ nombre: `Sub agrupada ${suffix}` })
  subBodega.assertStatus(200)

  const stand = await client
    .post(`/api/v1/bodegas/sub-bodegas/${subBodega.body().data.id}/stands`)
    .bearerToken(admin)
    .json({ nombre: `Stand agrupada ${suffix}` })
  stand.assertStatus(200)
  const idStand = stand.body().data.id as number

  const unidades = await client.get('/api/v1/unidades-medida').bearerToken(admin)
  const idUnidadMedida = (unidades.body().data as { id: number }[])[0].id

  const clasificaciones = await client.get('/api/v1/clasificaciones-elemento').bearerToken(admin)
  const clases = clasificaciones.body().data as { id: number; nombre: string }[]
  const consumo = clases.find((row) => row.nombre === 'MATERIAL DE CONSUMO')!
  const herramienta = clases.find((row) => row.nombre === 'HERRAMIENTA')!

  const elemento = async (
    nombre: string,
    cantidad: number,
    idClasificacion: number,
    caracter: 'consumo' | 'devolutivo'
  ) => {
    const item = await client
      .post('/api/v1/inventario/items')
      .bearerToken(admin)
      .json({ nombre: `${nombre} ${suffix}`, descripcion: nombre, idSubcategoria })
    item.assertStatus(200)

    const response = await client
      .post('/api/v1/inventario/elementos')
      .bearerToken(admin)
      .json({
        idItem: item.body().data.id,
        nombre: `${nombre} ${suffix}`,
        idStand,
        cantidad: 10,
        estado: true,
        idUnidadMedida,
        codigo: `AGR-${nombre.slice(0, 3).toUpperCase()}-${suffix}`,
        idClasificacion,
        caracter,
      })
    response.assertStatus(200)
    const id = response.body().data.id as number
    // La existencia exacta del caso, sin pasar por un ingreso.
    await db.from('elemento').where('id_elemento', id).update({ cantidad })
    return id
  }

  const obra = await client
    .post('/api/v1/obras')
    .bearerToken(bodega)
    .json({ nombre: `Obra agrupada ${suffix}` })
  obra.assertStatus(200)

  return {
    idObra: obra.body().data.id as number,
    pinturaId: await elemento('Pintura', 10, consumo.id, 'consumo'),
    lijaId: await elemento('Lija', 2, consumo.id, 'consumo'),
    cintaId: await elemento('Cinta', 0, consumo.id, 'consumo'),
    taladroId: await elemento('Taladro', 5, herramienta.id, 'devolutivo'),
    pulidoraId: await elemento('Pulidora', 5, herramienta.id, 'devolutivo'),
  }
}

test.group('Solicitud agrupada para bodega', () => {
  test('bodega ve el pedido como una sola solicitud y recibe un solo aviso', async ({
    client,
    assert,
  }) => {
    const admin = await login(client, 'carlos@correo.com')
    const bodega = await login(client, 'adminbodega@correo.com')
    const instructor = await login(client, 'instructor@correo.com')
    const suffix = Date.now()
    const { idObra, pinturaId, lijaId, cintaId } = await preparar(client, admin, bodega, suffix)
    const codigo = `AGR-${suffix}`

    const creada = await client
      .post('/api/v1/solicitudes')
      .bearerToken(instructor)
      .json({
        codigoSolicitud: codigo,
        idObra,
        tipo: 'consumo',
        elementos: [
          { idElemento: pinturaId, cantidad: 3 },
          { idElemento: lijaId, cantidad: 5 },
          { idElemento: cintaId, cantidad: 1 },
        ],
      })
    creada.assertStatus(201)

    // Un aviso para bodega por el pedido completo, no uno por elemento.
    const avisosBodega = await avisosDonde(client, bodega, (row) => row.titulo.includes(codigo))
    assert.lengthOf(avisosBodega, 1)
    assert.equal(avisosBodega[0].tipo, 'solicitud_material')
    assert.equal(
      avisosBodega[0].titulo,
      `Nueva solicitud ${codigo} de Camilo Instructor: 3 elementos`
    )
    assert.include(avisosBodega[0].mensaje, `3 de Pintura ${suffix}`)
    assert.include(avisosBodega[0].mensaje, `1 de Cinta ${suffix}`)

    // El listado de bodega trae el pedido una vez, con sus tres filas.
    const porEntregar = await client
      .get('/api/v1/solicitudes')
      .bearerToken(bodega)
      .qs({ estado: 'pendiente' })
    porEntregar.assertStatus(200)
    const delPedido = datosDe<Factura[]>(porEntregar).filter(
      (row) => row.codigoSolicitud === codigo
    )
    assert.lengthOf(delPedido, 1)
    assert.equal(delPedido[0].totales.lineas, 3)
    assert.sameMembers(
      delPedido[0].detalle.map((row) => row.idElemento),
      [pinturaId, lijaId, cintaId]
    )

    // Solo quien entrega puede entregar el pedido completo.
    const sinPermiso = await client
      .patch(`/api/v1/solicitudes/${encodeURIComponent(codigo)}/entregar`)
      .bearerToken(instructor)
    sinPermiso.assertStatus(403)

    const noExiste = await client
      .patch(`/api/v1/solicitudes/NO-EXISTE-${suffix}/entregar`)
      .bearerToken(bodega)
    noExiste.assertStatus(404)

    // Sale todo lo disponible: la pintura completa, 2 de 5 lijas, la cinta no.
    const entrega = await client
      .patch(`/api/v1/solicitudes/${encodeURIComponent(codigo)}/entregar`)
      .bearerToken(bodega)
    entrega.assertStatus(200)
    const despues = datosDe<Factura>(entrega)
    assert.equal(despues.estado, 'parcial')
    const fila = (id: number) => despues.detalle.find((row) => row.idElemento === id)!
    assert.equal(fila(pinturaId).estado, 'entregado')
    assert.equal(fila(lijaId).estado, 'parcial')
    assert.equal(fila(lijaId).cantidadEntregada, 2)
    assert.equal(fila(lijaId).cantidadPendiente, 3)
    assert.equal(fila(cintaId).estado, 'pendiente')
    assert.equal(despues.totales.cantidadPendiente, 4)

    // El instructor recibe un solo aviso con lo que salió y lo que falta.
    const avisosInstructor = await avisosDonde(client, instructor, (row) =>
      row.mensaje.includes(codigo)
    )
    assert.lengthOf(avisosInstructor, 1)
    assert.equal(avisosInstructor[0].tipo, 'entrega_material')
    assert.equal(avisosInstructor[0].titulo, 'Material entregado en parte')
    assert.equal(
      avisosInstructor[0].mensaje,
      `Te entregaron 3 de Pintura ${suffix} y 2 de Lija ${suffix} de tu solicitud ${codigo}. Quedan pendientes 3 de Lija ${suffix} y 1 de Cinta ${suffix}.`
    )

    // Ya no hay existencia para nada de lo pendiente: no se entrega nada.
    const sinExistencia = await client
      .patch(`/api/v1/solicitudes/${encodeURIComponent(codigo)}/entregar`)
      .bearerToken(bodega)
    sinExistencia.assertStatus(422)
    assert.equal((sinExistencia.body() as { code: string }).code, 'E_SIN_STOCK')

    // El filtro va por el estado del pedido: ahora es parcial, no pendiente.
    const parciales = await client
      .get('/api/v1/solicitudes')
      .bearerToken(bodega)
      .qs({ estado: 'parcial' })
    assert.isTrue(datosDe<Factura[]>(parciales).some((row) => row.codigoSolicitud === codigo))
    const pendientes = await client
      .get('/api/v1/solicitudes')
      .bearerToken(bodega)
      .qs({ estado: 'pendiente' })
    assert.isFalse(datosDe<Factura[]>(pendientes).some((row) => row.codigoSolicitud === codigo))

    // Llega más lija: entregar lo pendiente de esa fila sigue funcionando.
    await db.from('elemento').where('id_elemento', lijaId).update({ cantidad: 10 })
    const lija = await client
      .patch(`/api/v1/solicitudes-material/${fila(lijaId).id}/entregar`)
      .bearerToken(bodega)
    lija.assertStatus(200)
    const [actualizada] = await avisosDonde(
      client,
      instructor,
      (row) => row.titulo === 'Solicitud actualizada' && row.mensaje.includes(`Lija ${suffix}`)
    )

    assert.exists(actualizada)

    // Llega la cinta: con una sola fila por entregar, el aviso es el de siempre.
    await db.from('elemento').where('id_elemento', cintaId).update({ cantidad: 4 })
    const resto = await client
      .patch(`/api/v1/solicitudes/${encodeURIComponent(codigo)}/entregar`)
      .bearerToken(bodega)
    resto.assertStatus(200)
    assert.equal(datosDe<Factura>(resto).estado, 'cerrado')
    const [cinta] = await avisosDonde(client, instructor, (row) =>
      row.mensaje.startsWith(`Te entregaron 1 de Cinta ${suffix}`)
    )

    assert.equal(cinta?.titulo, 'Material entregado')

    const yaCompleta = await client
      .patch(`/api/v1/solicitudes/${encodeURIComponent(codigo)}/entregar`)
      .bearerToken(bodega)
    yaCompleta.assertStatus(422)
  })

  test('entregar todo un pedido de equipo completa una parcial con "Solicitud actualizada"', async ({
    client,
    assert,
  }) => {
    const admin = await login(client, 'carlos@correo.com')
    const bodega = await login(client, 'adminbodega@correo.com')
    const instructor = await login(client, 'instructor@correo.com')
    const suffix = Date.now()
    const { idObra, taladroId, pulidoraId } = await preparar(client, admin, bodega, suffix)
    const codigo = `AGR-EQ-${suffix}`

    const creada = await client
      .post('/api/v1/solicitudes')
      .bearerToken(instructor)
      .json({
        codigoSolicitud: codigo,
        idObra,
        tipo: 'devolutivo',
        elementos: [
          { idElemento: taladroId, cantidad: 2 },
          { idElemento: pulidoraId, cantidad: 3 },
        ],
      })
    creada.assertStatus(201)
    const filas = datosDe<Factura>(creada).detalle
    const taladro = filas.find((row) => row.idElemento === taladroId)!

    // Primero sale un taladro solo; después el resto del pedido en un paso.
    const uno = await client
      .patch(`/api/v1/solicitudes-equipo/${taladro.id}/entregar`)
      .bearerToken(bodega)
      .json({ cantidad: 1 })
    uno.assertStatus(200)

    const todo = await client
      .patch(`/api/v1/solicitudes/${encodeURIComponent(codigo)}/entregar`)
      .bearerToken(bodega)
    todo.assertStatus(200)
    assert.equal(datosDe<Factura>(todo).estado, 'entregado')

    const avisos = await avisosDonde(client, instructor, (row) =>
      row.mensaje.includes(`de tu solicitud ${codigo}.`)
    )
    assert.lengthOf(avisos, 1)
    assert.equal(avisos[0].tipo, 'entrega_equipo')
    assert.equal(avisos[0].titulo, 'Solicitud actualizada')
    assert.equal(
      avisos[0].mensaje,
      `Te entregaron 1 de Taladro ${suffix} y 3 de Pulidora ${suffix} de tu solicitud ${codigo}.`
    )
  })
})
