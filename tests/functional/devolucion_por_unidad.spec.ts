import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import db from '@adonisjs/lucid/services/db'

type Devolucion = { cantidad: number; estadoElemento: string; observacion: string | null }
type Fila = { id: number; cantidadAfuera: number | null; devoluciones: Devolucion[] }
type Aviso = { tipo: string; titulo: string; mensaje: string; idReferencia: number | null }

/** Algunas rutas no traen el tipo de la respuesta: se lee el cuerpo como JSON suelto. */
type Cuerpo = { data: any; code?: string; message?: string }

function cuerpo(response: { body: () => unknown }) {
  return response.body() as Cuerpo
}

async function login(client: ApiClient, email: string) {
  const response = await client.post('/api/v1/auth/login').json({ email, password: '123456' })
  response.assertStatus(200)
  return cuerpo(response).data.token as string
}

async function bandeja(client: ApiClient, token: string) {
  const response = await client
    .get('/api/v1/account/notifications')
    .bearerToken(token)
    .qs({ perPage: 100 })
  response.assertStatus(200)
  return cuerpo(response).data as Aviso[]
}

/** Un taladro con 10 en el estante y una obra donde pedirlo. */
async function preparar(client: ApiClient, admin: string, bodega: string, suffix: number) {
  const categoria = await client
    .post('/api/v1/categorias')
    .bearerToken(admin)
    .json({ nombre: `Unidad ${suffix}`, estado: true })
  categoria.assertStatus(200)

  const subcategoria = await client
    .post('/api/v1/subcategorias')
    .bearerToken(admin)
    .json({ idCategoria: cuerpo(categoria).data.id, nombre: `Sub unidad ${suffix}`, estado: true })
  subcategoria.assertStatus(200)

  const bodegas = await client.get('/api/v1/bodegas').bearerToken(bodega)
  bodegas.assertStatus(200)
  const bodegaId = (cuerpo(bodegas).data as { id: number }[])[0].id

  const subBodega = await client
    .post(`/api/v1/bodegas/${bodegaId}/sub-bodegas`)
    .bearerToken(admin)
    .json({ nombre: `Sub unidad ${suffix}` })
  subBodega.assertStatus(200)

  const stand = await client
    .post(`/api/v1/bodegas/sub-bodegas/${cuerpo(subBodega).data.id}/stands`)
    .bearerToken(admin)
    .json({ nombre: `Stand unidad ${suffix}` })
  stand.assertStatus(200)

  const unidades = await client.get('/api/v1/unidades-medida').bearerToken(admin)
  const idUnidadMedida = (cuerpo(unidades).data as { id: number }[])[0].id

  const clasificaciones = await client.get('/api/v1/clasificaciones-elemento').bearerToken(admin)
  const herramienta = (cuerpo(clasificaciones).data as { id: number; nombre: string }[]).find(
    (row) => row.nombre === 'HERRAMIENTA'
  )!

  const item = await client
    .post('/api/v1/inventario/items')
    .bearerToken(admin)
    .json({
      nombre: `Taladro ${suffix}`,
      descripcion: 'Taladro',
      idSubcategoria: cuerpo(subcategoria).data.id,
    })
  item.assertStatus(200)

  const elemento = await client
    .post('/api/v1/inventario/elementos')
    .bearerToken(admin)
    .json({
      idItem: cuerpo(item).data.id,
      nombre: `Taladro ${suffix}`,
      idStand: cuerpo(stand).data.id,
      cantidad: 10,
      estado: true,
      idUnidadMedida,
      codigo: `UNI-TAL-${suffix}`,
      idClasificacion: herramienta.id,
      caracter: 'devolutivo',
    })
  elemento.assertStatus(200)

  const obra = await client
    .post('/api/v1/obras')
    .bearerToken(bodega)
    .json({ nombre: `Obra unidad ${suffix}` })
  obra.assertStatus(200)

  return { idObra: cuerpo(obra).data.id as number, taladroId: cuerpo(elemento).data.id as number }
}

test.group('Devolución por unidad', () => {
  test('cada unidad queda con su novedad y su observación, y un solo aviso las lista', async ({
    client,
    assert,
  }) => {
    const admin = await login(client, 'carlos@correo.com')
    const bodega = await login(client, 'adminbodega@correo.com')
    const instructor = await login(client, 'instructor@correo.com')
    const suffix = Date.now()
    const { idObra, taladroId } = await preparar(client, admin, bodega, suffix)
    const codigo = `UNI-${suffix}`

    const creada = await client
      .post('/api/v1/solicitudes')
      .bearerToken(instructor)
      .json({
        codigoSolicitud: codigo,
        idObra,
        tipo: 'devolutivo',
        elementos: [{ idElemento: taladroId, cantidad: 7 }],
      })
    creada.assertStatus(201)
    const fila = (cuerpo(creada).data.detalle as Fila[])[0]

    const entrega = await client
      .patch(`/api/v1/solicitudes-equipo/${fila.id}/entregar`)
      .bearerToken(bodega)
    entrega.assertStatus(200)
    assert.equal(cuerpo(entrega).data.cantidadAfuera, 7)

    const primera = await client
      .patch(`/api/v1/solicitudes-equipo/${fila.id}/devolver`)
      .bearerToken(bodega)
      .json({
        unidades: [
          { estadoElemento: 'bueno' },
          { estadoElemento: 'danado', observacion: 'pantalla rota' },
          { estadoElemento: 'bueno', observacion: '' },
          { estadoElemento: 'perdido', observacion: 'no apareció' },
        ],
      })
    primera.assertStatus(200)
    assert.equal(cuerpo(primera).data.cantidadDevuelta, 4)
    assert.equal(cuerpo(primera).data.cantidadAfuera, 3)
    assert.equal(cuerpo(primera).data.estadoElemento, 'perdido')
    // 10 - 7 que salieron + 2 buenas que volvieron.
    assert.equal(Number(cuerpo(primera).data.elemento.cantidad), 5)
    assert.deepEqual(
      (cuerpo(primera).data.devoluciones as Devolucion[]).map((row) => [
        row.cantidad,
        row.estadoElemento,
        row.observacion,
      ]),
      [
        [1, 'bueno', null],
        [1, 'danado', 'pantalla rota'],
        [1, 'bueno', null],
        [1, 'perdido', 'no apareció'],
      ]
    )

    // Una fila de `devolucion` por unidad, en el orden en que llegaron.
    const filas = await db
      .from('devolucion')
      .where('id_solicitud_equipo', fila.id)
      .orderBy('id_devolucion', 'asc')
      .select('cantidad', 'estado_elemento', 'observacion')
    assert.deepEqual(
      filas.map((row) => [row.cantidad, row.estado_elemento, row.observacion]),
      [
        [1, 'bueno', null],
        [1, 'danado', 'pantalla rota'],
        [1, 'bueno', null],
        [1, 'perdido', 'no apareció'],
      ]
    )

    const bandejaPrimera = await bandeja(client, instructor)
    const avisos = bandejaPrimera.filter(
      (row) => row.tipo === 'devolucion_equipo' && row.idReferencia === fila.id
    )
    assert.lengthOf(avisos, 1)
    assert.equal(avisos[0].titulo, 'Equipo devuelto con novedad')
    assert.equal(
      avisos[0].mensaje,
      [
        `Bodega recibió 4 de Taladro ${suffix}: 2 bueno, 1 dañado, 1 perdido. Quedan 3 por devolver.`,
        'Unidad 1: bueno',
        'Unidad 2: dañado — pantalla rota',
        'Unidad 3: bueno',
        'Unidad 4: perdido — no apareció',
      ].join('\n')
    )

    const demasiadas = await client
      .patch(`/api/v1/solicitudes-equipo/${fila.id}/devolver`)
      .bearerToken(bodega)
      .json({ unidades: Array.from({ length: 4 }, () => ({ estadoElemento: 'bueno' })) })
    demasiadas.assertStatus(422)
    assert.equal(cuerpo(demasiadas).code, 'E_CANTIDAD_INVALIDA')

    const resto = await client
      .patch(`/api/v1/solicitudes-equipo/${fila.id}/devolver`)
      .bearerToken(bodega)
      .json({
        unidades: [
          { estadoElemento: 'bueno' },
          { estadoElemento: 'en_reparacion', observacion: 'no prende' },
          { estadoElemento: 'bueno' },
        ],
      })
    resto.assertStatus(200)
    assert.equal(cuerpo(resto).data.cantidadAfuera, 0)
    assert.equal(Number(cuerpo(resto).data.elemento.cantidad), 7)

    const bandejaFinal = await bandeja(client, instructor)
    const despues = bandejaFinal.filter(
      (row) => row.tipo === 'devolucion_equipo' && row.idReferencia === fila.id
    )
    assert.lengthOf(despues, 2)
    const segundo = despues.find((row) => row.mensaje.includes('Unidad 5'))
    assert.exists(segundo)
    assert.include(segundo!.mensaje, 'Unidad 6: en reparación — no prende')
    assert.include(segundo!.mensaje, 'Unidad 7: bueno')

    const factura = await client
      .get(`/api/v1/solicitudes/${encodeURIComponent(codigo)}`)
      .bearerToken(instructor)
    factura.assertStatus(200)
    const detalle = (cuerpo(factura).data.detalle as Fila[])[0]
    assert.lengthOf(detalle.devoluciones, 7)
    assert.equal(detalle.devoluciones[5].observacion, 'no prende')
  })

  test('sin novedad el aviso no cambia de título y se valida lo que llega', async ({
    client,
    assert,
  }) => {
    const admin = await login(client, 'carlos@correo.com')
    const bodega = await login(client, 'adminbodega@correo.com')
    const instructor = await login(client, 'instructor@correo.com')
    const suffix = Date.now()
    const { idObra, taladroId } = await preparar(client, admin, bodega, suffix)

    const creada = await client
      .post('/api/v1/solicitudes')
      .bearerToken(instructor)
      .json({
        codigoSolicitud: `UNI-B-${suffix}`,
        idObra,
        tipo: 'devolutivo',
        elementos: [{ idElemento: taladroId, cantidad: 2 }],
      })
    creada.assertStatus(201)
    const fila = (cuerpo(creada).data.detalle as Fila[])[0]
    const entrega = await client
      .patch(`/api/v1/solicitudes-equipo/${fila.id}/entregar`)
      .bearerToken(bodega)
    entrega.assertStatus(200)

    const vacio = await client
      .patch(`/api/v1/solicitudes-equipo/${fila.id}/devolver`)
      .bearerToken(bodega)
      .json({})
    vacio.assertStatus(422)

    const sinUnidades = await client
      .patch(`/api/v1/solicitudes-equipo/${fila.id}/devolver`)
      .bearerToken(bodega)
      .json({ unidades: [] })
    sinUnidades.assertStatus(422)

    const estadoMalo = await client
      .patch(`/api/v1/solicitudes-equipo/${fila.id}/devolver`)
      .bearerToken(bodega)
      .json({ unidades: [{ estadoElemento: 'roto' }] })
    estadoMalo.assertStatus(422)

    const buenas = await client
      .patch(`/api/v1/solicitudes-equipo/${fila.id}/devolver`)
      .bearerToken(bodega)
      .json({ unidades: [{ estadoElemento: 'bueno' }, { estadoElemento: 'bueno' }] })
    buenas.assertStatus(200)
    assert.equal(cuerpo(buenas).data.cantidadAfuera, 0)

    const recibidos = await bandeja(client, instructor)
    const aviso = recibidos.find(
      (row) => row.tipo === 'devolucion_equipo' && row.idReferencia === fila.id
    )
    assert.exists(aviso)
    assert.equal(aviso!.titulo, 'Equipo devuelto')
    assert.equal(
      aviso!.mensaje,
      `Bodega recibió 2 de Taladro ${suffix}: 2 bueno.\nUnidad 1: bueno\nUnidad 2: bueno`
    )
  })
})
