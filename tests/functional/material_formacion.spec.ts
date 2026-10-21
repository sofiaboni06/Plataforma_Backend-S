import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import db from '@adonisjs/lucid/services/db'

async function login(client: ApiClient, email = 'carlos@correo.com') {
  const response = await client.post('/api/v1/auth/login').json({ email, password: '123456' })
  response.assertStatus(200)
  return data<{ token: string }>(response).token
}

/** Lee `body.data` sin depender del tipo que genere el registro de rutas. */
function data<T>(response: { body: () => unknown }): T {
  return (response.body() as { data: T }).data
}

/**
 * `knexRawQuery` devuelve el Result de pg (`{ rows }`), no el arreglo. Esta
 * normalización admite ambos formatos.
 */
function filas<T>(resultado: unknown): T[] {
  if (Array.isArray(resultado)) return resultado as T[]
  const rows = (resultado as { rows?: unknown }).rows
  return Array.isArray(rows) ? (rows as T[]) : []
}

/**
 * El catálogo de programas es de plataforma: si el dump no trae ninguno activo
 * se arma uno dentro de la transacción de la prueba (todo entra en el
 * rollback del grupo). Se usa SQL crudo porque crear programas todavía no
 * tiene endpoint propio.
 */
async function programaActivo(): Promise<number> {
  const existente = await db
    .from('programa_formacion')
    .where('estado_programa', true)
    .select('id_programa_formacion')
    .orderBy('id_programa_formacion')
    .first()

  if (existente) return existente.id_programa_formacion

  return crearProgramaDePrueba(Date.now(), true)
}

async function programaInactivo(): Promise<number> {
  return crearProgramaDePrueba(Date.now() + 1, false)
}

async function crearProgramaDePrueba(suffix: number, activo: boolean): Promise<number> {
  const niveles = filas<{ id_nivel_programa: number }>(
    await db.knexRawQuery(
      'select id_nivel_programa from nivel_programa order by id_nivel_programa limit 1'
    )
  )
  if (!niveles.length) throw new Error('El dump no trae niveles de programa')

  const [red] = filas<{ id_red_conocimiento: number }>(
    await db.knexRawQuery(
      'insert into redes_conocimiento (red_conocimiento, estado, created_at, updated_at) ' +
        'values (?, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) returning id_red_conocimiento',
      [`QA-RED-MAT-${suffix}`]
    )
  )

  const [linea] = filas<{ id_linea_tematica: number }>(
    await db.knexRawQuery(
      'insert into lineas_tematicas (linea_tematica, estado, created_at, updated_at) ' +
        'values (?, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) returning id_linea_tematica',
      [`QA-LINEA-MAT-${suffix}`]
    )
  )

  await db.knexRawQuery(
    'insert into redes_conocimiento_lineas_tematicas ' +
      '(red_conocimiento_id, linea_tematica_id, created_at, updated_at) ' +
      'values (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
    [red.id_red_conocimiento, linea.id_linea_tematica]
  )

  const [programa] = filas<{ id_programa_formacion: number }>(
    await db.knexRawQuery(
      'insert into programa_formacion ' +
        '(id_red_conocimiento, id_linea_tematica, id_nivel_programa, codigo_programa, ' +
        'nombre_programa, version, estado_programa) values (?, ?, ?, ?, ?, ?, ?) ' +
        'returning id_programa_formacion',
      [
        red.id_red_conocimiento,
        linea.id_linea_tematica,
        niveles[0].id_nivel_programa,
        activo ? `QA-MAT-${suffix}` : `QA-MATI-${suffix}`,
        activo
          ? `QA Programa para materiales ${suffix}`
          : `QA Programa inactivo para materiales ${suffix}`,
        activo ? `1.${suffix}` : `9.${suffix}`,
        activo,
      ]
    )
  )

  return programa.id_programa_formacion
}

/** Elemento propio de la prueba: cadena completa item → stand (patrón de items.spec). */
async function crearElemento(client: ApiClient, token: string, suffix: number) {
  const categoriaRes = await client
    .post('/api/v1/categorias')
    .bearerToken(token)
    .json({ nombre: `MatForm ${suffix}`, estado: true })
  categoriaRes.assertStatus(200)
  const categoria = data<{ id: number }>(categoriaRes)

  const subcategoriaRes = await client
    .post('/api/v1/subcategorias')
    .bearerToken(token)
    .json({ idCategoria: categoria.id, nombre: `MatForm ${suffix}`, estado: true })
  subcategoriaRes.assertStatus(200)
  const subcategoria = data<{ id: number }>(subcategoriaRes)

  const itemRes = await client
    .post('/api/v1/inventario/items')
    .bearerToken(token)
    .json({
      nombre: `Guantes de taller para formación ${suffix}`,
      descripcion: 'Elemento de prueba del CRUD de materiales de formación',
      idSubcategoria: subcategoria.id,
    })
  itemRes.assertStatus(200)
  const item = data<{ id: number }>(itemRes)

  const bodegas = await client.get('/api/v1/bodegas').bearerToken(token)
  bodegas.assertStatus(200)
  const bodega = data<{ id: number }[]>(bodegas)[0]
  if (!bodega) throw new Error('El usuario de prueba no tiene bodegas')

  const subBodegaRes = await client
    .post(`/api/v1/bodegas/${bodega.id}/sub-bodegas`)
    .bearerToken(token)
    .json({ nombre: `MatForm ${suffix}` })
  subBodegaRes.assertStatus(200)
  const subBodega = data<{ id: number }>(subBodegaRes)

  const standRes = await client
    .post(`/api/v1/bodegas/sub-bodegas/${subBodega.id}/stands`)
    .bearerToken(token)
    .json({ nombre: `MatForm ${suffix}` })
  standRes.assertStatus(200)
  const stand = data<{ id: number }>(standRes)

  const unidades = await client.get('/api/v1/unidades-medida').bearerToken(token)
  unidades.assertStatus(200)
  const unidad = data<{ id: number }[]>(unidades)[0]
  if (!unidad) throw new Error('El dump no trae unidades de medida')

  const clasificaciones = await client.get('/api/v1/clasificaciones-elemento').bearerToken(token)
  clasificaciones.assertStatus(200)
  const consumo = data<{ id: number; nombre: string }[]>(clasificaciones).find(
    (row) => row.nombre === 'MATERIAL DE CONSUMO'
  )
  if (!consumo) throw new Error('El dump no trae la clasificación MATERIAL DE CONSUMO')

  const elementoRes = await client
    .post('/api/v1/inventario/elementos')
    .bearerToken(token)
    .json({
      idItem: item.id,
      nombre: `Guantes de taller para formación ${suffix}`,
      idStand: stand.id,
      cantidad: 12,
      estado: true,
      idUnidadMedida: unidad.id,
      codigo: `MAT-FORM-${suffix}`,
      idClasificacion: consumo.id,
      caracter: 'consumo',
    })
  elementoRes.assertStatus(200)

  return data<{ id: number; nombre: string }>(elementoRes)
}

type MaterialFila = {
  id: number
  idPrograma: number
  idElemento: number
  cantidadBase: number
  observaciones: string | null
  estado: boolean
  programa: { id: number; codigo: string; nombre: string } | null
  elemento: { id: number; nombre: string; unidadMedida: { id: number } | null } | null
}

test.group('Materiales de formación', () => {
  test('lista, crea, edita, reactiva y deshabilita un material', async ({ client, assert }) => {
    const token = await login(client)
    const suffix = Date.now()

    const idPrograma = await programaActivo()

    const programasRes = await client
      .get('/api/v1/materiales-formacion/programas')
      .bearerToken(token)
    programasRes.assertStatus(200)
    const programas = data<{ id: number; codigo: string; nombre: string }[]>(programasRes)
    assert.isArray(programas)
    assert.isTrue(
      programas.some((programa) => programa.id === idPrograma),
      'el programa de la prueba debe salir en las opciones'
    )

    const listado = await client.get('/api/v1/materiales-formacion').bearerToken(token)
    listado.assertStatus(200)
    const filasIniciales = data<MaterialFila[]>(listado)
    assert.isArray(filasIniciales)

    const elemento = await crearElemento(client, token, suffix)

    const creado = await client.post('/api/v1/materiales-formacion').bearerToken(token).json({
      idPrograma,
      idElemento: elemento.id,
      cantidadBase: 5,
      observaciones: 'Kit de taller por cohorte',
    })
    creado.assertStatus(200)
    const material = data<MaterialFila>(creado)
    assert.equal(material.idPrograma, idPrograma)
    assert.equal(material.idElemento, elemento.id)
    assert.equal(material.cantidadBase, 5)
    assert.equal(material.observaciones, 'Kit de taller por cohorte')
    assert.isTrue(material.estado)
    assert.equal(material.programa?.id, idPrograma)
    assert.equal(material.elemento?.id, elemento.id)
    assert.equal(material.elemento?.nombre, elemento.nombre)
    assert.exists(material.elemento?.unidadMedida)

    // Persistido: aparece en el listado y en el detalle.
    const despuesDeCrear = await client.get('/api/v1/materiales-formacion').bearerToken(token)
    despuesDeCrear.assertStatus(200)
    const filasDespues = data<MaterialFila[]>(despuesDeCrear)
    assert.equal(filasDespues.length, filasIniciales.length + 1)
    assert.isTrue(filasDespues.some((fila) => fila.id === material.id))

    const detalle = await client
      .get(`/api/v1/materiales-formacion/${material.id}`)
      .bearerToken(token)
    detalle.assertStatus(200)
    assert.equal(data<MaterialFila>(detalle).id, material.id)

    // Filtro por programa.
    const porPrograma = await client
      .get(`/api/v1/materiales-formacion?idPrograma=${idPrograma}`)
      .bearerToken(token)
    porPrograma.assertStatus(200)
    assert.isTrue(data<MaterialFila[]>(porPrograma).every((fila) => fila.idPrograma === idPrograma))

    // Opciones globales del selector de elementos: identificación, sin stock.
    const opcionesElementos = await client
      .get('/api/v1/materiales-formacion/elementos')
      .bearerToken(token)
    opcionesElementos.assertStatus(200)
    const opciones = data<{ id: number; nombre: string; estado: boolean }[]>(opcionesElementos)
    const opcionCreada = opciones.find((opcion) => opcion.id === elemento.id)
    assert.exists(opcionCreada)
    assert.equal(opcionCreada!.nombre, elemento.nombre)
    assert.notProperty(opcionCreada as object, 'cantidad')

    const editado = await client
      .patch(`/api/v1/materiales-formacion/${material.id}`)
      .bearerToken(token)
      .json({ cantidadBase: 8, observaciones: 'Ajuste de taller 2026' })
    editado.assertStatus(200)
    const materialEditado = data<MaterialFila>(editado)
    assert.equal(materialEditado.cantidadBase, 8)
    assert.equal(materialEditado.observaciones, 'Ajuste de taller 2026')
    assert.isTrue(materialEditado.estado)
    assert.equal(materialEditado.idElemento, elemento.id)

    const borrado = await client
      .delete(`/api/v1/materiales-formacion/${material.id}`)
      .bearerToken(token)
    borrado.assertStatus(200)

    const inactivos = await client
      .get('/api/v1/materiales-formacion?estado=false')
      .bearerToken(token)
    inactivos.assertStatus(200)
    const filaInactiva = data<MaterialFila[]>(inactivos).find((fila) => fila.id === material.id)
    assert.exists(filaInactiva)
    assert.isFalse(filaInactiva!.estado)

    // El borrado es lógico: la fila sigue existiendo físicamente en la tabla.
    const persistida = await db
      .from('lista_maestra_material')
      .where('id_lista_maestra', material.id)
      .first()
    assert.exists(persistida, 'la fila no debe borrarse físicamente')
    assert.isFalse(persistida!.estado)

    // Se puede reactivar y volver a deshabilitar.
    const reactivado = await client
      .patch(`/api/v1/materiales-formacion/${material.id}`)
      .bearerToken(token)
      .json({ estado: true })
    reactivado.assertStatus(200)
    assert.isTrue(data<MaterialFila>(reactivado).estado)

    const borrado2 = await client
      .delete(`/api/v1/materiales-formacion/${material.id}`)
      .bearerToken(token)
    borrado2.assertStatus(200)
  })

  test('valida duplicados, inactivos, cantidades e ids inexistentes', async ({
    client,
    assert,
  }) => {
    const token = await login(client)
    const suffix = Date.now() + 1

    const idPrograma = await programaActivo()
    const elemento = await crearElemento(client, token, suffix)

    const sinPrograma = await client
      .post('/api/v1/materiales-formacion')
      .bearerToken(token)
      .json({ idElemento: elemento.id, cantidadBase: 3 })
    sinPrograma.assertStatus(422)

    const cantidadCero = await client
      .post('/api/v1/materiales-formacion')
      .bearerToken(token)
      .json({ idPrograma, idElemento: elemento.id, cantidadBase: 0 })
    cantidadCero.assertStatus(422)

    const creado = await client
      .post('/api/v1/materiales-formacion')
      .bearerToken(token)
      .json({ idPrograma, idElemento: elemento.id, cantidadBase: 3 })
    creado.assertStatus(200)
    const material = data<MaterialFila>(creado)

    // La pareja programa+elemento no se repite.
    const duplicado = await client
      .post('/api/v1/materiales-formacion')
      .bearerToken(token)
      .json({ idPrograma, idElemento: elemento.id, cantidadBase: 4 })
    duplicado.assertStatus(409)

    // Programa dado de baja: no admite materiales.
    const idInactivo = await programaInactivo()
    const programaInactivoRes = await client
      .post('/api/v1/materiales-formacion')
      .bearerToken(token)
      .json({ idPrograma: idInactivo, idElemento: elemento.id, cantidadBase: 4 })
    programaInactivoRes.assertStatus(422)

    // Elemento dado de baja: no puede sumarse a un programa.
    const bajaElemento = await client
      .patch(`/api/v1/inventario/elementos/${elemento.id}`)
      .bearerToken(token)
      .json({ estado: false })
    bajaElemento.assertStatus(200)
    const otroPrograma = await programaActivo()
    const elementoInactivo = await client
      .post('/api/v1/materiales-formacion')
      .bearerToken(token)
      .json({ idPrograma: otroPrograma, idElemento: elemento.id, cantidadBase: 4 })
    elementoInactivo.assertStatus(422)

    const inexistente = await client.get('/api/v1/materiales-formacion/99999999').bearerToken(token)
    inexistente.assertStatus(404)

    const editarInexistente = await client
      .patch('/api/v1/materiales-formacion/99999999')
      .bearerToken(token)
      .json({ cantidadBase: 10 })
    editarInexistente.assertStatus(404)

    // El material creado sigue intacto y se deshabilita una sola vez.
    const detalle = await client
      .get(`/api/v1/materiales-formacion/${material.id}`)
      .bearerToken(token)
    detalle.assertStatus(200)
    assert.isTrue(data<MaterialFila>(detalle).estado)

    const borrado = await client
      .delete(`/api/v1/materiales-formacion/${material.id}`)
      .bearerToken(token)
    borrado.assertStatus(200)

    const borradoOtraVez = await client
      .delete(`/api/v1/materiales-formacion/${material.id}`)
      .bearerToken(token)
    borradoOtraVez.assertStatus(409)
  })

  test('exige el permiso material_formacion.ver para el listado', async ({ client }) => {
    const token = await login(client, 'maria@correo.com')

    const listado = await client.get('/api/v1/materiales-formacion').bearerToken(token)
    listado.assertStatus(403)
  })

  test('el instructor consulta y crea, pero no edita ni elimina', async ({
    client,
    assert,
  }) => {
    const token = await login(client, 'instructor@correo.com')

    // Con material_formacion.ver: lectura completa.
    const listado = await client.get('/api/v1/materiales-formacion').bearerToken(token)
    listado.assertStatus(200)
    const filas = data<MaterialFila[]>(listado)
    assert.isArray(filas)

    if (filas.length) {
      const detalle = await client
        .get(`/api/v1/materiales-formacion/${filas[0].id}`)
        .bearerToken(token)
      detalle.assertStatus(200)
      assert.equal(data<MaterialFila>(detalle).id, filas[0].id)
    }

    const programas = await client
      .get('/api/v1/materiales-formacion/programas')
      .bearerToken(token)
    programas.assertStatus(200)

    const elementos = await client
      .get('/api/v1/materiales-formacion/elementos')
      .bearerToken(token)
    elementos.assertStatus(200)

    // Con material_formacion.crear concedido, el POST supera el permiso y
    // llega a la validación de recursos: ids inexistentes responden 422.
    const crear = await client.post('/api/v1/materiales-formacion').bearerToken(token).json({
      idPrograma: 99999999,
      idElemento: 99999999,
      cantidadBase: 1,
    })
    crear.assertStatus(422)

    const editar = await client
      .patch('/api/v1/materiales-formacion/1')
      .bearerToken(token)
      .json({ cantidadBase: 9 })
    editar.assertStatus(403)

    const eliminar = await client.delete('/api/v1/materiales-formacion/1').bearerToken(token)
    eliminar.assertStatus(403)
  })

  test('sin token las operaciones protegidas no se ejecutan', async ({ client }) => {
    const listado = await client.get('/api/v1/materiales-formacion')
    listado.assertStatus(401)

    const detalle = await client.get('/api/v1/materiales-formacion/1')
    detalle.assertStatus(401)

    const crear = await client
      .post('/api/v1/materiales-formacion')
      .json({ idPrograma: 1, idElemento: 1, cantidadBase: 1 })
    crear.assertStatus(401)

    const editar = await client
      .patch('/api/v1/materiales-formacion/1')
      .json({ cantidadBase: 9 })
    editar.assertStatus(401)

    const eliminar = await client.delete('/api/v1/materiales-formacion/1')
    eliminar.assertStatus(401)
  })
})

type SolicitudFila = {
  id: number
  idMaterial: number
  idPrograma: number | null
  idElemento: number | null
  cantidadSolicitada: number
  observaciones: string | null
  estado: string
  solicitante: string | null
  programa: { id: number; nombre: string } | null
  elemento: { id: number; nombre: string; marca: string | null } | null
}

/** Material de formación propio de la prueba (programa + elemento + fila). */
async function crearMaterialDePrueba(client: ApiClient, token: string, suffix: number) {
  const idPrograma = await programaActivo()
  const elemento = await crearElemento(client, token, suffix)

  const materialRes = await client.post('/api/v1/materiales-formacion').bearerToken(token).json({
    idPrograma,
    idElemento: elemento.id,
    cantidadBase: 6,
    observaciones: 'Material para la prueba de solicitudes',
  })
  materialRes.assertStatus(200)

  return { material: data<MaterialFila>(materialRes), idPrograma, elemento }
}

test.group('Solicitudes de materiales de formación', () => {
  test('el instructor solicita un material y la solicitud persiste', async ({ client, assert }) => {
    const token = await login(client)
    const instructorToken = await login(client, 'instructor@correo.com')
    const suffix = Date.now()

    const { material, idPrograma, elemento } = await crearMaterialDePrueba(client, token, suffix)

    const creada = await client
      .post('/api/v1/materiales-formacion/solicitudes')
      .bearerToken(instructorToken)
      .json({ idMaterial: material.id, cantidadSolicitada: 3, observaciones: 'Taller del viernes' })
    creada.assertStatus(200)
    const solicitud = data<SolicitudFila>(creada)
    assert.equal(solicitud.idMaterial, material.id)
    assert.equal(solicitud.idPrograma, idPrograma)
    assert.equal(solicitud.idElemento, elemento.id)
    assert.equal(solicitud.cantidadSolicitada, 3)
    assert.equal(solicitud.observaciones, 'Taller del viernes')
    assert.equal(solicitud.estado, 'pendiente')
    assert.exists(solicitud.solicitante)
    assert.equal(solicitud.programa?.id, idPrograma)
    assert.equal(solicitud.elemento?.id, elemento.id)

    // Persiste de verdad en la base de datos, en su propia tabla.
    const persistida = await db
      .from('solicitud_material_formacion')
      .where('id_solicitud_formacion', solicitud.id)
      .first()
    assert.exists(persistida, 'la solicitud debe quedar guardada en base de datos')
    assert.equal(persistida!.id_lista_maestra, material.id)
    assert.equal(Number(persistida!.cantidad_solicitada), 3)
    assert.equal(persistida!.estado, 'pendiente')

    // Se puede consultar después: listado general, por programa y por estado.
    const listado = await client
      .get('/api/v1/materiales-formacion/solicitudes')
      .bearerToken(token)
    listado.assertStatus(200)
    const solicitudes = data<SolicitudFila[]>(listado)
    assert.isArray(solicitudes)
    assert.isTrue(solicitudes.some((fila) => fila.id === solicitud.id))

    const porPrograma = await client
      .get(`/api/v1/materiales-formacion/solicitudes?idPrograma=${idPrograma}`)
      .bearerToken(token)
    porPrograma.assertStatus(200)
    assert.isTrue(data<SolicitudFila[]>(porPrograma).every((fila) => fila.idPrograma === idPrograma))

    const porEstado = await client
      .get('/api/v1/materiales-formacion/solicitudes?estado=pendiente')
      .bearerToken(token)
    porEstado.assertStatus(200)
    assert.isTrue(data<SolicitudFila[]>(porEstado).every((fila) => fila.estado === 'pendiente'))

    // El instructor también consulta sus solicitudes.
    const delInstructor = await client
      .get('/api/v1/materiales-formacion/solicitudes')
      .bearerToken(instructorToken)
    delInstructor.assertStatus(200)

    // La baja lógica del material no destruye la solicitud (FK RESTRICT).
    const borrado = await client
      .delete(`/api/v1/materiales-formacion/${material.id}`)
      .bearerToken(token)
    borrado.assertStatus(200)
    const trasBaja = await db
      .from('solicitud_material_formacion')
      .where('id_solicitud_formacion', solicitud.id)
      .first()
    assert.exists(trasBaja, 'la solicitud debe conservarse tras la baja lógica del material')
  })

  test('valida material inexistente o inactivo, la cantidad y los permisos', async ({
    client,
    assert,
  }) => {
    const token = await login(client)
    const suffix = Date.now() + 1

    const sinMaterial = await client
      .post('/api/v1/materiales-formacion/solicitudes')
      .bearerToken(token)
      .json({ cantidadSolicitada: 2 })
    sinMaterial.assertStatus(422)

    const inexistente = await client
      .post('/api/v1/materiales-formacion/solicitudes')
      .bearerToken(token)
      .json({ idMaterial: 99999999, cantidadSolicitada: 2 })
    inexistente.assertStatus(422)

    const cantidadCero = await client
      .post('/api/v1/materiales-formacion/solicitudes')
      .bearerToken(token)
      .json({ idMaterial: 1, cantidadSolicitada: 0 })
    cantidadCero.assertStatus(422)

    // Material inhabilitado: no admite solicitudes nuevas.
    const { material } = await crearMaterialDePrueba(client, token, suffix)
    const inhabilitado = await client
      .delete(`/api/v1/materiales-formacion/${material.id}`)
      .bearerToken(token)
    inhabilitado.assertStatus(200)

    const sobreInactivo = await client
      .post('/api/v1/materiales-formacion/solicitudes')
      .bearerToken(token)
      .json({ idMaterial: material.id, cantidadSolicitada: 2 })
    sobreInactivo.assertStatus(422)

    // Permisos: quien no tiene material_formacion.* no ve ni crea solicitudes.
    const sinPermisos = await login(client, 'maria@correo.com')
    const listadoSinPermiso = await client
      .get('/api/v1/materiales-formacion/solicitudes')
      .bearerToken(sinPermisos)
    listadoSinPermiso.assertStatus(403)

    const crearSinPermiso = await client
      .post('/api/v1/materiales-formacion/solicitudes')
      .bearerToken(sinPermisos)
      .json({ idMaterial: material.id, cantidadSolicitada: 2 })
    crearSinPermiso.assertStatus(403)

    const sinToken = await client
      .get('/api/v1/materiales-formacion/solicitudes')
    sinToken.assertStatus(401)

    const crearSinToken = await client
      .post('/api/v1/materiales-formacion/solicitudes')
      .json({ idMaterial: material.id, cantidadSolicitada: 2 })
    crearSinToken.assertStatus(401)

    // Nada quedó guardado en la tabla de solicitudes de la prueba.
    const filas = await db
      .from('solicitud_material_formacion')
      .where('id_lista_maestra', material.id)
    assert.equal(filas.length, 0)
  })
})
