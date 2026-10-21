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

async function crearCadena(client: ApiClient, token: string, suffix: number) {
  const linea = await client
    .post('/api/v1/lineas-tematicas')
    .bearerToken(token)
    .json({ nombre: `Línea ${suffix}` })
  linea.assertStatus(200)
  const lineaId = datosDe<{ id: number }>(linea).id

  const red = await client
    .post('/api/v1/redes-conocimiento')
    .bearerToken(token)
    .json({ nombre: `Red ${suffix}`, lineaIds: [lineaId] })
  red.assertStatus(200)
  const redRow = datosDe<{ id: number; lineaIds: number[] }>(red)

  const nivel = await client
    .post('/api/v1/niveles-programa')
    .bearerToken(token)
    .json({ nombre: `Nivel ${suffix}` })
  nivel.assertStatus(200)
  const nivelId = datosDe<{ id: number }>(nivel).id

  const programa = await client
    .post('/api/v1/programas-formacion')
    .bearerToken(token)
    .json({
      idRedConocimiento: redRow.id,
      idLineaTematica: lineaId,
      idNivelPrograma: nivelId,
      codigo: `COD-${suffix}`,
      nombre: `Programa ${suffix}`,
      version: '1',
      duracionTotalHoras: 2200,
    })
  programa.assertStatus(200)

  return {
    lineaId,
    redId: redRow.id,
    nivelId,
    programaId: datosDe<{ id: number }>(programa).id,
  }
}

test.group('Programas de formación, niveles y fichas', () => {
  test('las rutas piden token', async ({ client }) => {
    const niveles = await client.get('/api/v1/niveles-programa')
    niveles.assertStatus(401)

    const fichas = await client.get('/api/v1/fichas')
    fichas.assertStatus(401)
  })

  test('crea la cadena completa y la lista', async ({ client, assert }) => {
    const admin = await login(client, 'carlos@correo.com')
    const suffix = Date.now()
    const { redId, lineaId, nivelId, programaId } = await crearCadena(client, admin, suffix)

    // la red guarda la línea temática y el programa cuelga del nivel
    const red = await client.get(`/api/v1/redes-conocimiento/${redId}`).bearerToken(admin)
    red.assertStatus(200)
    assert.include(datosDe<{ lineaIds: number[] }>(red).lineaIds, lineaId)

    const programa = await client
      .get(`/api/v1/programas-formacion/${programaId}`)
      .bearerToken(admin)
    programa.assertStatus(200)
    assert.equal(datosDe<{ nivel: { id: number } }>(programa).nivel.id, nivelId)

    const ficha = await client
      .post('/api/v1/fichas')
      .bearerToken(admin)
      .json({
        idPrograma: programaId,
        idJornada: 1,
        numeroFicha: `${suffix}`,
        fechaInicio: '2026-01-10',
        fechaFin: '2026-06-10',
        cupoAprendices: 25,
      })
    ficha.assertStatus(200)
    const fichaRow = datosDe<{ id: number; centroFormacionId: number; programa: { id: number } }>(
      ficha
    )
    assert.equal(fichaRow.programa.id, programaId)
    assert.equal(fichaRow.centroFormacionId, 1)

    const conFicha = await client
      .get(`/api/v1/programas-formacion/${programaId}`)
      .bearerToken(admin)
    conFicha.assertStatus(200)
    assert.deepEqual(
      datosDe<{ centros: { id: number }[] }>(conFicha).centros.map((centro) => centro.id),
      [1]
    )

    const delCentro = await client
      .get('/api/v1/programas-formacion?idCformacion=1')
      .bearerToken(admin)
    delCentro.assertStatus(200)
    assert.isTrue((delCentro.body().data as { id: number }[]).some((row) => row.id === programaId))

    const deOtroCentro = await client
      .get('/api/v1/programas-formacion?idCformacion=2')
      .bearerToken(admin)
    deOtroCentro.assertStatus(200)
    assert.isFalse(
      (deOtroCentro.body().data as { id: number }[]).some((row) => row.id === programaId)
    )

    const lista = await client.get('/api/v1/fichas').bearerToken(admin)
    lista.assertStatus(200)
    assert.isTrue((lista.body().data as { id: number }[]).some((row) => row.id === fichaRow.id))

    // fechas incoherentes: 422, no 500
    const malasFechas = await client
      .patch(`/api/v1/fichas/${fichaRow.id}`)
      .bearerToken(admin)
      .json({ fechaFin: '2025-12-01' })
    malasFechas.assertStatus(422)

    // apagar la ficha la oculta del listado activo
    const apagada = await client.delete(`/api/v1/fichas/${fichaRow.id}`).bearerToken(admin)
    apagada.assertStatus(200)

    const detalle = await client.get(`/api/v1/fichas/${fichaRow.id}`).bearerToken(admin)
    detalle.assertStatus(200)
    assert.isFalse(datosDe<{ estado: boolean }>(detalle).estado)
  })

  test('rechaza una pareja red-línea que no está asociada', async ({ client }) => {
    const admin = await login(client, 'carlos@correo.com')
    const suffix = Date.now()

    const linea = await client
      .post('/api/v1/lineas-tematicas')
      .bearerToken(admin)
      .json({ nombre: `Línea suelta ${suffix}` })
    linea.assertStatus(200)

    const red = await client
      .post('/api/v1/redes-conocimiento')
      .bearerToken(admin)
      .json({ nombre: `Red suelta ${suffix}` })
    red.assertStatus(200)

    const programa = await client
      .post('/api/v1/programas-formacion')
      .bearerToken(admin)
      .json({
        idRedConocimiento: datosDe<{ id: number }>(red).id,
        idLineaTematica: datosDe<{ id: number }>(linea).id,
        idNivelPrograma: 1,
        codigo: `BAD-${suffix}`,
        nombre: `Programa inválido ${suffix}`,
        version: '1',
      })
    programa.assertStatus(422)
  })

  test('un perfil sin permisos de formación no entra y el admin sí', async ({
    client,
    assert,
  }) => {
    const admin = await login(client, 'carlos@correo.com')
    const bodegaUser = await login(client, 'adminbodega@correo.com')
    const suffix = Date.now()
    const { programaId } = await crearCadena(client, admin, suffix)

    const ajena = await client
      .post('/api/v1/fichas')
      .bearerToken(admin)
      .json({
        idPrograma: programaId,
        idJornada: 2,
        numeroFicha: `${suffix}`,
        idCformacion: 2,
      })
    ajena.assertStatus(200)
    const ajenaRow = datosDe<{ id: number; centroFormacionId: number }>(ajena)
    assert.equal(ajenaRow.centroFormacionId, 2)

    // Un perfil de bodega no trae permisos de formación: ni siquiera lista.
    const propias = await client.get('/api/v1/fichas').bearerToken(bodegaUser)
    propias.assertStatus(403)

    const detalle = await client.get(`/api/v1/fichas/${ajenaRow.id}`).bearerToken(bodegaUser)
    detalle.assertStatus(403)

    const crear = await client
      .post('/api/v1/fichas')
      .bearerToken(bodegaUser)
      .json({
        idPrograma: programaId,
        numeroFicha: `no-${suffix}`,
      })
    crear.assertStatus(403)

    const crearNivel = await client
      .post('/api/v1/niveles-programa')
      .bearerToken(bodegaUser)
      .json({ nombre: `No ${suffix}` })
    crearNivel.assertStatus(403)

    const programasAjenos = await client.get('/api/v1/programas-formacion').bearerToken(bodegaUser)
    programasAjenos.assertStatus(403)

    // El admin sí administra el catálogo.
    const programas = await client.get('/api/v1/programas-formacion').bearerToken(admin)
    programas.assertStatus(200)
    assert.isTrue((programas.body().data as { id: number }[]).some((row) => row.id === programaId))
  })
})
