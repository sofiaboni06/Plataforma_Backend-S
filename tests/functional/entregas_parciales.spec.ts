import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'

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
  const consumo = clases.find((row) => row.nombre === 'CONSUMO')!

  const elemento = async (nombre: string, codigo: string, idClasificacion: number) => {
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
        idStand,
        cantidad: 10,
        estado: true,
        idUnidadMedida,
        codigo: `${codigo}-${suffix}`,
        idClasificacion,
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
    pinturaId: await elemento('Pintura', 'PAR-PIN', consumo.id),
    taladroId: await elemento('Taladro', 'PAR-TAL', herramienta.id),
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
