import { mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import ExcelJS from 'exceljs'

async function login(client: ApiClient, email: string) {
  const response = await client.post('/api/v1/auth/login').json({ email, password: '123456' })
  response.assertStatus(200)
  return response.body().data.token as string
}

function datosDe<T>(response: { body(): unknown }) {
  return (response.body() as { data: T }).data
}

async function crearPrograma(client: ApiClient, token: string, suffix: number) {
  const linea = await client
    .post('/api/v1/lineas-tematicas')
    .bearerToken(token)
    .json({ nombre: `Línea LM ${suffix}` })
  linea.assertStatus(200)

  const red = await client
    .post('/api/v1/redes-conocimiento')
    .bearerToken(token)
    .json({ nombre: `Red LM ${suffix}`, lineaIds: [datosDe<{ id: number }>(linea).id] })
  red.assertStatus(200)

  const nivel = await client
    .post('/api/v1/niveles-programa')
    .bearerToken(token)
    .json({ nombre: `Nivel LM ${suffix}` })
  nivel.assertStatus(200)

  const programa = await client
    .post('/api/v1/programas-formacion')
    .bearerToken(token)
    .json({
      idRedConocimiento: datosDe<{ id: number }>(red).id,
      idLineaTematica: datosDe<{ id: number }>(linea).id,
      idNivelPrograma: datosDe<{ id: number }>(nivel).id,
      codigo: `228118-${suffix}`,
      nombre: `Análisis y desarrollo ${suffix}`,
      version: '1',
    })
  programa.assertStatus(200)
  const programaId = datosDe<{ id: number }>(programa).id

  const ficha = await client
    .post('/api/v1/fichas')
    .bearerToken(token)
    .json({
      idPrograma: programaId,
      idCformacion: 1,
      numeroFicha: `F-${suffix}`,
    })
  ficha.assertStatus(200)

  return { programaId, fichaId: datosDe<{ id: number }>(ficha).id }
}

async function excelAnexo(path: string, codigoPrograma: string) {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Materiales')
  sheet.getCell('C6').value = 'CÓDIGO DE PROGRAMA DE FORMACIÓN'
  sheet.getCell('G6').value = codigoPrograma
  sheet.getCell('C11').value = 'ITEM'
  sheet.getCell('D11').value = 'CÓDIGO UNSPSC'
  sheet.getCell('E11').value = 'PRODUCTO'
  sheet.getCell('F11').value = 'DESCRIPCION TÉCNICA MINIMA REQUERIDA DEL BIEN'
  sheet.getCell('G11').value = 'UNIDAD DE MEDIDA'
  sheet.getCell('H11').value = 'CANTIDAD REQUERIDA PARA FORMAR 30 APRENDICES'
  sheet.getCell('I11').value = 'OBSERVACIONES'
  sheet.getCell('K11').value = 'Consumo'
  sheet.getCell('L11').value = 'Devolutivo'
  const data = sheet.getRow(12)
  data.getCell(3).value = 1
  data.getCell(4).value = '44111905'
  data.getCell(5).value = 'Tableros de borrado en seco'
  data.getCell(6).value = 'Tablero acrílico 120x60'
  data.getCell(7).value = 'Unidad'
  data.getCell(8).value = 2
  data.getCell(9).value = 'Para el aula'
  data.getCell(11).value = 'x'
  await workbook.xlsx.writeFile(path)
}

test.group('Lista maestra, vigencia y solicitudes de formación', () => {
  test('las rutas piden token', async ({ client }) => {
    const lista = await client.get('/api/v1/listas-maestras-material?programaId=1')
    lista.assertStatus(401)

    const vigencias = await client.get('/api/v1/vigencias')
    vigencias.assertStatus(401)
  })

  test('carga el anexo SENA a la lista maestra y pide sobre esa lista', async ({
    client,
    assert,
  }) => {
    const admin = await login(client, 'carlos@correo.com')
    const suffix = Date.now()
    const { programaId, fichaId } = await crearPrograma(client, admin, suffix)

    const dir = join(tmpdir(), 'lista-maestra-tests')
    await mkdir(dir, { recursive: true })
    const filePath = join(dir, `anexo-${suffix}.xlsx`)
    await excelAnexo(filePath, `228118-${suffix}`)

    const importado = await client
      .post('/api/v1/listas-maestras-material/importar')
      .bearerToken(admin)
      .field('programaId', String(programaId))
      .file('archivo', filePath)

    importado.assertStatus(200)
    const carga = datosDe<{ items: Array<{ codigoUnspsc: string; producto: string }>; errores: string[] }>(
      importado
    )
    assert.lengthOf(carga.errores, 0)
    assert.equal(carga.items[0].codigoUnspsc, '44111905')
    assert.include(carga.items[0].producto.toLowerCase(), 'tablero')

    const lista = await client
      .get(`/api/v1/listas-maestras-material?programaId=${programaId}`)
      .bearerToken(admin)
    lista.assertStatus(200)
    const materiales = datosDe<Array<{ id: number; codigoUnspsc: string }>>(lista)
    assert.isTrue(materiales.some((item) => item.codigoUnspsc === '44111905'))
    const materialId = materiales[0].id

    const vigencia = await client
      .post('/api/v1/vigencias')
      .bearerToken(admin)
      .json({
        anio: 2090 + (suffix % 9),
        activa: true,
        fecha_apertura: '2090-01-01',
        fecha_cierre: '2090-12-31',
      })
    vigencia.assertStatus(200)

    const usuarios = await client.get('/api/v1/users').bearerToken(admin)
    usuarios.assertStatus(200)
    const instructor = (usuarios.body().data as { id: number; email: string }[]).find(
      (user) => user.email === 'instructor@correo.com'
    )
    if (!instructor) {
      throw new Error('Falta el usuario instructor@correo.com')
    }

    await client
      .put(`/api/v1/users/${instructor.id}/programas`)
      .bearerToken(admin)
      .json({ programaIds: [programaId] })

    const solicitud = await client
      .post('/api/v1/solicitudes-programa')
      .bearerToken(admin)
      .json({
        programaId,
        fichaId,
        instructorId: instructor.id,
        items: [{ listaMaestraId: materialId, cantidadSolicitada: 4 }],
      })
    solicitud.assertStatus(200)
    const creada = datosDe<{ id: number; estado: string }>(solicitud)
    assert.equal(creada.estado, 'borrador')

    const enviada = await client
      .post(`/api/v1/solicitudes-programa/${creada.id}/enviar`)
      .bearerToken(admin)
    enviada.assertStatus(200)
    assert.equal(datosDe<{ estado: string }>(enviada).estado, 'enviada')
    assert.lengthOf(datosDe<{ items: unknown[] }>(enviada).items, 1)
  })

  test('un excel sin encabezados de UNSPSC no se carga', async ({ client, assert }) => {
    const admin = await login(client, 'carlos@correo.com')
    const suffix = Date.now() + 1
    const { programaId } = await crearPrograma(client, admin, suffix)

    const dir = join(tmpdir(), 'lista-maestra-tests')
    await mkdir(dir, { recursive: true })
    const filePath = join(dir, `malo-${suffix}.xlsx`)
    const workbook = new ExcelJS.Workbook()
    workbook.addWorksheet('Hoja1').getCell('A1').value = 'sin encabezados de materiales'
    await workbook.xlsx.writeFile(filePath)

    const importado = await client
      .post('/api/v1/listas-maestras-material/importar')
      .bearerToken(admin)
      .field('programaId', String(programaId))
      .file('archivo', filePath)

    importado.assertStatus(200)
    const carga = datosDe<{ items: unknown[]; errores: string[] }>(importado)
    assert.lengthOf(carga.items, 0)
    assert.isAbove(carga.errores.length, 0)
  })
})
