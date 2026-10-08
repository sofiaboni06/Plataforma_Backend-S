import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'

type Clasificacion = { id: number; nombre: string; estado: boolean }

async function login(client: ApiClient, email = 'carlos@correo.com') {
  const response = await client.post('/api/v1/auth/login').json({ email, password: '123456' })
  response.assertStatus(200)
  return response.body().data.token as string
}

function datosDe<T>(response: { body(): unknown }) {
  return (response.body() as { data: T }).data
}

test.group('Clasificaciones de elemento', () => {
  test('no deja crear ni renombrar a un nombre repetido (mayúsculas, tildes, espacios)', async ({
    client,
    assert,
  }) => {
    const token = await login(client)
    const suffix = Date.now()
    const crear = (nombre: string) =>
      client
        .post('/api/v1/clasificaciones-elemento')
        .bearerToken(token)
        .json({ nombre, caracter: 'consumo' })

    const original = await crear(`Pintura Ácida ${suffix}`)
    original.assertStatus(200)
    const idOriginal = datosDe<Clasificacion>(original).id

    // Mismo nombre con otras mayúsculas, sin tilde y con espacios de más.
    const repetida = await crear(`  PINTURA   acida  ${suffix} `)
    repetida.assertStatus(422)
    assert.equal(
      (repetida.body() as unknown as { message: string }).message,
      'Ya existe una clasificación con ese nombre'
    )

    const otra = await crear(`Pintura Base ${suffix}`)
    otra.assertStatus(200)
    const idOtra = datosDe<Clasificacion>(otra).id

    // Renombrar la otra al nombre de la primera: rechazado.
    const renombrada = await client
      .patch(`/api/v1/clasificaciones-elemento/${idOtra}`)
      .bearerToken(token)
      .json({ nombre: `pintura ácida ${suffix}` })
    renombrada.assertStatus(422)
    assert.equal(
      (renombrada.body() as unknown as { message: string }).message,
      'Ya existe una clasificación con ese nombre'
    )

    // Guardarse a sí misma, con el mismo nombre o solo cambiando mayúsculas, sí.
    const misma = await client
      .patch(`/api/v1/clasificaciones-elemento/${idOriginal}`)
      .bearerToken(token)
      .json({ nombre: `Pintura Ácida ${suffix}`, caracter: 'devolutivo' })
    misma.assertStatus(200)
    assert.equal(datosDe<Clasificacion & { caracter: string }>(misma).caracter, 'devolutivo')

    const mayusculas = await client
      .patch(`/api/v1/clasificaciones-elemento/${idOriginal}`)
      .bearerToken(token)
      .json({ nombre: `PINTURA ÁCIDA ${suffix}` })
    mayusculas.assertStatus(200)

    // Una deshabilitada también cuenta: no se crea otra con su nombre.
    const borrada = await client
      .delete(`/api/v1/clasificaciones-elemento/${idOtra}`)
      .bearerToken(token)
    borrada.assertStatus(200)
    const sobreBorrada = await crear(`pintura base ${suffix}`)
    sobreBorrada.assertStatus(422)
  })

  test('una clasificación deshabilitada sale del selector pero el elemento la sigue mostrando', async ({
    client,
    assert,
  }) => {
    const token = await login(client)
    const suffix = Date.now()

    const clasificacion = await client
      .post('/api/v1/clasificaciones-elemento')
      .bearerToken(token)
      .json({ nombre: `VIEJA ${suffix}`, caracter: 'devolutivo' })
    clasificacion.assertStatus(200)
    const idClasificacion = datosDe<Clasificacion>(clasificacion).id

    const categoria = await client
      .post('/api/v1/categorias')
      .bearerToken(token)
      .json({ nombre: `Cat clasif ${suffix}` })
    categoria.assertStatus(200)
    const subcategoria = await client
      .post('/api/v1/subcategorias')
      .bearerToken(token)
      .json({ idCategoria: datosDe<{ id: number }>(categoria).id, nombre: `Sub clasif ${suffix}` })
    subcategoria.assertStatus(200)
    const item = await client
      .post('/api/v1/inventario/items')
      .bearerToken(token)
      .json({
        nombre: `Martillo ${suffix}`,
        idSubcategoria: datosDe<{ id: number }>(subcategoria).id,
      })
    item.assertStatus(200)

    const bodegas = await client.get('/api/v1/bodegas').bearerToken(token)
    const idBodega = datosDe<{ id: number }[]>(bodegas)[0].id
    const subBodega = await client
      .post(`/api/v1/bodegas/${idBodega}/sub-bodegas`)
      .bearerToken(token)
      .json({ nombre: `Sub clasif ${suffix}` })
    subBodega.assertStatus(200)
    const stand = await client
      .post(`/api/v1/bodegas/sub-bodegas/${datosDe<{ id: number }>(subBodega).id}/stands`)
      .bearerToken(token)
      .json({ nombre: `Stand clasif ${suffix}` })
    stand.assertStatus(200)
    const unidades = await client.get('/api/v1/unidades-medida').bearerToken(token)

    const elemento = await client
      .post('/api/v1/inventario/elementos')
      .bearerToken(token)
      .json({
        idItem: datosDe<{ id: number }>(item).id,
        nombre: datosDe<{ nombre: string }>(item).nombre,
        idStand: datosDe<{ id: number }>(stand).id,
        cantidad: 10,
        estado: true,
        idUnidadMedida: datosDe<{ id: number }[]>(unidades)[0].id,
        codigo: `CLA-${suffix}`,
        idClasificacion,
        caracter: 'devolutivo',
      })
    elemento.assertStatus(200)
    const idElemento = datosDe<{ id: number }>(elemento).id

    const deshabilitada = await client
      .delete(`/api/v1/clasificaciones-elemento/${idClasificacion}`)
      .bearerToken(token)
    deshabilitada.assertStatus(200)

    const activas = await client.get('/api/v1/clasificaciones-elemento').bearerToken(token)
    activas.assertStatus(200)
    assert.notInclude(
      datosDe<Clasificacion[]>(activas).map((row) => row.id),
      idClasificacion
    )

    const inactivas = await client
      .get('/api/v1/clasificaciones-elemento')
      .bearerToken(token)
      .qs({ estado: false })
    inactivas.assertStatus(200)
    assert.include(
      datosDe<Clasificacion[]>(inactivas).map((row) => row.id),
      idClasificacion
    )

    const visto = await client.get(`/api/v1/inventario/elementos/${idElemento}`).bearerToken(token)
    visto.assertStatus(200)
    const datos = datosDe<{
      caracter: string
      clasificacion: { id: number; nombre: string } | null
    }>(visto)
    assert.equal(datos.clasificacion?.id, idClasificacion)
    assert.equal(datos.clasificacion?.nombre, `VIEJA ${suffix}`)
    assert.equal(datos.caracter, 'devolutivo')
  })
})
