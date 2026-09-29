import { access, constants } from 'node:fs'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import { fotosDir } from '#config/fotos'
import SubBodega from '#models/sub_bodega'
import Subcategoria from '#models/subcategoria'

const accessFile = promisify(access)

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
)

async function login(client: ApiClient, email = 'carlos@correo.com') {
  const response = await client.post('/api/v1/auth/login').json({ email, password: '123456' })
  response.assertStatus(200)
  return response.body().data.token as string
}

async function archivoExiste(id: number) {
  try {
    await accessFile(join(fotosDir, 'elementos', String(id), 'foto.webp'), constants.R_OK)
    return true
  } catch {
    return false
  }
}

test.group('Fotografía de elemento', () => {
  test('guarda la foto en disco y en la base solo la ruta pública', async ({ client, assert }) => {
    const token = await login(client)
    const suffix = Date.now()

    const subcategoria = await Subcategoria.query()
      .where('estado', true)
      .orderBy('id_subcategoria', 'asc')
      .firstOrFail()

    const itemRes = await client
      .post('/api/v1/inventario/items')
      .bearerToken(token)
      .json({
        nombre: `Tornillo foto ${suffix}`,
        descripcion: 'Tornillo de prueba',
        idSubcategoria: subcategoria.id,
      })
    itemRes.assertStatus(200)
    const item = itemRes.body().data as { id: number }

    const bodegas = await client.get('/api/v1/bodegas').bearerToken(token)
    bodegas.assertStatus(200)
    const bodega = (bodegas.body().data as { id: number }[])[0]

    const subBodega = await SubBodega.create({
      idBodega: bodega.id,
      nombre: `Sub foto ${suffix}`,
      estado: true,
    })

    const standRes = await client
      .post(`/api/v1/bodegas/sub-bodegas/${subBodega.id}/stands`)
      .bearerToken(token)
      .json({ nombre: `Stand foto ${suffix}` })
    standRes.assertStatus(200)
    const stand = standRes.body().data as { id: number }

    const unidades = await client.get('/api/v1/unidades-medida').bearerToken(token)
    unidades.assertStatus(200)
    const unidad = (unidades.body().data as { id: number }[])[0]

    const creado = await client
      .post('/api/v1/inventario/elementos')
      .bearerToken(token)
      .json({
        idItem: item.id,
        idStand: stand.id,
        cantidad: 10,
        estado: true,
        idUnidadMedida: unidad.id,
        codigo: `FOTO-${suffix}`,
        urlFotografia: 'https://ejemplo.test/foto.jpg',
      })
    creado.assertStatus(200)
    const elemento = creado.body().data as { id: number; urlFotografia: string | null }
    assert.isNull(elemento.urlFotografia)

    const subida = await client
      .post(`/api/v1/inventario/elementos/${elemento.id}/fotografia`)
      .bearerToken(token)
      .file('fotografia', png, { filename: 'foto.png', contentType: 'image/png' })
    subida.assertStatus(200)
    assert.equal(
      subida.body().data.urlFotografia,
      `/api/v1/inventario/elementos/${elemento.id}/fotografia`
    )
    assert.isTrue(await archivoExiste(elemento.id))

    const lectura = await client
      .get(`/api/v1/inventario/elementos/${elemento.id}/fotografia`)
      .bearerToken(token)
    lectura.assertStatus(200)
    assert.include(String(lectura.header('content-type')), 'image/webp')

    const invalida = await client
      .post(`/api/v1/inventario/elementos/${elemento.id}/fotografia`)
      .bearerToken(token)
      .file('fotografia', Buffer.from('no es una imagen'), {
        filename: 'nota.txt',
        contentType: 'text/plain',
      })
    invalida.assertStatus(422)

    const borrada = await client
      .delete(`/api/v1/inventario/elementos/${elemento.id}/fotografia`)
      .bearerToken(token)
    borrada.assertStatus(200)
    assert.isNull(borrada.body().data.urlFotografia)
    assert.isFalse(await archivoExiste(elemento.id))

    const ausente = await client
      .get(`/api/v1/inventario/elementos/${elemento.id}/fotografia`)
      .bearerToken(token)
    ausente.assertStatus(404)
  })
})
