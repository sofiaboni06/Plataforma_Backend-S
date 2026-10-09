import { Exception } from '@adonisjs/core/exceptions'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { DateTime } from 'luxon'
import { fechaValida, hoy, noAntesDe, type FechaDia } from '#services/plazo'
import Elemento from '#models/elemento'
import Entrega from '#models/entrega'
import Obra from '#models/obra'
import SolicitudEquipo from '#models/solicitud_equipo'
import SolicitudMaterial from '#models/solicitud_material'
import User from '#models/usuario'
import {
  assertCan,
  assertOwnedByCenter,
  assertStandInScope,
  can,
  forbidden,
  resolveScope,
  standIdsQuery,
  type AccessScope,
} from '#services/access_control'
import DisponibilidadService from '#services/disponibilidad_service'
import EntregaService, { type FilaEntrega } from '#services/entrega_service'
import NotificacionService from '#services/notificacion_service'
import SolicitudEquipoService from '#services/solicitud_equipo_service'
import SolicitudMaterialService from '#services/solicitud_material_service'

export type TipoSolicitud = 'consumo' | 'devolutivo'

type CrearSolicitud = {
  codigoSolicitud: string
  idObra: number
  tipo: TipoSolicitud
  ficha?: string
  observacion?: string
  /** Solo equipo: inicio del préstamo. En consumo se ignora. */
  fechaInicio?: FechaDia
  /** Solo equipo: hasta cuándo lo pide el instructor. En consumo se ignora. */
  fechaDevolucionPropuesta?: FechaDia
  elementos: { idElemento: number; cantidad: number; observacion?: string }[]
}

type RegistrarEnBodega = CrearSolicitud & { numeroDocumento: string }

type FilaCreada = FilaEntrega & { elemento: Elemento; idStand: number }

const ESTADOS = ['pendiente', 'parcial', 'entregado', 'cerrado'] as const

const PRESTAMOS = ['afuera', 'vencidos', 'devueltos', 'todos'] as const

export type EstadoFactura = (typeof ESTADOS)[number]

/**
 * La factura no es una tabla: son las filas de solicitud_material y
 * solicitud_equipo que comparten el código dentro del centro.
 */
export type Factura = {
  codigoSolicitud: string
  estado: EstadoFactura
  materiales: SolicitudMaterial[]
  equipos: SolicitudEquipo[]
}

export type Solicitante = {
  usuario: User
  puedeConsumo: boolean
  puedeDevolutivo: boolean
}

function fail(message: string, status: number, code: string): never {
  throw new Exception(message, { status, code })
}

function estadoFiltro(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return undefined
  }

  if (typeof value === 'string' && ESTADOS.includes(value as EstadoFactura)) {
    return value as EstadoFactura
  }

  fail('El estado indicado no es válido', 422, 'E_VALIDATION_ERROR')
}

/**
 * pendiente: nada entregado. parcial: falta algo por entregar. entregado: no
 * queda nada por entregar pero hay equipo afuera. cerrado: todo entregado y
 * todo el equipo devuelto.
 */
function estadoDe(materiales: SolicitudMaterial[], equipos: SolicitudEquipo[]): EstadoFactura {
  const filas = [...materiales, ...equipos]

  if (filas.every((row) => row.cantidadEntregada <= 0)) {
    return 'pendiente'
  }

  if (filas.some((row) => row.cantidadEntregada < row.cantidad)) {
    return 'parcial'
  }

  return equipos.some((row) => row.cantidadDevuelta < row.cantidadEntregada)
    ? 'entregado'
    : 'cerrado'
}

export default class SolicitudService {
  private disponibilidad = new DisponibilidadService()
  private entregas = new EntregaService()
  private notificaciones = new NotificacionService()
  private material = new SolicitudMaterialService()
  private equipo = new SolicitudEquipoService()

  /**
   * Una solicitud es de un solo tipo: o todo consumo (solicitud_material) o
   * todo devolutivo (solicitud_equipo). Todo entra o nada entra: si una fila
   * falla, no queda ninguna. Puede pedir más de lo que hay: bodega entrega lo
   * que tenga y el resto queda pendiente.
   */
  async create(scope: AccessScope, payload: CrearSolicitud) {
    assertCan(
      scope,
      payload.tipo === 'consumo' ? 'solicitud_material.crear' : 'solicitud_equipo.crear'
    )
    this.validarFechas(payload)

    const trx = await db.transaction()
    let avisos: Awaited<ReturnType<NotificacionService['pedidoVarios']>> = []

    try {
      const { obra, filas } = await this.crearFilas(trx, scope, payload, {
        idSolicitante: scope.idUsuario,
        idRegistra: null,
      })

      avisos = await this.notificaciones.pedidoVarios(trx, {
        codigoSolicitud: payload.codigoSolicitud,
        idSolicitante: scope.idUsuario,
        obra: obra.nombre,
        lineas: filas.map((fila) => ({
          tipo: fila.tipo,
          idSolicitud: fila.row.id,
          idElemento: fila.elemento.id,
          cantidad: fila.row.cantidad,
          elemento: fila.elemento.nombre,
        })),
      })
      await trx.commit()
    } catch (error) {
      await trx.rollback()
      throw error
    }

    this.notificaciones.emitir(avisos)
    return this.show(scope, payload.codigoSolicitud)
  }

  /**
   * El instructor llega al mostrador sin poder usar la app. Bodega busca su
   * documento, registra la solicitud a su nombre y le entrega en el mismo paso
   * lo que haya en el estante. Lo que falte queda pendiente para después.
   */
  async registrarEnBodega(scope: AccessScope, payload: RegistrarEnBodega) {
    const consumo = payload.tipo === 'consumo'

    assertCan(scope, consumo ? 'solicitud_material.entregar' : 'solicitud_equipo.entregar')
    this.validarFechas(payload)

    const { usuario, puedeConsumo, puedeDevolutivo } = await this.solicitante(
      scope,
      payload.numeroDocumento
    )

    if (usuario.id === scope.idUsuario) {
      fail('No puedes registrarte una solicitud a tu nombre', 422, 'E_SOLICITANTE_INVALIDO')
    }

    if (!usuario.estado) {
      fail(`${usuario.fullName} tiene la cuenta inactiva`, 422, 'E_USUARIO_INACTIVO')
    }

    if (consumo ? !puedeConsumo : !puedeDevolutivo) {
      fail(
        `${usuario.fullName} no tiene permiso para hacer solicitudes ${consumo ? 'de consumo' : 'de devolutivos'}`,
        422,
        'E_SOLICITANTE_INVALIDO'
      )
    }

    const trx = await db.transaction()
    let avisos: Awaited<ReturnType<NotificacionService['registroEnBodega']>> = []

    try {
      const { obra, filas } = await this.crearFilas(trx, scope, payload, {
        idSolicitante: usuario.id,
        idRegistra: scope.idUsuario,
      })
      const lineas: Parameters<NotificacionService['registroEnBodega']>[1]['lineas'] = []

      for (const fila of filas) {
        await assertStandInScope(scope, fila.idStand)

        const resultado = await this.entregas.entregar(trx, scope, fila, fila.elemento, {
          exigirExistencia: false,
        })

        lineas.push({
          idSolicitud: fila.row.id,
          elemento: fila.elemento.nombre,
          ...resultado,
        })

        if (resultado.entregada > 0) {
          avisos.push(...(await this.notificaciones.aplicarStock(fila.elemento, true, trx)))
        }
      }

      avisos.push(
        ...(await this.notificaciones.registroEnBodega(trx, {
          codigoSolicitud: payload.codigoSolicitud,
          tipo: consumo ? 'material' : 'equipo',
          idDestinatario: usuario.id,
          idQuienRegistra: scope.idUsuario,
          obra: obra.nombre,
          lineas,
        }))
      )
      await trx.commit()
    } catch (error) {
      await trx.rollback()
      throw error
    }

    this.notificaciones.emitir(avisos)
    return this.show(scope, payload.codigoSolicitud)
  }

  /**
   * Bodega busca por documento a quien tiene enfrente. Solo personas de su
   * centro; si no existe ahí, responde como si no existiera.
   */
  async solicitante(scope: AccessScope, numeroDocumento: string): Promise<Solicitante> {
    if (!can(scope, 'solicitud_material.entregar') && !can(scope, 'solicitud_equipo.entregar')) {
      throw forbidden('No tienes permiso para realizar esta acción')
    }

    const usuario = await User.query()
      .where('numero_documento', numeroDocumento.trim())
      .where('id_cformacion', scope.idCformacion)
      .first()

    if (!usuario) {
      fail('No hay nadie con ese documento en tu centro de formación', 404, 'E_NOT_FOUND')
    }

    const permisos = await resolveScope(usuario)

    return {
      usuario,
      puedeConsumo: can(permisos, 'solicitud_material.crear'),
      puedeDevolutivo: can(permisos, 'solicitud_equipo.crear'),
    }
  }

  async index(scope: AccessScope, estado?: unknown) {
    const filtro = estadoFiltro(estado)
    const facturas = await this.facturas(scope)

    return filtro ? facturas.filter((row) => row.estado === filtro) : facturas
  }

  /**
   * "Entregar todo lo disponible" de una solicitud: bodega saca, fila por fila,
   * lo que haya en el estante de lo que falta. Las filas sin existencia quedan
   * como estaban; si ninguna tiene, no se entrega nada. Solo cuenta lo que esa
   * persona atiende (sus stands). El instructor recibe un solo aviso.
   */
  async entregarTodo(
    scope: AccessScope,
    codigoSolicitud: string,
    opciones: { observacion?: string; fechaDevolucionLimite?: FechaDia } = {}
  ) {
    const material = can(scope, 'solicitud_material.entregar')
    const equipo = can(scope, 'solicitud_equipo.entregar')

    if (!material && !equipo) {
      throw forbidden('No tienes permiso para realizar esta acción')
    }

    // 404 si no la ve, igual que el detalle.
    const factura = await this.show(scope, codigoSolicitud)
    const limite = this.limiteAlEntregar(factura, opciones.fechaDevolucionLimite)

    const porEntregar = (tabla: 'solicitud_material' | 'solicitud_equipo') =>
      db
        .from(tabla)
        .select(`id_${tabla}`)
        .where('codigo_solicitud', codigoSolicitud)
        .whereIn('estado', ['pendiente', 'parcial'])
        .whereIn(
          'id_obra',
          db.from('obra').select('id_obra').where('id_cformacion', scope.idCformacion)
        )
        .whereIn(
          'id_elemento',
          db.from('elemento').select('id_elemento').whereIn('id_stand', standIdsQuery(scope))
        )

    const trx = await db.transaction()
    let avisos: Awaited<ReturnType<NotificacionService['entregaVarias']>> = []

    try {
      const materiales = material
        ? await SolicitudMaterial.query({ client: trx })
            .whereIn('id_solicitud_material', porEntregar('solicitud_material'))
            .orderBy('id_solicitud_material', 'asc')
            .forUpdate()
        : []
      const equipos = equipo
        ? await SolicitudEquipo.query({ client: trx })
            .whereIn('id_solicitud_equipo', porEntregar('solicitud_equipo'))
            .orderBy('id_solicitud_equipo', 'asc')
            .forUpdate()
        : []
      const filas: FilaEntrega[] = [
        ...materiales.map((row) => ({ tipo: 'material' as const, row })),
        ...equipos.map((row) => ({ tipo: 'equipo' as const, row })),
      ]

      if (!filas.length) {
        fail('Esa solicitud no tiene nada por entregar', 422, 'E_ESTADO_INVALIDO')
      }

      const elementos = await Elemento.query({ client: trx })
        .whereIn(
          'id_elemento',
          filas.map((fila) => fila.row.idElemento)
        )
        .orderBy('id_elemento', 'asc')
        .forUpdate()
      const porId = new Map(elementos.map((row) => [row.id, row]))
      const lineas = []

      for (const fila of filas) {
        const elemento = porId.get(fila.row.idElemento)

        if (!elemento) {
          fail('El elemento indicado no existe', 404, 'E_NOT_FOUND')
        }

        const entregadaAntes = fila.row.cantidadEntregada
        const resultado = await this.entregas.entregar(trx, scope, fila, elemento, {
          observacion: opciones.observacion,
          exigirExistencia: false,
          fechaDevolucionLimite: limite,
        })

        lineas.push({ fila, elemento, entregadaAntes, ...resultado })
      }

      const entregadas = lineas.filter((row) => row.entregada > 0)

      if (!entregadas.length) {
        fail(
          'No hay existencia para entregar ninguno de los elementos pendientes',
          422,
          'E_SIN_STOCK'
        )
      }

      for (const row of entregadas) {
        avisos.push(...(await this.notificaciones.aplicarStock(row.elemento, true, trx)))
      }

      const [primera] = entregadas
      const aviso = {
        idSolicitud: primera.fila.row.id,
        codigoSolicitud,
        idDestinatario: primera.fila.row.idUsuario,
        idQuienEntrega: scope.idUsuario,
        cantidad: primera.entregada,
        pendiente: primera.pendiente,
        entregadaAntes: primera.entregadaAntes,
        elemento: primera.elemento.nombre,
      }

      // Una sola fila: el mismo aviso que si la hubiera entregado sola.
      if (entregadas.length === 1) {
        avisos.push(
          ...(primera.fila.tipo === 'material'
            ? await this.notificaciones.entregaMaterial(trx, aviso)
            : await this.notificaciones.entregaEquipo(trx, aviso))
        )
      } else {
        avisos.push(
          ...(await this.notificaciones.entregaVarias(trx, {
            codigoSolicitud,
            tipo: primera.fila.tipo,
            idDestinatario: primera.fila.row.idUsuario,
            idQuienEntrega: scope.idUsuario,
            entregadas: entregadas.map((row) => ({
              idSolicitud: row.fila.row.id,
              elemento: row.elemento.nombre,
              cantidad: row.entregada,
              entregadaAntes: row.entregadaAntes,
            })),
            pendientes: lineas
              .filter((row) => row.pendiente > 0)
              .map((row) => ({ elemento: row.elemento.nombre, pendiente: row.pendiente })),
          }))
        )
      }

      await trx.commit()
    } catch (error) {
      await trx.rollback()
      throw error
    }

    this.notificaciones.emitir(avisos)
    return this.show(scope, codigoSolicitud)
  }

  /**
   * "Entregas y devoluciones" de bodega: los pedidos de equipo que ya
   * salieron (algo o todo), con quién los tiene y cómo va el plazo.
   * `afuera` (por defecto): con algo sin devolver. `vencidos`: con plazo
   * vencido o que vence hoy. `devueltos`: todo lo entregado ya volvió.
   */
  async prestamos(scope: AccessScope, filtro?: unknown) {
    if (!can(scope, 'solicitud_equipo.entregar') && !can(scope, 'solicitud_equipo.devolver')) {
      throw forbidden('No tienes permiso para realizar esta acción')
    }

    const vista = filtro === undefined || filtro === null || filtro === '' ? 'afuera' : filtro

    if (!(PRESTAMOS as readonly unknown[]).includes(vista)) {
      fail('El filtro indicado no es válido', 422, 'E_VALIDATION_ERROR')
    }

    const dia = hoy()
    const facturas = await this.facturas(scope)
    const prestados = facturas
      .filter((row) => row.equipos.some((fila) => fila.cantidadEntregada > 0))
      .map((row) => ({ ...row, materiales: [] }))
    const afuera = (row: SolicitudEquipo) => row.cantidadEntregada - row.cantidadDevuelta

    return prestados.filter((factura) => {
      const filas = factura.equipos

      switch (vista as (typeof PRESTAMOS)[number]) {
        case 'afuera':
          return filas.some((row) => afuera(row) > 0)
        case 'vencidos':
          return filas.some(
            (row) =>
              afuera(row) > 0 &&
              row.fechaDevolucionLimite !== null &&
              row.fechaDevolucionLimite <= dia
          )
        case 'devueltos':
          return filas.every((row) => afuera(row) <= 0)
        default:
          return true
      }
    })
  }

  async show(scope: AccessScope, codigoSolicitud: string) {
    const [factura] = await this.facturas(scope, codigoSolicitud)

    if (!factura) {
      fail('La solicitud indicada no existe', 404, 'E_NOT_FOUND')
    }

    return factura
  }

  /**
   * Historial de lo que bodega ha entregado: cada fila es una salida, con
   * quién la entregó, a quién y de qué solicitud. Cada quien ve lo que ya ve
   * en las solicitudes.
   */
  async historialEntregas(
    scope: AccessScope,
    options: {
      page: number
      perPage: number
      tipo?: 'material' | 'equipo'
      numeroDocumento?: string
    }
  ) {
    const verMaterial = can(scope, 'solicitud_material.ver') && options.tipo !== 'equipo'
    const verEquipo = can(scope, 'solicitud_equipo.ver') && options.tipo !== 'material'

    if (!can(scope, 'solicitud_material.ver') && !can(scope, 'solicitud_equipo.ver')) {
      throw forbidden('No tienes permiso para realizar esta acción')
    }

    const materiales = this.material.visibles(scope).select('id_solicitud_material')
    const equipos = this.equipo.visibles(scope).select('id_solicitud_equipo')

    if (options.numeroDocumento) {
      const persona = db
        .from('usuario')
        .select('id_usuario')
        .where('numero_documento', options.numeroDocumento.trim())
      materiales.whereIn('id_usuario', persona)
      equipos.whereIn('id_usuario', persona)
    }

    return Entrega.query()
      .where((query) => {
        if (verMaterial) {
          query.orWhereIn('id_solicitud_material', materiales)
        }

        if (verEquipo) {
          query.orWhereIn('id_solicitud_equipo', equipos)
        }

        if (!verMaterial && !verEquipo) {
          query.whereRaw('false')
        }
      })
      .preload('usuario')
      .preload('solicitudMaterial', (query) =>
        query.preload('elemento').preload('obra').preload('usuario')
      )
      .preload('solicitudEquipo', (query) =>
        query.preload('elemento').preload('obra').preload('usuario')
      )
      .orderBy('fecha', 'desc')
      .orderBy('id_entrega', 'desc')
      .paginate(options.page, options.perPage)
  }

  /**
   * Valida la obra y cada elemento, aparta el código y crea las filas en
   * `pendiente`. Devuelve los elementos ya bloqueados para entregar en la
   * misma transacción.
   */
  private async crearFilas(
    trx: TransactionClientContract,
    scope: AccessScope,
    payload: CrearSolicitud,
    personas: { idSolicitante: number; idRegistra: number | null }
  ) {
    const consumo = payload.tipo === 'consumo'
    const obra = await Obra.query({ client: trx }).where('id_obra', payload.idObra).first()

    if (!obra) {
      fail('La obra indicada no existe', 404, 'E_NOT_FOUND')
    }

    assertOwnedByCenter(scope, obra.idCformacion, 'La obra no pertenece a tu centro de formación')

    if (!obra.estado) {
      fail('La obra indicada no está activa', 422, 'E_OBRA_INACTIVA')
    }

    await this.reservarCodigo(trx, obra.idCformacion, payload.codigoSolicitud)

    const ids = payload.elementos.map((row) => row.idElemento)
    const elementos = await Elemento.query({ client: trx })
      .whereIn('id_elemento', ids)
      .preload('clasificacion')
      .orderBy('id_elemento', 'asc')
      .forUpdate()
    const porId = new Map(elementos.map((row) => [row.id, row]))
    const lugares = await this.disponibilidad.ubicaciones(ids, trx)
    const fecha = DateTime.now()
    const filas: FilaCreada[] = []

    for (const [index, fila] of payload.elementos.entries()) {
      const elemento = porId.get(fila.idElemento)
      const lugar = lugares.get(fila.idElemento)

      if (!elemento || !lugar) {
        fail(`El elemento de la fila ${index + 1} no existe`, 404, 'E_NOT_FOUND')
      }

      // El tipo es del elemento; si no lo tiene, el de su clasificación.
      const caracter = elemento.caracterEfectivo()

      if (caracter !== 'consumo' && caracter !== 'devolutivo') {
        fail(
          `${elemento.nombre}: no tiene tipo (consumo o devolutivo); bodega debe asignarlo`,
          422,
          'E_CARACTER_INVALIDO'
        )
      }

      if (caracter !== payload.tipo) {
        fail(
          `${elemento.nombre} es ${caracter === 'consumo' ? 'de consumo' : 'devolutivo'} y esta solicitud es ${consumo ? 'de consumo' : 'de devolutivos'}`,
          422,
          'E_TIPO_DISTINTO'
        )
      }

      if (!elemento.estado) {
        fail(`${elemento.nombre}: el elemento no está activo`, 422, 'E_ELEMENTO_INACTIVO')
      }

      assertOwnedByCenter(
        scope,
        lugar.idCformacion,
        `${elemento.nombre}: el elemento no pertenece a tu centro de formación`
      )

      const fechas = this.fechasDe(payload)
      const datos = {
        codigoSolicitud: payload.codigoSolicitud,
        idObra: obra.id,
        idElemento: elemento.id,
        idUsuario: personas.idSolicitante,
        idUsuarioRegistra: personas.idRegistra,
        cantidad: fila.cantidad,
        cantidadEntregada: 0,
        ficha: payload.ficha ?? null,
        estado: 'pendiente' as const,
        observacion: fila.observacion ?? payload.observacion ?? null,
        fecha,
        idUsuarioEntrega: null,
        fechaEntrega: null,
      }

      if (consumo) {
        const row = await SolicitudMaterial.create({ ...datos, ...fechas }, { client: trx })
        filas.push({ tipo: 'material', row, elemento, idStand: lugar.idStand })
      } else {
        const row = await SolicitudEquipo.create(
          {
            ...datos,
            ...fechas,
            cantidadDevuelta: 0,
            estadoElemento: null,
            fechaDevolucion: null,
            fechaDevolucionLimite: null,
          },
          { client: trx }
        )
        filas.push({ tipo: 'equipo', row, elemento, idStand: lugar.idStand })
      }
    }

    return { obra, filas }
  }

  /**
   * Cada quien ve las filas que ya veía en las solicitudes sueltas: el
   * instructor las suyas y bodega las de sus stands.
   */
  private async facturas(scope: AccessScope, codigoSolicitud?: string): Promise<Factura[]> {
    const verMaterial = can(scope, 'solicitud_material.ver')
    const verEquipo = can(scope, 'solicitud_equipo.ver')

    if (!verMaterial && !verEquipo) {
      throw forbidden('No tienes permiso para realizar esta acción')
    }

    const materialQuery = this.material
      .conRelaciones(this.material.visibles(scope))
      .orderBy('id_solicitud_material', 'asc')
    const equipoQuery = this.equipo
      .conRelaciones(this.equipo.visibles(scope))
      .orderBy('id_solicitud_equipo', 'asc')

    if (codigoSolicitud !== undefined) {
      materialQuery.where('codigo_solicitud', codigoSolicitud)
      equipoQuery.where('codigo_solicitud', codigoSolicitud)
    }

    const [materiales, equipos] = await Promise.all([
      verMaterial ? materialQuery.exec() : Promise.resolve([]),
      verEquipo ? equipoQuery.exec() : Promise.resolve([]),
    ])

    const grupos = new Map<string, Omit<Factura, 'estado'>>()
    const grupo = (codigo: string) => {
      let row = grupos.get(codigo)

      if (!row) {
        row = { codigoSolicitud: codigo, materiales: [], equipos: [] }
        grupos.set(codigo, row)
      }

      return row
    }

    for (const row of materiales) grupo(row.codigoSolicitud).materiales.push(row)
    for (const row of equipos) grupo(row.codigoSolicitud).equipos.push(row)

    return [...grupos.values()]
      .map((row) => ({ ...row, estado: estadoDe(row.materiales, row.equipos) }))
      .sort((a, b) => fechaDe(b) - fechaDe(a))
  }

  /**
   * Solo el equipo devolutivo lleva fechas: inicio del préstamo y hasta cuándo
   * lo pide. Son del pedido, no de cada fila, así que van iguales en todas.
   * El consumo se entrega y ya: si llega alguna fecha, se ignora.
   */
  private validarFechas(payload: CrearSolicitud) {
    if (payload.tipo !== 'devolutivo') return

    const dia = hoy()
    const inicio = payload.fechaInicio
      ? fechaValida(payload.fechaInicio, 'La fecha de inicio')
      : null
    const devolucion = payload.fechaDevolucionPropuesta
      ? fechaValida(payload.fechaDevolucionPropuesta, 'La fecha de devolución')
      : null

    if (inicio) {
      noAntesDe(inicio, dia, 'La fecha de inicio no puede ser anterior a hoy')
    }

    if (devolucion) {
      noAntesDe(devolucion, inicio ?? dia, 'La fecha de devolución no puede ser anterior al inicio')
    }
  }

  private fechasDe(payload: CrearSolicitud) {
    if (payload.tipo !== 'devolutivo') return {}

    return {
      fechaInicio: payload.fechaInicio ?? null,
      fechaDevolucionPropuesta: payload.fechaDevolucionPropuesta ?? null,
    }
  }

  /**
   * Al entregar un pedido de equipo, bodega confirma el plazo. Si no manda
   * fecha y el pedido tampoco la traía, se queda sin fecha (y sin aviso).
   */
  private limiteAlEntregar(factura: Factura, fecha: FechaDia | undefined) {
    // El consumo no tiene plazo: si llega una fecha, se ignora.
    if (!factura.equipos.length) return undefined

    const dia = hoy()
    const propuesta = factura.equipos[0].fechaDevolucionPropuesta
    const limite = fecha ? fechaValida(fecha, 'La fecha límite de devolución') : propuesta

    if (limite) {
      noAntesDe(limite, dia, 'La fecha límite de devolución no puede ser anterior a hoy')
    }

    return limite ?? undefined
  }

  /**
   * Bodega corre el plazo de un pedido de equipo que sigue con unidades afuera.
   * Cambia todas las filas de ese código y el aviso del día siguiente ya usa
   * la fecha nueva.
   */
  async ajustarPlazo(scope: AccessScope, codigoSolicitud: string, fechaDevolucionLimite: FechaDia) {
    assertCan(scope, 'solicitud_equipo.entregar')

    const factura = await this.show(scope, codigoSolicitud)

    if (!factura.equipos.length) {
      fail('Esa solicitud no es de equipo devolutivo', 422, 'E_TIPO_DISTINTO')
    }

    const fecha = fechaValida(fechaDevolucionLimite, 'La fecha límite de devolución')

    if (!factura.equipos.some((row) => row.cantidadEntregada > row.cantidadDevuelta)) {
      fail('Esa solicitud no tiene equipo afuera', 422, 'E_ESTADO_INVALIDO')
    }

    noAntesDe(fecha, hoy(), 'La fecha límite de devolución no puede ser anterior a hoy')

    const actualizado = await SolicitudEquipo.query()
      .whereIn(
        'id_solicitud_equipo',
        factura.equipos.map((row) => row.id)
      )
      .update({ fecha_devolucion_limite: fecha })

    if (!Number(actualizado)) {
      fail('La solicitud indicada no existe', 404, 'E_NOT_FOUND')
    }

    return this.show(scope, codigoSolicitud)
  }

  /**
   * El código es el número de la factura: no se repite dentro del centro. El
   * candado evita que dos pedidos simultáneos con el mismo código pasen los dos.
   */
  private async reservarCodigo(
    trx: TransactionClientContract,
    idCformacion: number,
    codigoSolicitud: string
  ) {
    await trx.rawQuery('SELECT pg_advisory_xact_lock(hashtext(?))', [
      `solicitud:${idCformacion}:${codigoSolicitud}`,
    ])

    for (const tabla of ['solicitud_material', 'solicitud_equipo']) {
      const usado = await trx
        .from(tabla)
        .select(`${tabla}.codigo_solicitud`)
        .join('obra', 'obra.id_obra', `${tabla}.id_obra`)
        .where('obra.id_cformacion', idCformacion)
        .where(`${tabla}.codigo_solicitud`, codigoSolicitud)
        .first()

      if (usado) {
        fail('Ya existe una solicitud con ese código', 409, 'E_CODIGO_REPETIDO')
      }
    }
  }
}

function fechaDe(factura: Omit<Factura, 'estado'>) {
  return Math.max(...[...factura.materiales, ...factura.equipos].map((row) => row.fecha.toMillis()))
}
