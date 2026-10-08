import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import PrestamoService from '#services/prestamo_service'
import { hoy } from '#services/plazo'
import { DateTime } from 'luxon'

/** Días desde hoy (en Colombia), `YYYY-MM-DD`. */
function dia(desdeHoy: number) {
  return DateTime.fromISO(hoy()).plus({ days: desdeHoy }).toISODate()!
}

type Fila = {
  id: number
  tipo: 'material' | 'equipo'
  estado: string
  cantidad: number
  cantidadEntregada: number
  cantidadAfuera: number | null
  fechaInicio: string | null
  fechaDevolucionPropuesta: string | null
  fechaDevolucionLimite: string | null
  fechaEntregaRequerida: string | null
  plazo: string | null
}

type Factura = {
  codigoSolicitud: string
  estado: string
  fechaInicio: string | null
  fechaDevolucionPropuesta: string | null
  fechaDevolucionLimite: string | null
  fechaEntregaRequerida: string | null
  plazo: string | null
  usuario: { id: number }
  detalle: Fila[]
}

type Aviso = { tipo: string; titulo: string; mensaje: string }

async function login(client: ApiClient, email: string) {
  const response = await client.post('/api/v1/auth/login').json({ email, password: '123456' })
  response.assertStatus(200)
  return datosDe<{ token: string }>(response).token
}

async function bandeja(client: ApiClient, token: string) {
  const response = await client
    .get('/api/v1/account/notifications')
    .bearerToken(token)
    .qs({ perPage: 100 })
  response.assertStatus(200)
  return datosDe<Aviso[]>(response)
}

function datosDe<T>(response: { body: () => unknown }) {
  return (response.body() as { data: T }).data
}

async function preparar(client: ApiClient, admin: string, bodega: string, suffix: number) {
  const categoria = await client
    .post('/api/v1/categorias')
    .bearerToken(admin)
    .json({ nombre: `Plazos ${suffix}`, estado: true })
  categoria.assertStatus(200)

  const subcategoria = await client
    .post('/api/v1/subcategorias')
    .bearerToken(admin)
    .json({
      idCategoria: datosDe<{ id: number }>(categoria).id,
      nombre: `Sub plazos ${suffix}`,
      estado: true,
    })
  subcategoria.assertStatus(200)

  const bodegas = await client.get('/api/v1/bodegas').bearerToken(bodega)
  bodegas.assertStatus(200)
  const bodegaId = datosDe<{ id: number }[]>(bodegas)[0].id

  const subBodega = await client
    .post(`/api/v1/bodegas/${bodegaId}/sub-bodegas`)
    .bearerToken(admin)
    .json({ nombre: `Sub plazos ${suffix}` })
  subBodega.assertStatus(200)

  const stand = await client
    .post(`/api/v1/bodegas/sub-bodegas/${datosDe<{ id: number }>(subBodega).id}/stands`)
    .bearerToken(admin)
    .json({ nombre: `Stand plazos ${suffix}` })
  stand.assertStatus(200)
  const idStand = datosDe<{ id: number }>(stand).id

  const unidades = await client.get('/api/v1/unidades-medida').bearerToken(admin)
  const idUnidadMedida = datosDe<{ id: number }[]>(unidades)[0].id

  const clasificaciones = await client.get('/api/v1/clasificaciones-elemento').bearerToken(admin)
  const clases = datosDe<{ id: number; nombre: string }[]>(clasificaciones)
  const consumo = clases.find((row) => row.nombre === 'MATERIAL DE CONSUMO')!
  const herramienta = clases.find((row) => row.nombre === 'HERRAMIENTA')!

  const elemento = async (
    nombre: string,
    idClasificacion: number,
    caracter: 'consumo' | 'devolutivo'
  ) => {
    const item = await client
      .post('/api/v1/inventario/items')
      .bearerToken(admin)
      .json({
        nombre: `${nombre} ${suffix}`,
        descripcion: nombre,
        idSubcategoria: datosDe<{ id: number }>(subcategoria).id,
      })
    item.assertStatus(200)

    const response = await client
      .post('/api/v1/inventario/elementos')
      .bearerToken(admin)
      .json({
        idItem: datosDe<{ id: number }>(item).id,
        nombre: `${nombre} ${suffix}`,
        idStand,
        cantidad: 10,
        estado: true,
        idUnidadMedida,
        codigo: `PLZ-${nombre.slice(0, 3).toUpperCase()}-${suffix}`,
        idClasificacion,
        caracter,
      })
    response.assertStatus(200)
    return datosDe<{ id: number }>(response).id
  }

  const obra = await client
    .post('/api/v1/obras')
    .bearerToken(bodega)
    .json({ nombre: `Obra plazos ${suffix}` })
  obra.assertStatus(200)

  return {
    idObra: datosDe<{ id: number }>(obra).id,
    taladroId: await elemento('Taladro', herramienta.id, 'devolutivo'),
    pulidoraId: await elemento('Pulidora', herramienta.id, 'devolutivo'),
    pinturaId: await elemento('Pintura', consumo.id, 'consumo'),
  }
}

test.group('Plazos de préstamo y entrega', () => {
  test('el instructor propone fechas, bodega confirma el plazo y se avisa al vencer', async ({
    client,
    assert,
  }) => {
    const admin = await login(client, 'carlos@correo.com')
    const instructor = await login(client, 'instructor@correo.com')
    const bodega = await login(client, 'adminbodega@correo.com')
    const suffix = Date.now()
    const { idObra, taladroId, pulidoraId, pinturaId } = await preparar(
      client,
      admin,
      bodega,
      suffix
    )
    const codigo = `SOL-PLZ-${suffix}`

    // El equipo no acepta la fecha de entrega del consumo, ni al revés.
    const cruzada = await client
      .post('/api/v1/solicitudes')
      .bearerToken(instructor)
      .json({
        codigoSolicitud: codigo,
        idObra,
        tipo: 'devolutivo',
        fechaEntregaRequerida: dia(12),
        elementos: [{ idElemento: taladroId, cantidad: 2 }],
      })
    cruzada.assertStatus(422)

    const pedido = await client
      .post('/api/v1/solicitudes')
      .bearerToken(instructor)
      .json({
        codigoSolicitud: codigo,
        idObra,
        tipo: 'devolutivo',
        fechaInicio: dia(2),
        fechaDevolucionPropuesta: dia(4),
        elementos: [
          { idElemento: taladroId, cantidad: 2 },
          { idElemento: pulidoraId, cantidad: 1 },
        ],
      })
    pedido.assertStatus(201)
    const creada = datosDe<Factura>(pedido)
    assert.equal(creada.fechaInicio, dia(2))
    assert.equal(creada.fechaDevolucionPropuesta, dia(4))
    assert.isNull(creada.fechaDevolucionLimite)
    assert.equal(creada.detalle[0].plazo, null)

    // Antes de entregar, la devolución de ayer no pasa.
    const pasada = await client
      .patch(`/api/v1/solicitudes/${codigo}/entregar`)
      .bearerToken(bodega)
      .json({ fechaDevolucionLimite: dia(-1) })
    pasada.assertStatus(422)

    // Bodega entrega todo y confirma un plazo distinto al propuesto.
    const entregada = await client
      .patch(`/api/v1/solicitudes/${codigo}/entregar`)
      .bearerToken(bodega)
      .json({ fechaDevolucionLimite: dia(7) })
    entregada.assertStatus(200)
    const afuera = datosDe<Factura>(entregada)
    assert.equal(afuera.fechaDevolucionLimite, dia(7))
    assert.isTrue(afuera.detalle.every((row) => row.fechaDevolucionLimite === dia(7)))
    assert.equal(afuera.plazo, 'al_dia')

    // La lista de entregas y devoluciones lo muestra por persona.
    const lista = await client.get('/api/v1/solicitudes/prestamos').bearerToken(bodega)
    lista.assertStatus(200)
    const prestamo = datosDe<Factura[]>(lista).find((row) => row.codigoSolicitud === codigo)
    assert.exists(prestamo)
    assert.equal(prestamo!.plazo, 'al_dia')

    // El instructor no ve esa lista.
    const ajena = await client.get('/api/v1/solicitudes/prestamos').bearerToken(instructor)
    ajena.assertStatus(403)

    // Bodega corre el plazo.
    const ajustado = await client
      .patch(`/api/v1/solicitudes/${codigo}/plazo`)
      .bearerToken(bodega)
      .json({ fechaDevolucionLimite: dia(0) })
    ajustado.assertStatus(200)
    assert.equal(datosDe<Factura>(ajustado).plazo, 'vence_hoy')

    const vencidos = await client
      .get('/api/v1/solicitudes/prestamos')
      .bearerToken(bodega)
      .qs({ vista: 'vencidos' })
    vencidos.assertStatus(200)
    assert.isTrue(datosDe<Factura[]>(vencidos).some((row) => row.codigoSolicitud === codigo))

    // El aviso del día: al instructor y a bodega, y no se duplica.
    const primera = await new PrestamoService().avisarVencidos(dia(0), { emitir: false })
    assert.isAtLeast(primera.avisos, 2)
    const segunda = await new PrestamoService().avisarVencidos(dia(0), { emitir: false })
    assert.equal(segunda.avisos, 0)

    const delInstructor = await bandeja(client, instructor)
    assert.isTrue(
      delInstructor.some((row) => row.titulo === `Hoy vence la devolución de ${codigo}`)
    )

    const deBodega = await bandeja(client, bodega)
    assert.isTrue(
      deBodega.some((row) => row.titulo.includes(`Hoy vence la devolución de ${codigo}`))
    )

    // Al día siguiente, vencido, llega otro aviso distinto.
    const alOtroDia = await new PrestamoService().avisarVencidos(dia(1), { emitir: false })
    assert.isAtLeast(alOtroDia.avisos, 2)

    // Devolver todo lo cierra y ya no se avisa.
    for (const fila of datosDe<Factura>(ajustado).detalle) {
      const devuelta = await client
        .patch(`/api/v1/solicitudes-equipo/${fila.id}/devolver`)
        .bearerToken(bodega)
        .json({ estadoElemento: 'bueno' })
      devuelta.assertStatus(200)
    }

    const cerrada = await client.get(`/api/v1/solicitudes/${codigo}`).bearerToken(bodega)
    cerrada.assertStatus(200)
    assert.equal(datosDe<Factura>(cerrada).estado, 'cerrado')
    assert.isNull(datosDe<Factura>(cerrada).plazo)

    const despues = await new PrestamoService().avisarVencidos(dia(1), { emitir: false })
    assert.equal(despues.avisos, 0)

    const devueltos = await client
      .get('/api/v1/solicitudes/prestamos')
      .bearerToken(bodega)
      .qs({ vista: 'devueltos' })
    devueltos.assertStatus(200)
    assert.isTrue(datosDe<Factura[]>(devueltos).some((row) => row.codigoSolicitud === codigo))

    // El consumo lleva sus fechas y no acepta plazo de devolución.
    const material = await client
      .post('/api/v1/solicitudes')
      .bearerToken(instructor)
      .json({
        codigoSolicitud: `SOL-PLZ-MAT-${suffix}`,
        idObra,
        tipo: 'consumo',
        fechaInicio: dia(2),
        fechaEntregaRequerida: dia(4),
        elementos: [{ idElemento: pinturaId, cantidad: 3 }],
      })
    material.assertStatus(201)
    const consumo = datosDe<Factura>(material)
    assert.equal(consumo.fechaEntregaRequerida, dia(4))
    assert.isNull(consumo.fechaDevolucionPropuesta)

    const conPlazo = await client
      .patch(`/api/v1/solicitudes/SOL-PLZ-MAT-${suffix}/entregar`)
      .bearerToken(bodega)
      .json({ fechaDevolucionLimite: dia(7) })
    conPlazo.assertStatus(422)
  })
})
