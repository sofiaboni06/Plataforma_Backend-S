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

async function crearPrograma(client: ApiClient, token: string, suffix: number) {
  const linea = await client
    .post('/api/v1/lineas-tematicas')
    .bearerToken(token)
    .json({ nombre: `Línea ${suffix}` })
  linea.assertStatus(200)

  const red = await client
    .post('/api/v1/redes-conocimiento')
    .bearerToken(token)
    .json({ nombre: `Red ${suffix}`, lineaIds: [datosDe<{ id: number }>(linea).id] })
  red.assertStatus(200)

  const nivel = await client
    .post('/api/v1/niveles-programa')
    .bearerToken(token)
    .json({ nombre: `Nivel ${suffix}` })
  nivel.assertStatus(200)

  const programa = await client
    .post('/api/v1/programas-formacion')
    .bearerToken(token)
    .json({
      idRedConocimiento: datosDe<{ id: number }>(red).id,
      idLineaTematica: datosDe<{ id: number }>(linea).id,
      idNivelPrograma: datosDe<{ id: number }>(nivel).id,
      codigo: `INST-${suffix}`,
      nombre: `Programa instructor ${suffix}`,
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
      numeroFicha: `INST-F-${suffix}`,
    })
  ficha.assertStatus(200)

  return programaId
}

async function idDeUsuario(client: ApiClient, token: string, email: string) {
  const usuarios = await client.get('/api/v1/users').bearerToken(token)
  usuarios.assertStatus(200)

  const usuario = (usuarios.body().data as { id: number; email: string }[]).find(
    (user) => user.email === email
  )

  if (!usuario) {
    throw new Error(`El usuario ${email} no está en la base de datos`)
  }

  return usuario.id
}

async function idDelInstructor(client: ApiClient, token: string) {
  return idDeUsuario(client, token, 'instructor@correo.com')
}

test.group('Instructores y programas de formación', () => {
  test('las rutas piden token', async ({ client }) => {
    const asignados = await client.get('/api/v1/users/29/programas')
    asignados.assertStatus(401)

    const propios = await client.get('/api/v1/account/programas')
    propios.assertStatus(401)
  })

  test('el admin asigna, lista y quita programas de un instructor', async ({ client, assert }) => {
    const admin = await login(client, 'carlos@correo.com')
    const suffix = Date.now()
    const programaId = await crearPrograma(client, admin, suffix)
    const instructorId = await idDelInstructor(client, admin)

    const asignados = await client
      .put(`/api/v1/users/${instructorId}/programas`)
      .bearerToken(admin)
      .json({ programaIds: [programaId] })
    asignados.assertStatus(200)

    const filas = datosDe<{ id: number; nivel: { id: number } }[]>(asignados)
    assert.deepEqual(
      filas.map((fila) => fila.id),
      [programaId]
    )
    assert.exists(filas[0].nivel)

    const listado = await client.get(`/api/v1/users/${instructorId}/programas`).bearerToken(admin)
    listado.assertStatus(200)
    assert.isTrue(datosDe<{ id: number }[]>(listado).some((fila) => fila.id === programaId))

    const usuariosDelPrograma = await client
      .get(`/api/v1/programas-formacion/${programaId}/usuarios`)
      .bearerToken(admin)
    usuariosDelPrograma.assertStatus(200)
    assert.isTrue(
      datosDe<{ id: number }[]>(usuariosDelPrograma).some((fila) => fila.id === instructorId)
    )

    // El propio instructor consulta los programas que tiene asignados
    const instructor = await login(client, 'instructor@correo.com')
    const propios = await client.get('/api/v1/account/programas').bearerToken(instructor)
    propios.assertStatus(200)
    assert.isTrue(datosDe<{ id: number }[]>(propios).some((fila) => fila.id === programaId))

    // Un arreglo vacío deja al instructor sin programas
    const vacios = await client
      .put(`/api/v1/users/${instructorId}/programas`)
      .bearerToken(admin)
      .json({ programaIds: [] })
    vacios.assertStatus(200)
    assert.lengthOf(datosDe<{ id: number }[]>(vacios), 0)

    // Un programa que no existe responde 422
    const invalido = await client
      .put(`/api/v1/users/${instructorId}/programas`)
      .bearerToken(admin)
      .json({ programaIds: [99999999] })
    invalido.assertStatus(422)
  })

  test('crear un instructor con programas en el mismo POST', async ({ client, assert }) => {
    const admin = await login(client, 'carlos@correo.com')
    const suffix = Date.now()
    const programaId = await crearPrograma(client, admin, suffix)

    const roles = await client.get('/api/v1/roles').bearerToken(admin)
    roles.assertStatus(200)
    const instructor = (roles.body().data as { id: number; name: string }[]).find(
      (role) => role.name === 'Instructor'
    )

    if (!instructor) {
      throw new Error('El perfil Instructor no está en la base de datos')
    }

    const creado = await client
      .post('/api/v1/users')
      .bearerToken(admin)
      .json({
        nombres: 'Nuevo',
        apellidos: `Instructor ${suffix}`,
        tipoDocumento: 'CC',
        numeroDocumento: `DOC-${suffix}`,
        email: `nuevo.instructor.${suffix}@correo.com`,
        password: '123456',
        passwordConfirmation: '123456',
        idPerfil: instructor.id,
        idCformacion: 1,
        programaIds: [programaId],
      })
    creado.assertStatus(200)
    const usuarioId = datosDe<{ id: number }>(creado).id

    const listado = await client.get(`/api/v1/users/${usuarioId}/programas`).bearerToken(admin)
    listado.assertStatus(200)
    assert.isTrue(datosDe<{ id: number }[]>(listado).some((fila) => fila.id === programaId))
  })

  test('rechaza programas que no ofrece el centro del instructor', async ({ client, assert }) => {
    const admin = await login(client, 'carlos@correo.com')
    const suffix = Date.now()
    const programaId = await crearPrograma(client, admin, suffix)

    const roles = await client.get('/api/v1/roles').bearerToken(admin)
    roles.assertStatus(200)
    const instructor = (roles.body().data as { id: number; name: string }[]).find(
      (role) => role.name === 'Instructor'
    )

    if (!instructor) {
      throw new Error('El perfil Instructor no está en la base de datos')
    }

    const intento = await client
      .post('/api/v1/users')
      .bearerToken(admin)
      .json({
        nombres: 'Otro',
        apellidos: `Centro ${suffix}`,
        tipoDocumento: 'CC',
        numeroDocumento: `CTR-${suffix}`,
        email: `instructor.centro.${suffix}@correo.com`,
        password: '123456',
        passwordConfirmation: '123456',
        idPerfil: instructor.id,
        idCformacion: 2,
        programaIds: [programaId],
      })
    intento.assertStatus(422)
    assert.include(
      (intento.body() as unknown as { message: string }).message,
      'no están disponibles en el centro'
    )
  })

  test('no asigna programas a un usuario que no es instructor', async ({ client }) => {
    const admin = await login(client, 'carlos@correo.com')
    const suffix = Date.now()
    const programaId = await crearPrograma(client, admin, suffix)
    const usuarioId = await idDeUsuario(client, admin, 'maria@correo.com')

    const intento = await client
      .put(`/api/v1/users/${usuarioId}/programas`)
      .bearerToken(admin)
      .json({ programaIds: [programaId] })
    intento.assertStatus(422)
  })

  test('no crea un usuario con programas si su perfil no es Instructor', async ({ client }) => {
    const admin = await login(client, 'carlos@correo.com')
    const suffix = Date.now()
    const programaId = await crearPrograma(client, admin, suffix)

    const roles = await client.get('/api/v1/roles').bearerToken(admin)
    roles.assertStatus(200)
    const funcionario = (roles.body().data as { id: number; name: string }[]).find(
      (role) => role.name === 'Funcionario'
    )

    if (!funcionario) {
      throw new Error('El perfil Funcionario no está en la base de datos')
    }

    const intento = await client
      .post('/api/v1/users')
      .bearerToken(admin)
      .json({
        nombres: 'Sin',
        apellidos: `Programas ${suffix}`,
        tipoDocumento: 'CC',
        numeroDocumento: `FUN-${suffix}`,
        email: `funcionario.${suffix}@correo.com`,
        password: '123456',
        passwordConfirmation: '123456',
        idPerfil: funcionario.id,
        idCformacion: 1,
        programaIds: [programaId],
      })
    intento.assertStatus(422)
  })

  test('un usuario no admin no puede asignar programas', async ({ client }) => {
    const admin = await login(client, 'carlos@correo.com')
    const bodegaUser = await login(client, 'adminbodega@correo.com')
    const instructorId = await idDelInstructor(client, admin)
    const suffix = Date.now()
    const programaId = await crearPrograma(client, admin, suffix)

    const intento = await client
      .put(`/api/v1/users/${instructorId}/programas`)
      .bearerToken(bodegaUser)
      .json({ programaIds: [] })
    intento.assertStatus(403)

    const usuariosDelPrograma = await client
      .get(`/api/v1/programas-formacion/${programaId}/usuarios`)
      .bearerToken(bodegaUser)
    usuariosDelPrograma.assertStatus(403)
  })
})
