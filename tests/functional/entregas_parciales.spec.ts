import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import db from '@adonisjs/lucid/services/db'

type Fila = {
  id: number
  tipo: 'material' | 'equipo'
  estado: string
  cantidad: number
  cantidadEntregada: number
  cantidadPendiente: number
  cantidadDevuelta: number | null
  cantidadAfuera: number | null
  estadoElemento: string | null
  entregas: { cantidad: number; entregadoPor: { email: string } | null }[]
  devoluciones: { cantidad: number; estadoElemento: string }[]
}

type Aviso = { tipo: string; titulo: string; mensaje: string; idReferencia: number | null }

const INSTRUCTOR_DOCUMENTO = '1001001005'
const BODEGA_DOCUMENTO = '1001001004'

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

/** Algunas rutas no traen el tipo de la respuesta: se lee `data` con el tipo esperado. */
function datosDe<T>(response: { body: () => unknown }) {
  return (response.body() as { data: T }).data
}

async function preparar(client: ApiClient, admin: string, bodega: string, suffix: number) {
  const categoria = await client
    .post('/api/v1/categorias')
    .bearerToken(admin)
    .json({ nombre: `Parcial ${suffix}`, estado: true })
  categoria.assertStatus(200)

  const subcategoria = await client
    .post('/api/v1/subcategorias')
    .bearerToken(admin)
    .json({ idCategoria: categoria.body().data.id, nombre: `Sub parcial ${suffix}`, estado: true })
  subcategoria.assertStatus(200)
  const idSubcategoria = subcategoria.body().data.id as number

  const bodegas = await client.get('/api/v1/bodegas').bearerToken(bodega)
  bodegas.assertStatus(200)
  const bodegaId = (bodegas.body().data as { id: number }[])[0].id

  const subBodega = await client
    .post(`/api/v1/bodegas/${bodegaId}/sub-bodegas`)
    .bearerToken(admin)
    .json({ nombre: `Sub parcial ${suffix}` })
  subBodega.assertStatus(200)

  const stand = await client
    .post(`/api/v1/bodegas/sub-bodegas/${subBodega.body().data.id}/stands`)
    .bearerToken(admin)
    .json({ nombre: `Stand parcial ${suffix}` })
  stand.assertStatus(200)
  const idStand = stand.body().data.id as number

  const unidades = await client.get('/api/v1/unidades-medida').bearerToken(admin)
  const idUnidadMedida = (unidades.body().data as { id: number }[])[0].id

  const clasificaciones = await client.get('/api/v1/clasificaciones-elemento').bearerToken(admin)
  const clases = clasificaciones.body().data as { id: number; nombre: string }[]
  const herramienta = clases.find((row) => row.nombre === 'HERRAMIENTA')!
  const consumo = clases.find((row) => row.nombre === 'MATERIAL DE CONSUMO')!

  const aseo = clases.find((row) => row.nombre === 'ELEMENTO DE ASEO')!

  const elemento = async (
    nombre: string,
    codigo: string,
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
        codigo: `${codigo}-${suffix}`,
        idClasificacion,
        caracter,
      })
    response.assertStatus(200)
    return response.body().data.id as number
  }

  const obra = await client
    .post('/api/v1/obras')
    .bearerToken(bodega)
    .json({ nombre: `Obra parcial ${suffix}` })
  obra.assertStatus(200)

  return {
    idObra: obra.body().data.id as number,
    pinturaId: await elemento('Pintura', 'PAR-PIN', consumo.id, 'consumo'),
    taladroId: await elemento('Taladro', 'PAR-TAL', herramienta.id, 'devolutivo'),
    // Misma clasificación, distinto tipo: la escoba se presta, los guantes se gastan.
    escobaId: await elemento('Escoba', 'PAR-ESC', aseo.id, 'devolutivo'),
    guantesId: await elemento('Guantes', 'PAR-GUA', aseo.id, 'consumo'),
  }
}

test.group('Entregas parciales y solicitud desde bodega', () => {
  test('pide más de lo que hay: sale lo del estante y el resto queda pendiente', async ({
    client,
    assert,
  }) => {
    const admin = await login(client, 'carlos@correo.com')
    const bodega = await login(client, 'adminbodega@correo.com')
    const instructor = await login(client, 'instructor@correo.com')
    const suffix = Date.now()
    const { idObra, pinturaId } = await preparar(client, admin, bodega, suffix)
    const codigo = `PAR-${suffix}`

    const creada = await client
      .post('/api/v1/solicitudes')
      .bearerToken(instructor)
      .json({
        codigoSolicitud: codigo,
        idObra,
        tipo: 'consumo',
        elementos: [{ idElemento: pinturaId, cantidad: 14 }],
      })
    creada.assertStatus(201)
    const fila = (creada.body().data.detalle as Fila[])[0]
    assert.equal(fila.cantidadPendiente, 14)

    const kardex = await client
      .get(`/api/v1/inventario/elementos/${pinturaId}`)
      .bearerToken(bodega)
    assert.equal(Number(kardex.body().data.cantidad), 10)
    assert.equal(Number(kardex.body().data.disponible), 0)

    const demasiado = await client
      .patch(`/api/v1/solicitudes-material/${fila.id}/entregar`)
      .bearerToken(bodega)
      .json({ cantidad: 15 })
    demasiado.assertStatus(422)
    assert.equal(demasiado.body().code, 'E_CANTIDAD_INVALIDA')

    const parcial = await client
      .patch(`/api/v1/solicitudes-material/${fila.id}/entregar`)
      .bearerToken(bodega)
    parcial.assertStatus(200)
    assert.equal(parcial.body().data.estado, 'parcial')
    assert.equal(parcial.body().data.cantidadEntregada, 10)
    assert.include(parcial.body().message, 'quedan 4 pendientes')

    const factura = await client
      .get(`/api/v1/solicitudes/${encodeURIComponent(codigo)}`)
      .bearerToken(instructor)
    factura.assertStatus(200)
    assert.equal(factura.body().data.estado, 'parcial')
    assert.equal(factura.body().data.totales.cantidadEntregada, 10)
    assert.equal(factura.body().data.totales.cantidadPendiente, 4)

    const avisos = await bandeja(client, instructor)
    const aviso = avisos.find(
      (row) => row.tipo === 'entrega_material' && row.idReferencia === fila.id
    )
    assert.exists(aviso)
    assert.include(aviso!.mensaje, 'Quedan 4 pendientes')

    const sinExistencia = await client
      .patch(`/api/v1/solicitudes-material/${fila.id}/entregar`)
      .bearerToken(bodega)
    sinExistencia.assertStatus(422)
    assert.equal(sinExistencia.body().code, 'E_SIN_STOCK')

    const repuesto = await client
      .patch(`/api/v1/inventario/elementos/${pinturaId}`)
      .bearerToken(bodega)
      .json({ cantidad: 10 })
    repuesto.assertStatus(200)

    const completa = await client
      .patch(`/api/v1/solicitudes-material/${fila.id}/entregar`)
      .bearerToken(bodega)
      .json({ observacion: 'Llegó el pedido' })
    completa.assertStatus(200)
    assert.equal(completa.body().data.estado, 'entregado')
    assert.equal(completa.body().data.cantidadEntregada, 14)

    const cerrada = await client
      .get(`/api/v1/solicitudes/${encodeURIComponent(codigo)}`)
      .bearerToken(instructor)
    assert.equal(cerrada.body().data.estado, 'cerrado')
    const entregas = (cerrada.body().data.detalle as Fila[])[0].entregas
    assert.deepEqual(
      entregas.map((row) => row.cantidad),
      [10, 4]
    )
    assert.equal(entregas[0].entregadoPor?.email, 'adminbodega@correo.com')

    const stock = await client.get(`/api/v1/inventario/elementos/${pinturaId}`).bearerToken(bodega)
    assert.equal(Number(stock.body().data.cantidad), 6)
  })

  test('entregar lo pendiente de una parcial actualiza la solicitud y avisa al instructor', async ({
    client,
    assert,
  }) => {
    const admin = await login(client, 'carlos@correo.com')
    const bodega = await login(client, 'adminbodega@correo.com')
    const instructor = await login(client, 'instructor@correo.com')
    const suffix = Date.now()
    const { idObra, pinturaId, taladroId } = await preparar(client, admin, bodega, suffix)
    const codigoMaterial = `ACT-M-${suffix}`
    const codigoEquipo = `ACT-E-${suffix}`

    const pedir = async (codigo: string, tipo: string, idElemento: number) => {
      const response = await client
        .post('/api/v1/solicitudes')
        .bearerToken(instructor)
        .json({ codigoSolicitud: codigo, idObra, tipo, elementos: [{ idElemento, cantidad: 6 }] })
      response.assertStatus(201)
      return datosDe<{ detalle: Fila[] }>(response).detalle[0]
    }

    const avisosDe = async (tipo: string, id: number) => {
      const avisos = await bandeja(client, instructor)
      return avisos.filter((row) => row.tipo === tipo && row.idReferencia === id)
    }

    // Material: pide 6, bodega entrega 4 y quedan 2.
    const material = await pedir(codigoMaterial, 'consumo', pinturaId)

    const primera = await client
      .patch(`/api/v1/solicitudes-material/${material.id}/entregar`)
      .bearerToken(bodega)
      .json({ cantidad: 4 })
    primera.assertStatus(200)
    assert.equal(primera.body().data.estado, 'parcial')
    assert.equal(primera.body().data.cantidadEntregada, 4)
    assert.equal(primera.body().data.cantidadPendiente, 2)

    const [avisoPrimera] = await avisosDe('entrega_material', material.id)
    assert.equal(avisoPrimera.titulo, 'Material entregado en parte')
    assert.equal(avisoPrimera.mensaje, `Te entregaron 4 de Pintura ${suffix}. Quedan 2 pendientes.`)

    const porEntregar = await client
      .get('/api/v1/solicitudes-material')
      .bearerToken(bodega)
      .qs({ estado: 'pendiente,parcial' })
    porEntregar.assertStatus(200)
    assert.isTrue(datosDe<Fila[]>(porEntregar).some((row) => row.id === material.id))

    const soloPendientes = await client
      .get('/api/v1/solicitudes-material')
      .bearerToken(bodega)
      .qs({ estado: 'pendiente' })
    assert.isFalse(datosDe<Fila[]>(soloPendientes).some((row) => row.id === material.id))

    const estadoInvalido = await client
      .get('/api/v1/solicitudes-material')
      .bearerToken(bodega)
      .qs({ estado: 'pendiente,perdida' })
    estadoInvalido.assertStatus(422)

    const resto = await client
      .patch(`/api/v1/solicitudes-material/${material.id}/entregar`)
      .bearerToken(bodega)
    resto.assertStatus(200)
    assert.equal(resto.body().data.estado, 'entregado')
    assert.equal(resto.body().data.cantidadEntregada, 6)
    assert.equal(resto.body().data.cantidadPendiente, 0)

    const facturaMaterial = await client
      .get(`/api/v1/solicitudes/${encodeURIComponent(codigoMaterial)}`)
      .bearerToken(instructor)
    const cerradaMaterial = datosDe<{ estado: string; detalle: Fila[] }>(facturaMaterial)
    assert.equal(cerradaMaterial.estado, 'cerrado')
    assert.deepEqual(
      cerradaMaterial.detalle[0].entregas.map((row) => row.cantidad),
      [4, 2]
    )

    const avisosMaterial = await avisosDe('entrega_material', material.id)
    assert.lengthOf(avisosMaterial, 2)
    assert.equal(avisosMaterial[0].titulo, 'Solicitud actualizada')
    assert.equal(
      avisosMaterial[0].mensaje,
      `Se entregaron los 2 elementos pendientes de Pintura ${suffix} de tu solicitud ${codigoMaterial}.`
    )

    // Equipo: pide 6, salen 4, luego 1 (sigue parcial) y luego el último.
    const equipo = await pedir(codigoEquipo, 'devolutivo', taladroId)
    const entregarEquipo = (body: Record<string, unknown> = {}) =>
      client
        .patch(`/api/v1/solicitudes-equipo/${equipo.id}/entregar`)
        .bearerToken(bodega)
        .json(body)

    const primeraEquipo = await entregarEquipo({ cantidad: 4 })
    primeraEquipo.assertStatus(200)
    assert.equal(primeraEquipo.body().data.estado, 'parcial')

    const otraParte = await entregarEquipo({ cantidad: 1 })
    otraParte.assertStatus(200)
    assert.equal(otraParte.body().data.estado, 'parcial')
    assert.equal(otraParte.body().data.cantidadEntregada, 5)

    const facturaParcial = await client
      .get(`/api/v1/solicitudes/${encodeURIComponent(codigoEquipo)}`)
      .bearerToken(instructor)
    const parcialEquipo = datosDe<{ estado: string; totales: { cantidadPendiente: number } }>(
      facturaParcial
    )
    assert.equal(parcialEquipo.estado, 'parcial')
    assert.equal(parcialEquipo.totales.cantidadPendiente, 1)

    const [avisoOtraParte] = await avisosDe('entrega_equipo', equipo.id)
    assert.equal(avisoOtraParte.titulo, 'Solicitud actualizada')
    assert.equal(
      avisoOtraParte.mensaje,
      `Se entregó 1 de los 2 pendientes de Taladro ${suffix} de tu solicitud ${codigoEquipo}. Queda 1 pendiente.`
    )

    const ultimo = await entregarEquipo()
    ultimo.assertStatus(200)
    assert.equal(ultimo.body().data.estado, 'entregado')
    assert.equal(ultimo.body().data.cantidadEntregada, 6)

    const avisosEquipo = await avisosDe('entrega_equipo', equipo.id)
    assert.deepEqual(
      avisosEquipo.map((row) => row.titulo),
      ['Solicitud actualizada', 'Solicitud actualizada', 'Equipo entregado en parte']
    )
    assert.equal(
      avisosEquipo[0].mensaje,
      `Se entregó el elemento pendiente de Taladro ${suffix} de tu solicitud ${codigoEquipo}.`
    )

    const facturaEquipo = await client
      .get(`/api/v1/solicitudes/${encodeURIComponent(codigoEquipo)}`)
      .bearerToken(instructor)
    assert.equal(datosDe<{ estado: string }>(facturaEquipo).estado, 'entregado')
  })

  test('bodega recibe por partes el equipo afuera de una fila parcial', async ({
    client,
    assert,
  }) => {
    const admin = await login(client, 'carlos@correo.com')
    const bodega = await login(client, 'adminbodega@correo.com')
    const instructor = await login(client, 'instructor@correo.com')
    const suffix = Date.now()
    const { idObra, taladroId } = await preparar(client, admin, bodega, suffix)
    const codigo = `DEV-${suffix}`

    const creada = await client
      .post('/api/v1/solicitudes')
      .bearerToken(instructor)
      .json({
        codigoSolicitud: codigo,
        idObra,
        tipo: 'devolutivo',
        elementos: [{ idElemento: taladroId, cantidad: 6 }],
      })
    creada.assertStatus(201)
    const fila = datosDe<{ detalle: Fila[] }>(creada).detalle[0]

    const conAfuera = async () => {
      const response = await client
        .get('/api/v1/solicitudes-equipo')
        .bearerToken(bodega)
        .qs({ afuera: 'true' })
      response.assertStatus(200)
      return datosDe<Fila[]>(response).find((row) => row.id === fila.id)
    }

    assert.notExists(await conAfuera())

    const entrega = await client
      .patch(`/api/v1/solicitudes-equipo/${fila.id}/entregar`)
      .bearerToken(bodega)
      .json({ cantidad: 4 })
    entrega.assertStatus(200)
    assert.equal(entrega.body().data.estado, 'parcial')

    const afuera = await conAfuera()
    assert.exists(afuera)
    assert.equal(afuera!.estado, 'parcial')
    assert.equal(afuera!.cantidadAfuera, 4)
    assert.equal(afuera!.cantidadPendiente, 2)

    const filtroInvalido = await client
      .get('/api/v1/solicitudes-equipo')
      .bearerToken(bodega)
      .qs({ afuera: 'quizas' })
    filtroInvalido.assertStatus(422)

    const devolverInstructor = await client
      .patch(`/api/v1/solicitudes-equipo/${fila.id}/devolver`)
      .bearerToken(instructor)
      .json({ estadoElemento: 'bueno' })
    devolverInstructor.assertStatus(403)

    const primera = await client
      .patch(`/api/v1/solicitudes-equipo/${fila.id}/devolver`)
      .bearerToken(bodega)
      .json({
        detalle: [
          { estadoElemento: 'bueno', cantidad: 2 },
          { estadoElemento: 'danado', cantidad: 1 },
        ],
      })
    primera.assertStatus(200)
    assert.equal(primera.body().data.estado, 'parcial')
    assert.equal(primera.body().data.cantidadDevuelta, 3)
    assert.equal(primera.body().data.cantidadAfuera, 1)
    assert.equal((await conAfuera())!.cantidadAfuera, 1)

    const avisos = await bandeja(client, instructor)
    const aviso = avisos.find(
      (row) => row.tipo === 'devolucion_equipo' && row.idReferencia === fila.id
    )
    assert.exists(aviso)
    assert.equal(
      aviso!.mensaje,
      `Bodega recibió 3 de Taladro ${suffix}: 2 bueno, 1 dañado. Quedan 1 por devolver.`
    )

    const resto = await client
      .patch(`/api/v1/solicitudes-equipo/${fila.id}/devolver`)
      .bearerToken(bodega)
      .json({ estadoElemento: 'bueno' })
    resto.assertStatus(200)
    assert.equal(resto.body().data.estado, 'parcial')
    assert.equal(resto.body().data.cantidadAfuera, 0)
    assert.notExists(await conAfuera())

    const factura = await client
      .get(`/api/v1/solicitudes/${encodeURIComponent(codigo)}`)
      .bearerToken(instructor)
    const vista = datosDe<{ estado: string; totales: { cantidadPendiente: number } }>(factura)
    assert.equal(vista.estado, 'parcial')
    assert.equal(vista.totales.cantidadPendiente, 2)
  })

  test('agregar stock de un elemento con solicitudes pendientes avisa a bodega', async ({
    client,
    assert,
  }) => {
    const admin = await login(client, 'carlos@correo.com')
    const bodega = await login(client, 'adminbodega@correo.com')
    const instructor = await login(client, 'instructor@correo.com')
    const suffix = Date.now()
    const { idObra, pinturaId } = await preparar(client, admin, bodega, suffix)
    const codigo = `STK-${suffix}`
    const titulo = `Nuevas unidades de Pintura ${suffix} para solicitudes pendientes`

    type Pendiente = {
      tipo: string
      id: number
      codigoSolicitud: string
      solicitante: string
      estado: string
      cantidad: number
      cantidadEntregada: number
      pendiente: number
    }

    const pedir = async (codigoSolicitud: string) => {
      const response = await client
        .post('/api/v1/solicitudes')
        .bearerToken(instructor)
        .json({
          codigoSolicitud,
          idObra,
          tipo: 'consumo',
          elementos: [{ idElemento: pinturaId, cantidad: 6 }],
        })
      response.assertStatus(201)
      return datosDe<{ detalle: Fila[] }>(response).detalle[0]
    }

    const entregar = (id: number) =>
      client.patch(`/api/v1/solicitudes-material/${id}/entregar`).bearerToken(bodega)

    const editarStock = async (body: Record<string, unknown>) => {
      const response = await client
        .patch(`/api/v1/inventario/elementos/${pinturaId}`)
        .bearerToken(bodega)
        .json(body)
      response.assertStatus(200)
      return response.body() as {
        message?: string
        data: { cantidad: number; solicitudesPendientes: Pendiente[] }
      }
    }

    const avisosBodega = async () => {
      const avisos = await bandeja(client, bodega)
      return avisos.filter((row) => row.titulo === titulo)
    }

    // Una primera solicitud se lleva 6 de las 10: quedan 4 en el estante.
    const primera = await pedir(`STK-A-${suffix}`)
    const entregaPrimera = await entregar(primera.id)
    entregaPrimera.assertStatus(200)

    // Pide 6 y solo hay 4: queda parcial con 2 pendientes.
    const fila = await pedir(codigo)
    const parcial = await entregar(fila.id)
    parcial.assertStatus(200)
    assert.equal(parcial.body().data.estado, 'parcial')
    assert.equal(parcial.body().data.cantidadPendiente, 2)

    // Cambiar solo el mínimo no es una entrada de stock.
    const soloMinimo = await editarStock({ cantidadMinima: 3 })
    assert.deepEqual(soloMinimo.data.solicitudesPendientes, [])
    assert.notExists(soloMinimo.message)

    // Bodega agrega existencia: la respuesta trae la solicitud por entregar.
    const repuesto = await editarStock({ cantidad: 10 })
    assert.equal(Number(repuesto.data.cantidad), 10)
    assert.lengthOf(repuesto.data.solicitudesPendientes, 1)
    const { solicitante, ...pendiente } = repuesto.data.solicitudesPendientes[0]
    assert.isNotEmpty(solicitante)
    assert.deepEqual(pendiente, {
      tipo: 'material',
      id: fila.id,
      codigoSolicitud: codigo,
      estado: 'parcial',
      cantidad: 6,
      cantidadEntregada: 4,
      pendiente: 2,
    })
    assert.equal(
      repuesto.message,
      `Agregaste nuevas unidades de Pintura ${suffix} que tienen solicitudes pendientes. Tienes 1 solicitud por actualizar y entregar.`
    )

    // Un solo aviso para bodega con el resumen; el instructor no lo recibe.
    const avisos = await avisosBodega()
    assert.lengthOf(avisos, 1)
    assert.equal(avisos[0].tipo, 'solicitud_material')
    assert.equal(avisos[0].idReferencia, fila.id)
    assert.include(avisos[0].mensaje, `agregó 10 unidades de Pintura ${suffix} (ahora hay 10)`)
    assert.include(
      avisos[0].mensaje,
      `Tienes 1 solicitud por actualizar y entregar: ${codigo} (${solicitante}, 2 pendientes).`
    )
    const avisosInstructor = await bandeja(client, instructor)
    assert.isFalse(avisosInstructor.some((row) => row.titulo === titulo))

    // Bodega entrega lo pendiente y el instructor recibe "Solicitud actualizada".
    const resto = await entregar(fila.id)
    resto.assertStatus(200)
    assert.equal(resto.body().data.estado, 'entregado')
    assert.equal(resto.body().data.cantidadEntregada, 6)
    const trasEntrega = await bandeja(client, instructor)
    const actualizada = trasEntrega.find(
      (row) => row.tipo === 'entrega_material' && row.idReferencia === fila.id
    )
    assert.equal(actualizada?.titulo, 'Solicitud actualizada')

    // Otra entrada sin nadie esperando: lista vacía y ningún aviso nuevo.
    const otra = await editarStock({ cantidad: 12 })
    assert.deepEqual(otra.data.solicitudesPendientes, [])
    assert.lengthOf(await avisosBodega(), 1)
  })

  test('equipo que vuelve en buen estado avisa a bodega si hay solicitudes pendientes', async ({
    client,
    assert,
  }) => {
    const admin = await login(client, 'carlos@correo.com')
    const bodega = await login(client, 'adminbodega@correo.com')
    const instructor = await login(client, 'instructor@correo.com')
    const suffix = Date.now()
    const { idObra, taladroId } = await preparar(client, admin, bodega, suffix)
    const codigo = `RET-${suffix}`
    const titulo = `Volvieron unidades de Taladro ${suffix} para solicitudes pendientes`

    type Pendiente = { id: number; codigoSolicitud: string; solicitante: string; pendiente: number }
    type Devuelta = Fila & { solicitudesPendientes: Pendiente[] }

    const pedir = async (codigoSolicitud: string) => {
      const response = await client
        .post('/api/v1/solicitudes')
        .bearerToken(instructor)
        .json({
          codigoSolicitud,
          idObra,
          tipo: 'devolutivo',
          elementos: [{ idElemento: taladroId, cantidad: 6 }],
        })
      response.assertStatus(201)
      return datosDe<{ detalle: Fila[] }>(response).detalle[0]
    }

    const entregar = (id: number) =>
      client.patch(`/api/v1/solicitudes-equipo/${id}/entregar`).bearerToken(bodega)

    const devolver = async (
      id: number,
      detalle: { estadoElemento: string; cantidad: number }[]
    ) => {
      const response = await client
        .patch(`/api/v1/solicitudes-equipo/${id}/devolver`)
        .bearerToken(bodega)
        .json({ detalle })
      response.assertStatus(200)
      return datosDe<Devuelta>(response)
    }

    const avisosBodega = async () => {
      const avisos = await bandeja(client, bodega)
      return avisos.filter((row) => row.titulo === titulo)
    }

    // A se lleva 6 de los 10; B pide 6, salen los 4 que quedan y faltan 2.
    const primera = await pedir(`RET-A-${suffix}`)
    const entregaPrimera = await entregar(primera.id)
    entregaPrimera.assertStatus(200)
    const fila = await pedir(codigo)
    const parcial = await entregar(fila.id)
    parcial.assertStatus(200)
    assert.equal(parcial.body().data.estado, 'parcial')
    assert.equal(parcial.body().data.cantidadPendiente, 2)

    // Lo dañado no vuelve al estante: no hay aviso ni lista.
    const danado = await devolver(primera.id, [{ estadoElemento: 'danado', cantidad: 1 }])
    assert.deepEqual(danado.solicitudesPendientes, [])
    assert.lengthOf(await avisosBodega(), 0)

    // Vuelven 3 buenos de A: B puede completarse y bodega recibe un solo aviso.
    const buenos = await devolver(primera.id, [
      { estadoElemento: 'bueno', cantidad: 3 },
      { estadoElemento: 'danado', cantidad: 1 },
    ])
    assert.equal(buenos.cantidadAfuera, 1)
    assert.lengthOf(buenos.solicitudesPendientes, 1)
    const pendiente = buenos.solicitudesPendientes[0]
    assert.equal(pendiente.id, fila.id)
    assert.equal(pendiente.codigoSolicitud, codigo)
    assert.equal(pendiente.pendiente, 2)

    const avisos = await avisosBodega()
    assert.lengthOf(avisos, 1)
    assert.equal(avisos[0].tipo, 'solicitud_equipo')
    assert.equal(avisos[0].idReferencia, fila.id)
    assert.include(
      avisos[0].mensaje,
      `recibió 3 unidades de Taladro ${suffix} en buen estado (ahora hay 3) y hay solicitudes pendientes.`
    )
    assert.include(
      avisos[0].mensaje,
      `Tienes 1 solicitud por actualizar y entregar: ${codigo} (${pendiente.solicitante}, 2 pendientes).`
    )
    const avisosInstructor = await bandeja(client, instructor)
    assert.isFalse(avisosInstructor.some((row) => row.titulo === titulo))

    // Si B devuelve una unidad buena mientras le faltan 2, su propia fila se ofrece.
    const propia = await devolver(fila.id, [{ estadoElemento: 'bueno', cantidad: 1 }])
    assert.equal(propia.estado, 'parcial')
    assert.deepEqual(
      propia.solicitudesPendientes.map((row) => row.id),
      [fila.id]
    )
    assert.lengthOf(await avisosBodega(), 2)

    // Bodega entrega lo pendiente de B.
    const resto = await entregar(fila.id)
    resto.assertStatus(200)
    assert.equal(resto.body().data.estado, 'entregado')
    assert.equal(resto.body().data.cantidadEntregada, 6)

    // Ya nadie espera: la última unidad buena de A no genera aviso.
    const ultima = await devolver(primera.id, [{ estadoElemento: 'bueno', cantidad: 1 }])
    assert.equal(ultima.cantidadAfuera, 0)
    assert.deepEqual(ultima.solicitudesPendientes, [])
    assert.lengthOf(await avisosBodega(), 2)
  })

  test('el tipo es del elemento: un elemento de aseo devolutivo se pide como equipo', async ({
    client,
    assert,
  }) => {
    const admin = await login(client, 'carlos@correo.com')
    const bodega = await login(client, 'adminbodega@correo.com')
    const instructor = await login(client, 'instructor@correo.com')
    const suffix = Date.now()
    const { idObra, escobaId, guantesId } = await preparar(client, admin, bodega, suffix)

    type Visto = { caracter: string; clasificacion: { nombre: string; caracter: string } | null }

    // El instructor ve el tipo del elemento; la clasificación sugiere otro.
    const visto = await client
      .get(`/api/v1/inventario/elementos/${escobaId}`)
      .bearerToken(instructor)
    visto.assertStatus(200)
    const escoba = datosDe<Visto>(visto)
    assert.equal(escoba.caracter, 'devolutivo')
    assert.equal(escoba.clasificacion?.nombre, 'ELEMENTO DE ASEO')
    assert.equal(escoba.clasificacion?.caracter, 'consumo')

    const pedir = (codigoSolicitud: string, tipo: string, idElemento: number) =>
      client
        .post('/api/v1/solicitudes')
        .bearerToken(instructor)
        .json({ codigoSolicitud, idObra, tipo, elementos: [{ idElemento, cantidad: 1 }] })

    // Como consumo no entra aunque su clasificación sea de consumo.
    const comoConsumo = await pedir(`ASE-C-${suffix}`, 'consumo', escobaId)
    comoConsumo.assertStatus(422)
    const directa = await client
      .post('/api/v1/solicitudes-material')
      .bearerToken(instructor)
      .json({ codigoSolicitud: `ASE-M-${suffix}`, idObra, idElemento: escobaId, cantidad: 1 })
    directa.assertStatus(422)

    // Como devolutivo sí, y queda como solicitud de equipo.
    const comoEquipo = await pedir(`ASE-E-${suffix}`, 'devolutivo', escobaId)
    comoEquipo.assertStatus(201)
    const filaEquipo = datosDe<{ detalle: Fila[] }>(comoEquipo).detalle[0]
    assert.equal(filaEquipo.tipo, 'equipo')

    // Los guantes, de la misma clasificación, son de consumo.
    const guantes = await pedir(`ASE-G-${suffix}`, 'consumo', guantesId)
    guantes.assertStatus(201)
    assert.equal(datosDe<{ detalle: Fila[] }>(guantes).detalle[0].tipo, 'material')
    const guantesComoEquipo = await pedir(`ASE-GE-${suffix}`, 'devolutivo', guantesId)
    guantesComoEquipo.assertStatus(422)

    // Bodega cambia el tipo de la escoba: ahora se pide como consumo.
    const cambio = await client
      .patch(`/api/v1/inventario/elementos/${escobaId}`)
      .bearerToken(bodega)
      .json({ caracter: 'consumo' })
    cambio.assertStatus(200)
    assert.equal(datosDe<{ caracter: string }>(cambio).caracter, 'consumo')
    const yaConsumo = await pedir(`ASE-C2-${suffix}`, 'consumo', escobaId)
    yaConsumo.assertStatus(201)
  })

  test('un elemento sin tipo propio usa el de su clasificación y se puede pedir', async ({
    client,
    assert,
  }) => {
    const admin = await login(client, 'carlos@correo.com')
    const bodega = await login(client, 'adminbodega@correo.com')
    const instructor = await login(client, 'instructor@correo.com')
    const suffix = Date.now()
    const { idObra, pinturaId, taladroId } = await preparar(client, admin, bodega, suffix)

    // Como un elemento viejo: sin tipo propio, solo el de la clasificación. Si la
    // migración dejó la columna NOT NULL se suelta; la transacción del test lo deshace.
    await db.rawQuery('ALTER TABLE elemento ALTER COLUMN caracter DROP NOT NULL')
    await db
      .from('elemento')
      .whereIn('id_elemento', [pinturaId, taladroId])
      .update({ caracter: null })

    const lista = await client.get('/api/v1/inventario/elementos').bearerToken(instructor)
    lista.assertStatus(200)
    const filas = datosDe<{ id: number; caracter: string | null }[]>(lista)
    assert.equal(filas.find((row) => row.id === pinturaId)?.caracter, 'consumo')
    assert.equal(filas.find((row) => row.id === taladroId)?.caracter, 'devolutivo')

    const pedir = (codigoSolicitud: string, tipo: string, idElemento: number) =>
      client
        .post('/api/v1/solicitudes')
        .bearerToken(instructor)
        .json({ codigoSolicitud, idObra, tipo, elementos: [{ idElemento, cantidad: 1 }] })

    const material = await pedir(`SIN-M-${suffix}`, 'consumo', pinturaId)
    material.assertStatus(201)
    const equipo = await pedir(`SIN-E-${suffix}`, 'devolutivo', taladroId)
    equipo.assertStatus(201)
    const cruzado = await pedir(`SIN-X-${suffix}`, 'devolutivo', pinturaId)
    cruzado.assertStatus(422)
  })

  test('bodega registra la solicitud del instructor, entrega lo que hay y recibe con novedad', async ({
    client,
    assert,
  }) => {
    const admin = await login(client, 'carlos@correo.com')
    const bodega = await login(client, 'adminbodega@correo.com')
    const instructor = await login(client, 'instructor@correo.com')
    const suffix = Date.now()
    const { idObra, taladroId, pinturaId } = await preparar(client, admin, bodega, suffix)
    const codigo = `MOS-${suffix}`

    const buscado = await client
      .get(`/api/v1/solicitudes/solicitantes/${INSTRUCTOR_DOCUMENTO}`)
      .bearerToken(bodega)
    buscado.assertStatus(200)
    assert.equal(buscado.body().data.email, 'instructor@correo.com')
    assert.isTrue(buscado.body().data.puedeDevolutivo)

    const nadie = await client.get('/api/v1/solicitudes/solicitantes/000000000').bearerToken(bodega)
    nadie.assertStatus(404)

    const buscaInstructor = await client
      .get(`/api/v1/solicitudes/solicitantes/${INSTRUCTOR_DOCUMENTO}`)
      .bearerToken(instructor)
    buscaInstructor.assertStatus(403)

    const registrar = (body: Record<string, unknown>, token = bodega) =>
      client
        .post('/api/v1/solicitudes/bodega')
        .bearerToken(token)
        .json({ codigoSolicitud: codigo, idObra, tipo: 'devolutivo', ...body })

    const desdeInstructor = await registrar(
      {
        numeroDocumento: INSTRUCTOR_DOCUMENTO,
        elementos: [{ idElemento: taladroId, cantidad: 1 }],
      },
      instructor
    )
    desdeInstructor.assertStatus(403)

    const aSiMismo = await registrar({
      numeroDocumento: BODEGA_DOCUMENTO,
      elementos: [{ idElemento: taladroId, cantidad: 1 }],
    })
    aSiMismo.assertStatus(422)
    assert.equal(aSiMismo.body().code, 'E_SOLICITANTE_INVALIDO')

    const sinDocumento = await registrar({ elementos: [{ idElemento: taladroId, cantidad: 1 }] })
    sinDocumento.assertStatus(422)

    const tipoDistinto = await registrar({
      numeroDocumento: INSTRUCTOR_DOCUMENTO,
      elementos: [{ idElemento: pinturaId, cantidad: 1 }],
    })
    tipoDistinto.assertStatus(422)
    assert.equal(tipoDistinto.body().code, 'E_TIPO_DISTINTO')

    const registrada = await registrar({
      numeroDocumento: INSTRUCTOR_DOCUMENTO,
      ficha: '2758963',
      elementos: [{ idElemento: taladroId, cantidad: 13 }],
    })
    registrada.assertStatus(201)
    const factura = registrada.body().data
    assert.equal(factura.estado, 'parcial')
    assert.isTrue(factura.registradaEnBodega)
    assert.equal(factura.registradaPor.email, 'adminbodega@correo.com')
    assert.equal(factura.usuario.email, 'instructor@correo.com')
    const fila = (factura.detalle as Fila[])[0]
    assert.equal(fila.cantidadEntregada, 10)
    assert.equal(fila.cantidadPendiente, 3)
    assert.equal(fila.cantidadAfuera, 10)

    const vistaInstructor = await client
      .get(`/api/v1/solicitudes/${encodeURIComponent(codigo)}`)
      .bearerToken(instructor)
    vistaInstructor.assertStatus(200)
    assert.equal(vistaInstructor.body().data.totales.cantidadPendiente, 3)

    const avisos = await bandeja(client, instructor)
    const aviso = avisos.find((row) => row.titulo.includes(codigo))
    assert.exists(aviso)
    assert.equal(aviso!.tipo, 'entrega_equipo')
    assert.include(aviso!.mensaje, `Te entregaron 10 de Taladro ${suffix}`)
    assert.include(aviso!.mensaje, `Quedan pendientes 3 de Taladro ${suffix}`)

    const deMas = await client
      .patch(`/api/v1/solicitudes-equipo/${fila.id}/devolver`)
      .bearerToken(bodega)
      .json({ detalle: [{ estadoElemento: 'bueno', cantidad: 11 }] })
    deMas.assertStatus(422)
    assert.equal(deMas.body().code, 'E_CANTIDAD_INVALIDA')

    const estadoRepetido = await client
      .patch(`/api/v1/solicitudes-equipo/${fila.id}/devolver`)
      .bearerToken(bodega)
      .json({
        detalle: [
          { estadoElemento: 'bueno', cantidad: 1 },
          { estadoElemento: 'bueno', cantidad: 1 },
        ],
      })
    estadoRepetido.assertStatus(422)

    const sinEstado = await client
      .patch(`/api/v1/solicitudes-equipo/${fila.id}/devolver`)
      .bearerToken(bodega)
      .json({ observacion: 'Sin estado' })
    sinEstado.assertStatus(422)

    const conNovedad = await client
      .patch(`/api/v1/solicitudes-equipo/${fila.id}/devolver`)
      .bearerToken(bodega)
      .json({
        detalle: [
          { estadoElemento: 'bueno', cantidad: 6 },
          { estadoElemento: 'danado', cantidad: 1, observacion: 'Mandril partido' },
        ],
      })
    conNovedad.assertStatus(200)
    assert.equal(conNovedad.body().data.estado, 'parcial')
    assert.equal(conNovedad.body().data.cantidadDevuelta, 7)
    assert.equal(conNovedad.body().data.cantidadAfuera, 3)
    assert.equal(conNovedad.body().data.estadoElemento, 'danado')
    assert.equal(Number(conNovedad.body().data.elemento.cantidad), 6)
    assert.include(conNovedad.body().message, 'quedan 3 afuera')

    const avisosDevolucion = await bandeja(client, instructor)
    const devolucionAviso = avisosDevolucion.find(
      (row) => row.tipo === 'devolucion_equipo' && row.idReferencia === fila.id
    )
    assert.exists(devolucionAviso)
    assert.include(devolucionAviso!.mensaje, '6 bueno, 1 dañado')

    const resto = await client
      .patch(`/api/v1/solicitudes-equipo/${fila.id}/entregar`)
      .bearerToken(bodega)
    resto.assertStatus(200)
    assert.equal(resto.body().data.estado, 'entregado')
    assert.equal(resto.body().data.cantidadAfuera, 6)

    const todo = await client
      .patch(`/api/v1/solicitudes-equipo/${fila.id}/devolver`)
      .bearerToken(bodega)
      .json({ estadoElemento: 'bueno' })
    todo.assertStatus(200)
    assert.equal(todo.body().data.estado, 'devuelto')
    assert.equal(todo.body().data.estadoElemento, 'danado')
    assert.equal(Number(todo.body().data.elemento.cantidad), 9)
    assert.lengthOf(todo.body().data.devoluciones, 3)

    const cerrada = await client
      .get(`/api/v1/solicitudes/${encodeURIComponent(codigo)}`)
      .bearerToken(instructor)
    assert.equal(cerrada.body().data.estado, 'cerrado')

    const historialBodega = await client
      .get('/api/v1/entregas')
      .bearerToken(bodega)
      .qs({ documento: INSTRUCTOR_DOCUMENTO, tipo: 'equipo', perPage: 100 })
    historialBodega.assertStatus(200)
    const salidas = (
      historialBodega.body().data as {
        cantidad: number
        tipo: string
        solicitud: { codigoSolicitud: string; usuario: { email: string } }
      }[]
    ).filter((row) => row.solicitud.codigoSolicitud === codigo)
    assert.deepEqual(
      salidas.map((row) => row.cantidad),
      [3, 10]
    )
    assert.isTrue(salidas.every((row) => row.tipo === 'equipo'))
    assert.equal(salidas[0].solicitud.usuario.email, 'instructor@correo.com')

    const historialInstructor = await client
      .get('/api/v1/entregas')
      .bearerToken(instructor)
      .qs({ perPage: 100 })
    historialInstructor.assertStatus(200)
    assert.isTrue(
      (historialInstructor.body().data as { solicitud: { codigoSolicitud: string } }[]).some(
        (row) => row.solicitud.codigoSolicitud === codigo
      )
    )
  })
})
