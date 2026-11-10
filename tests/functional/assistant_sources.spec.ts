import { test } from '@japa/runner'
import AssistantSource from '#models/assistant_source'
import User from '#models/usuario'

async function tokenDe(email: string) {
  const user = await User.findByOrFail('email', email)
  const token = await User.accessTokens.create(user)

  return token.value!.release()
}

type GuiaRow = {
  id: number
  titulo: string
  modulo: string
  contenido: string
  estado: boolean
}

test.group('Guías del asistente', () => {
  test('un usuario con sesión ve las guías encendidas', async ({ client, assert }) => {
    const token = await tokenDe('adminsigma@correo.com')
    const suffix = Date.now()

    const encendida = await AssistantSource.create({
      titulo: `Cómo pedir un material ${suffix}`,
      modulo: 'Solicitudes de material',
      contenido: 'Entra al módulo y elige la ficha.',
      estado: true,
    })

    const apagada = await AssistantSource.create({
      titulo: `Guía apagada ${suffix}`,
      modulo: 'Entregas',
      contenido: 'Esta no debe salir en la lista.',
      estado: false,
    })

    const response = await client.get('/api/v1/assistant/sources').bearerToken(token)
    response.assertStatus(200)

    const rows = response.body().data as GuiaRow[]
    const visible = rows.find((row) => row.id === encendida.id)

    assert.exists(visible)
    assert.equal(visible?.titulo, encendida.titulo)
    assert.equal(visible?.modulo, 'Solicitudes de material')
    assert.equal(visible?.contenido, 'Entra al módulo y elige la ficha.')
    assert.isTrue(visible?.estado)
    assert.isFalse(rows.some((row) => row.id === apagada.id))
  })

  test('un administrador ve también las guías apagadas', async ({ client, assert }) => {
    const token = await tokenDe('adminsigma@correo.com')
    const suffix = Date.now()
    const apagada = await AssistantSource.create({
      titulo: `Guía apagada visible ${suffix}`,
      modulo: 'Entregas',
      contenido: 'El administrador la puede volver a encender.',
      estado: false,
    })

    const response = await client
      .get('/api/v1/assistant/sources?incluirApagadas=true')
      .bearerToken(token)
    response.assertStatus(200)

    const rows = response.body().data as GuiaRow[]
    assert.isTrue(rows.some((row) => row.id === apagada.id && row.estado === false))
  })

  test('quien no es administrador no ve las guías apagadas', async ({ client }) => {
    const token = await tokenDe('instructor.pf0010@correo.com')
    const response = await client
      .get('/api/v1/assistant/sources?incluirApagadas=true')
      .bearerToken(token)
    response.assertStatus(403)
  })

  test('sin sesión la lista no se abre', async ({ client }) => {
    const response = await client.get('/api/v1/assistant/sources')
    response.assertStatus(401)
  })

  test('un administrador guarda una guía y después aparece en la lista', async ({
    client,
    assert,
  }) => {
    const token = await tokenDe('adminsigma@correo.com')
    const suffix = Date.now()
    const titulo = `Cómo registrar una entrega ${suffix}`

    const creada = await client.post('/api/v1/assistant/sources').bearerToken(token).json({
      titulo,
      modulo: 'Entregas',
      contenido: 'Entra a Entregas, elige la solicitud y confirma la cantidad.',
    })
    creada.assertStatus(200)

    const guia = creada.body().data as GuiaRow
    assert.equal(guia.titulo, titulo)
    assert.equal(guia.modulo, 'Entregas')
    assert.equal(guia.contenido, 'Entra a Entregas, elige la solicitud y confirma la cantidad.')
    assert.isTrue(guia.estado)

    const lista = await client.get('/api/v1/assistant/sources').bearerToken(token)
    lista.assertStatus(200)
    const rows = lista.body().data as GuiaRow[]
    assert.isTrue(rows.some((row) => row.id === guia.id && row.titulo === titulo))
  })

  test('quien no es administrador no puede guardar una guía', async ({ client }) => {
    const token = await tokenDe('instructor.pf0010@correo.com')
    const response = await client.post('/api/v1/assistant/sources').bearerToken(token).json({
      titulo: 'Guía que no debe guardarse',
      modulo: 'Entregas',
      contenido: 'Este texto no entra.',
    })

    response.assertStatus(403)
  })

  test('una pregunta encuentra la guía encendida que habla de eso', async ({ client, assert }) => {
    const token = await tokenDe('instructor.pf0010@correo.com')
    const suffix = Date.now()

    const entrega = await AssistantSource.create({
      titulo: `Cómo registrar una entrega ${suffix}`,
      modulo: 'Entregas',
      contenido: 'Entra a Entregas, elige la solicitud y confirma la cantidad.',
      estado: true,
    })

    const apagada = await AssistantSource.create({
      titulo: `Entrega vieja ${suffix}`,
      modulo: 'Entregas',
      contenido: 'Esta guía de entrega está apagada.',
      estado: false,
    })

    const response = await client
      .post('/api/v1/assistant/sources/buscar')
      .bearerToken(token)
      .json({ pregunta: '¿Cómo registro una entrega?' })
    response.assertStatus(200)

    const rows = response.body().data as GuiaRow[]
    assert.isTrue(rows.some((row) => row.id === entrega.id))
    assert.isFalse(rows.some((row) => row.id === apagada.id))
  })

  test('si ninguna guía habla de la pregunta, la lista viene vacía', async ({ client, assert }) => {
    const token = await tokenDe('instructor.pf0010@correo.com')
    const response = await client
      .post('/api/v1/assistant/sources/buscar')
      .bearerToken(token)
      .json({ pregunta: 'xyznoexiste' })
    response.assertStatus(200)
    assert.deepEqual(response.body().data, [])
  })

  test('la respuesta es el texto de la guía encontrada', async ({ client, assert }) => {
    const token = await tokenDe('instructor.pf0010@correo.com')
    const suffix = Date.now()
    const contenido = 'Entra a Entregas, elige la solicitud y confirma la cantidad.'
    const guia = await AssistantSource.create({
      titulo: `Cómo registrar una entrega ${suffix}`,
      modulo: 'Entregas',
      contenido,
      estado: true,
    })

    const apagada = await AssistantSource.create({
      titulo: `Entrega vieja ${suffix}`,
      modulo: 'Entregas',
      contenido: 'Esta guía de entrega está apagada.',
      estado: false,
    })

    const response = await client.post('/api/v1/assistant/preguntar').bearerToken(token).json({
      pregunta: '¿Cómo registro una entrega?',
    })
    response.assertStatus(200)

    const respuesta = response.body().data.respuesta as string
    assert.include(respuesta, guia.titulo)
    assert.include(respuesta, contenido)
    assert.notInclude(respuesta, apagada.contenido)

    const fuentes = response.body().data.fuentes as { id: number }[]
    assert.isTrue(fuentes.some((fuente) => fuente.id === guia.id))
    assert.isFalse(fuentes.some((fuente) => fuente.id === apagada.id))
  })

  test('sin guía, contesta que no la tiene', async ({ client, assert }) => {
    const token = await tokenDe('instructor.pf0010@correo.com')
    const response = await client.post('/api/v1/assistant/preguntar').bearerToken(token).json({
      pregunta: 'xyznoexiste',
    })
    response.assertStatus(200)
    assert.include(
      response.body().data.respuesta,
      'Todavía no tengo una guía de ese tema.',
    )
    assert.include(response.body().data.respuesta, 'administrador de SIGMA')
    assert.deepEqual(response.body().data.fuentes, [])
  })

  test('acepta una pregunta del largo que permite el chat', async ({ client }) => {
    const token = await tokenDe('instructor.pf0010@correo.com')
    const pregunta = `${'entrega '.repeat(80)}xyznoexiste`.slice(0, 600)
    const response = await client.post('/api/v1/assistant/preguntar').bearerToken(token).json({
      pregunta,
    })
    response.assertStatus(200)
  })

  test('rechaza una pregunta de más de 1000 caracteres', async ({ client }) => {
    const token = await tokenDe('instructor.pf0010@correo.com')
    const response = await client.post('/api/v1/assistant/preguntar').bearerToken(token).json({
      pregunta: 'a'.repeat(1001),
    })
    response.assertStatus(422)
  })

  test('una guía sin texto no se guarda', async ({ client }) => {
    const token = await tokenDe('adminsigma@correo.com')
    const response = await client.post('/api/v1/assistant/sources').bearerToken(token).json({
      titulo: '',
      modulo: 'Entregas',
      contenido: '',
    })

    response.assertStatus(422)
  })

  test('al corregir el texto, la siguiente pregunta usa el texto nuevo', async ({
    client,
    assert,
  }) => {
    const admin = await tokenDe('adminsigma@correo.com')
    const suffix = Date.now()
    const guia = await AssistantSource.create({
      titulo: `Planilla ${suffix}`,
      modulo: 'Entregas',
      contenido: `Texto viejo de la planilla${suffix}.`,
      estado: true,
    })

    const editada = await client
      .patch(`/api/v1/assistant/sources/${guia.id}`)
      .bearerToken(admin)
      .json({ contenido: `Texto nuevo de la planilla${suffix}.` })
    editada.assertStatus(200)
    assert.equal(editada.body().data.contenido, `Texto nuevo de la planilla${suffix}.`)

    const respuesta = await client.post('/api/v1/assistant/preguntar').bearerToken(admin).json({
      pregunta: `planilla${suffix}`,
    })
    respuesta.assertStatus(200)
    assert.include(respuesta.body().data.respuesta, `Texto nuevo de la planilla${suffix}.`)
    assert.notInclude(respuesta.body().data.respuesta, `Texto viejo de la planilla${suffix}.`)
  })

  test('quien no es administrador no puede corregir una guía', async ({ client }) => {
    const token = await tokenDe('instructor.pf0010@correo.com')
    const guia = await AssistantSource.create({
      titulo: 'Guía protegida',
      modulo: 'Entregas',
      contenido: 'Texto que el instructor no puede cambiar.',
      estado: true,
    })

    const response = await client
      .patch(`/api/v1/assistant/sources/${guia.id}`)
      .bearerToken(token)
      .json({ contenido: 'Texto intruso.' })
    response.assertStatus(403)
  })

  test('un saludo usa el nombre de quien escribe', async ({ client, assert }) => {
    const user = await User.findByOrFail('email', 'instructor.pf0010@correo.com')
    const token = await tokenDe(user.email)
    const nombre = user.nombres.trim().split(/\s+/)[0]

    const response = await client.post('/api/v1/assistant/preguntar').bearerToken(token).json({
      pregunta: 'hola',
    })
    response.assertStatus(200)

    assert.include(response.body().data.respuesta, `Hola ${nombre}.`)
    assert.include(response.body().data.respuesta, 'asistente de SIGMA')
    assert.deepEqual(response.body().data.fuentes, [])
  })

  test('cómo estás saluda por el nombre y responde', async ({ client, assert }) => {
    const user = await User.findByOrFail('email', 'instructor.pf0010@correo.com')
    const token = await tokenDe(user.email)
    const nombre = user.nombres.trim().split(/\s+/)[0]

    const response = await client.post('/api/v1/assistant/preguntar').bearerToken(token).json({
      pregunta: '¿Cómo estás?',
    })
    response.assertStatus(200)

    const respuesta = response.body().data.respuesta as string
    assert.include(respuesta, `Hola ${nombre}.`)
    assert.include(respuesta, 'Muy bien, gracias.')
    assert.include(respuesta, '¿Y tú?')
  })

  test('quien lo creó presenta al equipo y dónde verlo', async ({ client, assert }) => {
    const token = await tokenDe('instructor.pf0010@correo.com')
    const response = await client.post('/api/v1/assistant/preguntar').bearerToken(token).json({
      pregunta: '¿Quién te hizo? Cuéntame del equipo',
    })
    response.assertStatus(200)

    const respuesta = response.body().data.respuesta as string
    assert.include(respuesta, 'Henry Bastidas')
    assert.include(respuesta, 'Alex Jhoan Chaguendo')
    assert.include(respuesta, 'Sofia Bonilla Gallego')
    assert.include(respuesta, '/equipo')
    assert.include(respuesta, 'orgullosos')
    assert.notInclude(respuesta, 'devolutivo')
  })

  test('pedir un equipo devolutivo no habla del equipo de desarrollo', async ({ client, assert }) => {
    const token = await tokenDe('instructor.pf0010@correo.com')
    const suffix = Date.now()
    const guia = await AssistantSource.create({
      titulo: `Cómo solicitar un equipo devolutivo ${suffix}`,
      modulo: 'Solicitudes',
      contenido: `El equipo devolutivo ${suffix} se pide en Inventario, Solicitudes.`,
      estado: true,
    })

    const response = await client.post('/api/v1/assistant/preguntar').bearerToken(token).json({
      pregunta: '¿Cómo solicito un equipo devolutivo?',
    })
    response.assertStatus(200)

    const respuesta = response.body().data.respuesta as string
    assert.include(respuesta, guia.contenido)
    assert.notInclude(respuesta, 'Henry Bastidas')
  })

  test('no lista categorías ni inventario', async ({ client, assert }) => {
    const token = await tokenDe('instructor.pf0010@correo.com')
    const response = await client.post('/api/v1/assistant/preguntar').bearerToken(token).json({
      pregunta: '¿Cuáles son las categorías del inventario?',
    })
    response.assertStatus(200)

    const respuesta = response.body().data.respuesta as string
    assert.include(respuesta, 'No tengo permiso')
    assert.include(respuesta, 'perfil')
    assert.notInclude(respuesta, 'Nueva categoría')
    assert.deepEqual(response.body().data.fuentes, [])
  })

  test('explica cómo crear una categoría sin negar el permiso', async ({ client, assert }) => {
    const token = await tokenDe('instructor.pf0010@correo.com')
    const suffix = Date.now()
    await AssistantSource.create({
      titulo: `Categorías y subcategorías ${suffix}`,
      modulo: 'Inventario',
      contenido: `Pulsa Nueva categoría ${suffix} en Inventario, Categorías.`,
      estado: true,
    })

    const response = await client.post('/api/v1/assistant/preguntar').bearerToken(token).json({
      pregunta: `¿Cómo creo una categoría ${suffix}?`,
    })
    response.assertStatus(200)

    const respuesta = response.body().data.respuesta as string
    assert.include(respuesta, `Nueva categoría ${suffix}`)
    assert.notInclude(respuesta, 'No tengo permiso')
  })

  test('explica las notificaciones según el perfil', async ({ client, assert }) => {
    const token = await tokenDe('instructor.pf0010@correo.com')
    const response = await client.post('/api/v1/assistant/preguntar').bearerToken(token).json({
      pregunta: '¿Qué notificaciones llegan según el rol?',
    })
    response.assertStatus(200)

    const respuesta = response.body().data.respuesta as string
    assert.include(respuesta, 'Instructor.')
    assert.include(respuesta, 'Admin bodega.')
    assert.include(respuesta, 'Coordinador académico.')
    assert.include(respuesta, 'campana')
  })

  test('corregir una guía que no existe responde 404', async ({ client }) => {
    const token = await tokenDe('adminsigma@correo.com')
    const response = await client
      .patch('/api/v1/assistant/sources/999999999')
      .bearerToken(token)
      .json({ contenido: 'No hay fila.' })
    response.assertStatus(404)
  })
})
