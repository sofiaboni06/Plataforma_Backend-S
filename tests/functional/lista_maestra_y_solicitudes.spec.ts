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

async function idDeUsuario(client: ApiClient, token: string, email: string) {
  const usuarios = await client.get('/api/v1/users').bearerToken(token)
  usuarios.assertStatus(200)
  const usuario = (usuarios.body().data as { id: number; email: string }[]).find(
    (user) => user.email === email
  )
  if (!usuario) {
    throw new Error(`Falta el usuario ${email}`)
  }
  return usuario.id
}

async function asignarPrograma(
  client: ApiClient,
  token: string,
  userId: number,
  programaId: number
) {
  const actuales = await client.get(`/api/v1/users/${userId}/programas`).bearerToken(token)
  actuales.assertStatus(200)
  const ids = datosDe<{ id: number }[]>(actuales).map((fila) => fila.id)
  const asignado = await client
    .put(`/api/v1/users/${userId}/programas`)
    .bearerToken(token)
    .json({ programaIds: [...new Set([...ids, programaId])] })
  asignado.assertStatus(200)
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

  test('carga el anexo SENA, el instructor pide y coordinación decide', async ({
    client,
    assert,
  }) => {
    const admin = await login(client, 'carlos@correo.com')
    const instructor = await login(client, 'instructor@correo.com')
    const coordinador = await login(client, 'coordinador@correo.com')
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
    const material = materiales.find((item) => item.codigoUnspsc === '44111905')
    assert.exists(material)

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

    const instructorId = await idDeUsuario(client, admin, 'instructor@correo.com')
    const coordinadorId = await idDeUsuario(client, admin, 'coordinador@correo.com')
    await asignarPrograma(client, admin, instructorId, programaId)
    await asignarPrograma(client, admin, coordinadorId, programaId)

    const vistaCoordinador = await client
      .get(`/api/v1/listas-maestras-material?programaId=${programaId}`)
      .bearerToken(coordinador)
    vistaCoordinador.assertStatus(200)

    const solicitud = await client
      .post('/api/v1/solicitudes-programa')
      .bearerToken(instructor)
      .json({
        programaId,
        fichaId,
        items: [{ listaMaestraId: material!.id, cantidadSolicitada: 4 }],
      })
    solicitud.assertStatus(200)
    const creada = datosDe<{ id: number; estado: string; items: Array<{ id: number }> }>(solicitud)
    assert.equal(creada.estado, 'borrador')
    assert.lengthOf(creada.items, 1)

    const enviada = await client
      .post(`/api/v1/solicitudes-programa/${creada.id}/enviar`)
      .bearerToken(instructor)
    enviada.assertStatus(200)
    assert.equal(datosDe<{ estado: string }>(enviada).estado, 'enviada')

    const avisosCoordinador = await client
      .get('/api/v1/account/notifications')
      .bearerToken(coordinador)
      .qs({ perPage: 100 })
    avisosCoordinador.assertStatus(200)
    const bandejaCoordinador = datosDe<Array<{ tipo: string; idReferencia: number | null }>>(
      avisosCoordinador
    )
    assert.isTrue(
      bandejaCoordinador.some(
        (aviso) => aviso.tipo === 'solicitud_programa' && aviso.idReferencia === creada.id
      )
    )

    const decidida = await client
      .post(`/api/v1/solicitudes-programa/${creada.id}/decidir`)
      .bearerToken(coordinador)
      .json({
        items: [{ id: creada.items[0].id, accion: 'entregar' }],
      })
    decidida.assertStatus(200)
    const resultado = datosDe<{ estado: string; items: Array<{ estado: string; cantidadAprobada: number }> }>(
      decidida
    )
    assert.equal(resultado.estado, 'aprobada')
    assert.equal(resultado.items[0].estado, 'aprobado')
    assert.equal(resultado.items[0].cantidadAprobada, 4)

    const avisosInstructor = await client
      .get('/api/v1/account/notifications')
      .bearerToken(instructor)
      .qs({ perPage: 100 })
    avisosInstructor.assertStatus(200)
    const bandejaInstructor = datosDe<Array<{ tipo: string; idReferencia: number | null }>>(
      avisosInstructor
    )
    assert.isTrue(
      bandejaInstructor.some(
        (aviso) => aviso.tipo === 'decision_solicitud_programa' && aviso.idReferencia === creada.id
      )
    )
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
