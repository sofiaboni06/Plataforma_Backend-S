import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'

type Fila = { id: number; tipo: 'material' | 'equipo'; idElemento: number; estado: string }

async function login(client: ApiClient, email: string) {
  const response = await client.post('/api/v1/auth/login').json({ email, password: '123456' })
  response.assertStatus(200)
  return response.body().data.token as string
}

test.group('Solicitud con varios elementos', () => {
  test('cada solicitud es de un solo tipo y lleva varios elementos', async ({ client, assert }) => {
    const admin = await login(client, 'carlos@correo.com')
    const bodega = await login(client, 'adminbodega@correo.com')
    const instructor = await login(client, 'instructor@correo.com')
    const suffix = Date.now()

    const categoria = await client
      .post('/api/v1/categorias')
      .bearerToken(admin)
      .json({ nombre: `Factura ${suffix}`, estado: true })
    categoria.assertStatus(200)

    const subcategoria = await client
      .post('/api/v1/subcategorias')
      .bearerToken(admin)
      .json({
        idCategoria: categoria.body().data.id,
        nombre: `Sub factura ${suffix}`,
        estado: true,
      })
    subcategoria.assertStatus(200)
    const idSubcategoria = subcategoria.body().data.id as number

    const item = async (nombre: string) => {
      const response = await client
        .post('/api/v1/inventario/items')
        .bearerToken(admin)
        .json({ nombre: `${nombre} ${suffix}`, descripcion: nombre, idSubcategoria })
      response.assertStatus(200)
      return response.body().data.id as number
    }

    const bodegas = await client.get('/api/v1/bodegas').bearerToken(bodega)
    bodegas.assertStatus(200)
    const bodegaId = (bodegas.body().data as { id: number }[])[0].id

    const subBodega = await client
      .post(`/api/v1/bodegas/${bodegaId}/sub-bodegas`)
      .bearerToken(admin)
      .json({ nombre: `Sub factura ${suffix}` })
    subBodega.assertStatus(200)

    const stand = await client
      .post(`/api/v1/bodegas/sub-bodegas/${subBodega.body().data.id}/stands`)
      .bearerToken(admin)
      .json({ nombre: `Stand factura ${suffix}` })
    stand.assertStatus(200)
    const idStand = stand.body().data.id as number

    const unidades = await client.get('/api/v1/unidades-medida').bearerToken(admin)
    unidades.assertStatus(200)
    const idUnidadMedida = (unidades.body().data as { id: number }[])[0].id

    const clasificaciones = await client.get('/api/v1/clasificaciones-elemento').bearerToken(admin)
    clasificaciones.assertStatus(200)
    const clases = clasificaciones.body().data as { id: number; nombre: string }[]
    const herramienta = clases.find((row) => row.nombre === 'HERRAMIENTA')!
    const consumo = clases.find((row) => row.nombre === 'CONSUMO')!

    const elemento = async (nombre: string, codigo: string, idClasificacion: number) => {
      const response = await client
        .post('/api/v1/inventario/elementos')
        .bearerToken(admin)
        .json({
          idItem: await item(nombre),
          idStand,
          cantidad: 20,
          estado: true,
          idUnidadMedida,
          codigo: `${codigo}-${suffix}`,
          idClasificacion,
        })
      response.assertStatus(200)
      return response.body().data.id as number
    }

    const equipoId = await elemento('Pulidora', 'FAC-EQ', herramienta.id)
    const lijaId = await elemento('Lija', 'FAC-LIJ', consumo.id)
    const cintaId = await elemento('Cinta', 'FAC-CIN', consumo.id)

    const obra = await client
      .post('/api/v1/obras')
      .bearerToken(bodega)
      .json({ nombre: `Obra factura ${suffix}` })
    obra.assertStatus(200)
    const idObra = obra.body().data.id as number

    const codigo = `FAC-${suffix}`
    const pedir = (body: Record<string, unknown>, token = instructor) =>
      client
        .post('/api/v1/solicitudes')
        .bearerToken(token)
        .json({ codigoSolicitud: codigo, idObra, ...body })

    const deBodega = await pedir(
      { tipo: 'consumo', elementos: [{ idElemento: lijaId, cantidad: 1 }] },
      bodega
    )
    deBodega.assertStatus(403)

    const sinTipo = await pedir({ elementos: [{ idElemento: lijaId, cantidad: 1 }] })
    sinTipo.assertStatus(422)

    const repetido = await pedir({
      tipo: 'consumo',
      elementos: [
        { idElemento: lijaId, cantidad: 1 },
        { idElemento: lijaId, cantidad: 2 },
      ],
    })
    repetido.assertStatus(422)

    const vacia = await pedir({ tipo: 'consumo', elementos: [] })
    vacia.assertStatus(422)

    const mezclada = await pedir({
      tipo: 'consumo',
      elementos: [
        { idElemento: lijaId, cantidad: 1 },
        { idElemento: equipoId, cantidad: 1 },
      ],
    })
    mezclada.assertStatus(422)
    assert.equal(mezclada.body().code, 'E_TIPO_DISTINTO')
    assert.include(mezclada.body().message, `Pulidora ${suffix}`)

    const filaInexistente = await pedir({
      tipo: 'consumo',
      elementos: [
        { idElemento: cintaId, cantidad: 2 },
        { idElemento: 999999999, cantidad: 1 },
      ],
    })
    filaInexistente.assertStatus(404)
    assert.include(filaInexistente.body().message, 'fila 2')

    const nadaGuardado = await client
      .get(`/api/v1/solicitudes/${encodeURIComponent(codigo)}`)
      .bearerToken(instructor)
    nadaGuardado.assertStatus(404)

    const creada = await pedir({
      tipo: 'consumo',
      ficha: '2758963',
      observacion: 'Para el taller',
      elementos: [
        { idElemento: lijaId, cantidad: 5, observacion: 'Grano 120' },
        { idElemento: cintaId, cantidad: 3 },
      ],
    })
    creada.assertStatus(201)
    const factura = creada.body().data
    assert.equal(factura.codigoSolicitud, codigo)
    assert.equal(factura.tipo, 'consumo')
    assert.equal(factura.estado, 'pendiente')
    assert.equal(factura.ficha, '2758963')
    assert.equal(factura.obra.id, idObra)
    assert.equal(factura.totales.lineas, 2)
    assert.equal(factura.totales.pendientes, 2)

    const filas = factura.detalle as (Fila & { observacion: string | null })[]
    assert.isTrue(filas.every((row) => row.tipo === 'material'))
    const filaLija = filas.find((row) => row.idElemento === lijaId)!
    const filaCinta = filas.find((row) => row.idElemento === cintaId)!
    assert.equal(filaLija.observacion, 'Grano 120')
    assert.equal(filaCinta.observacion, 'Para el taller')

    const mismoCodigo = await pedir({
      tipo: 'devolutivo',
      elementos: [{ idElemento: equipoId, cantidad: 1 }],
    })
    mismoCodigo.assertStatus(409)

    const reservado = await client
      .get(`/api/v1/inventario/elementos/${lijaId}`)
      .bearerToken(bodega)
    reservado.assertStatus(200)
    assert.equal(Number(reservado.body().data.disponible), 15)

    const sinExistencias = await client
      .get(`/api/v1/inventario/elementos/${lijaId}`)
      .bearerToken(instructor)
    sinExistencias.assertStatus(200)
    assert.equal(sinExistencias.body().data.nombre, `Lija ${suffix}`)
    assert.notProperty(sinExistencias.body().data, 'cantidad')
    assert.notProperty(sinExistencias.body().data, 'disponible')
    assert.notProperty(sinExistencias.body().data, 'cantidadMinima')
    assert.isNull(sinExistencias.body().data.stand)

    const listaInstructor = await client.get('/api/v1/inventario/elementos').bearerToken(instructor)
    listaInstructor.assertStatus(200)
    assert.isTrue(
      (listaInstructor.body().data as Record<string, unknown>[]).every(
        (row) => !('cantidad' in row) && !('disponible' in row) && row.stand === null
      )
    )

    const propiaInstructor = await client
      .get(`/api/v1/solicitudes/${encodeURIComponent(codigo)}`)
      .bearerToken(instructor)
    propiaInstructor.assertStatus(200)
    const filasInstructor = propiaInstructor.body().data.detalle as {
      elemento: Record<string, unknown>
    }[]
    assert.isTrue(filasInstructor.every((row) => !('cantidad' in row.elemento)))

    const materialInstructor = await client
      .get(`/api/v1/solicitudes-material/${filaLija.id}`)
      .bearerToken(instructor)
    materialInstructor.assertStatus(200)
    assert.equal(materialInstructor.body().data.codigoSolicitud, codigo)
    assert.notProperty(materialInstructor.body().data.elemento, 'cantidad')

    const materialBodega = await client
      .get(`/api/v1/solicitudes-material/${filaLija.id}`)
      .bearerToken(bodega)
    materialBodega.assertStatus(200)
    assert.equal(Number(materialBodega.body().data.elemento.cantidad), 20)

    const avisos = await client
      .get('/api/v1/account/notifications')
      .bearerToken(bodega)
      .qs({ perPage: 100 })
    avisos.assertStatus(200)
    const deEsta = (avisos.body().data as { tipo: string; titulo: string }[]).filter((row) =>
      row.titulo.endsWith(codigo)
    )
    assert.equal(deEsta.length, 1)
    assert.equal(deEsta[0].tipo, 'solicitud_material')

    const vistaBodega = await client
      .get(`/api/v1/solicitudes/${encodeURIComponent(codigo)}`)
      .bearerToken(bodega)
    vistaBodega.assertStatus(200)
    assert.equal(vistaBodega.body().data.totales.lineas, 2)

    const entregaLija = await client
      .patch(`/api/v1/solicitudes-material/${filaLija.id}/entregar`)
      .bearerToken(bodega)
    entregaLija.assertStatus(200)

    const parcial = await client
      .get(`/api/v1/solicitudes/${encodeURIComponent(codigo)}`)
      .bearerToken(instructor)
    assert.equal(parcial.body().data.estado, 'parcial')

    const entregaCinta = await client
      .patch(`/api/v1/solicitudes-material/${filaCinta.id}/entregar`)
      .bearerToken(bodega)
    entregaCinta.assertStatus(200)

    const consumoCerrada = await client
      .get(`/api/v1/solicitudes/${encodeURIComponent(codigo)}`)
      .bearerToken(instructor)
    assert.equal(consumoCerrada.body().data.estado, 'cerrado')

    const codigoEquipo = `FAC-EQ-${suffix}`
    const deEquipo = await client
      .post('/api/v1/solicitudes')
      .bearerToken(instructor)
      .json({
        codigoSolicitud: codigoEquipo,
        idObra,
        tipo: 'devolutivo',
        elementos: [{ idElemento: equipoId, cantidad: 2 }],
      })
    deEquipo.assertStatus(201)
    assert.equal(deEquipo.body().data.tipo, 'devolutivo')
    const filaEquipo = (deEquipo.body().data.detalle as Fila[])[0]
    assert.equal(filaEquipo.tipo, 'equipo')

    const entregaEquipo = await client
      .patch(`/api/v1/solicitudes-equipo/${filaEquipo.id}/entregar`)
      .bearerToken(bodega)
    entregaEquipo.assertStatus(200)

    const afuera = await client
      .get(`/api/v1/solicitudes/${encodeURIComponent(codigoEquipo)}`)
      .bearerToken(instructor)
    assert.equal(afuera.body().data.estado, 'entregado')

    const devuelto = await client
      .patch(`/api/v1/solicitudes-equipo/${filaEquipo.id}/devolver`)
      .bearerToken(bodega)
      .json({ estadoElemento: 'bueno' })
    devuelto.assertStatus(200)

    const cerradas = await client
      .get('/api/v1/solicitudes')
      .bearerToken(instructor)
      .qs({ estado: 'cerrado' })
    cerradas.assertStatus(200)
    const codigos = (cerradas.body().data as { codigoSolicitud: string }[]).map(
      (row) => row.codigoSolicitud
    )
    assert.includeMembers(codigos, [codigo, codigoEquipo])

    const estadoRaro = await client
      .get('/api/v1/solicitudes')
      .bearerToken(instructor)
      .qs({ estado: 'raro' })
    estadoRaro.assertStatus(422)
  })

  test('el administrador de la plataforma no ve ni atiende solicitudes', async ({
    client,
    assert,
  }) => {
    const admin = await login(client, 'carlos@correo.com')

    const perfil = await client.get('/api/v1/account/profile').bearerToken(admin)
    perfil.assertStatus(200)
    const permisos = perfil.body().data.permissions as string[]
    assert.isTrue(perfil.body().data.isAdmin)
    assert.isFalse(permisos.includes('alerta.ver'))
    assert.isFalse(permisos.some((code) => code.startsWith('solicitud_')))

    for (const ruta of [
      '/api/v1/solicitudes',
      '/api/v1/solicitudes/FAC-CUALQUIERA',
      '/api/v1/solicitudes/solicitantes/1001001005',
      '/api/v1/solicitudes-material',
      '/api/v1/solicitudes-equipo',
      '/api/v1/entregas',
      '/api/v1/inventario/alertas',
    ]) {
      const response = await client.get(ruta).bearerToken(admin)
      response.assertStatus(403)
    }

    const registrar = await client
      .post('/api/v1/solicitudes/bodega')
      .bearerToken(admin)
      .json({
        codigoSolicitud: `ADM-${Date.now()}`,
        idObra: 1,
        tipo: 'consumo',
        numeroDocumento: '1001001005',
        elementos: [{ idElemento: 1, cantidad: 1 }],
      })
    registrar.assertStatus(403)
  })
})
