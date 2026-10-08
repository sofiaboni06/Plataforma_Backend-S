import { Exception } from '@adonisjs/core/exceptions'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import Elemento from '#models/elemento'
import Obra from '#models/obra'
import SolicitudEquipo, { type EstadoElementoEquipo } from '#models/solicitud_equipo'
import {
  assertOwnedByCenter,
  assertStandInScope,
  can,
  standIdsQuery,
  type AccessScope,
} from '#services/access_control'
import DisponibilidadService, {
  pendientesQuePuedeEntregar,
  type SolicitudPendiente,
} from '#services/disponibilidad_service'
import EntregaService, {
  type LineaDevolucion,
  type OpcionesEntrega,
} from '#services/entrega_service'
import NotificacionService from '#services/notificacion_service'

type CrearSolicitudEquipo = {
  codigoSolicitud: string
  idObra: number
  idElemento: number
  cantidad: number
  ficha?: string
  observacion?: string
}

/**
 * `detalle` reparte lo que vuelve por estado (5 bueno, 2 dañado). Sin
 * detalle, vuelve `cantidad` (o todo lo que está afuera) con un solo estado.
 */
export type DevolverEquipo = {
  detalle?: LineaDevolucion[]
  estadoElemento?: EstadoElementoEquipo
  cantidad?: number
  observacion?: string
}

const ESTADOS = ['pendiente', 'parcial', 'entregado', 'devuelto'] as const

function fail(message: string, status: number, code: string): never {
  throw new Exception(message, { status, code })
}

/**
 * Acepta un estado o varios separados por coma (`pendiente,parcial`): bodega
 * ve juntas las que no tienen nada entregado y las que quedaron a medias.
 */
function estadoFiltro(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return undefined
  }

  const valores = (Array.isArray(value) ? value : String(value).split(',')).map((row) =>
    typeof row === 'string' ? row.trim() : row
  )

  if (valores.length && valores.every((row) => ESTADOS.includes(row as (typeof ESTADOS)[number]))) {
    return valores as (typeof ESTADOS)[number][]
  }

  fail('El estado indicado no es válido', 422, 'E_VALIDATION_ERROR')
}

/**
 * `afuera=true` deja solo las filas con equipo afuera (entregado menos
 * devuelto), sean `entregado` o `parcial`: lo que bodega puede recibir.
 */
function afueraFiltro(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return false
  }

  if (value === true || value === 'true' || value === '1') {
    return true
  }

  if (value === false || value === 'false' || value === '0') {
    return false
  }

  fail('El filtro de equipo afuera no es válido', 422, 'E_VALIDATION_ERROR')
}

export default class SolicitudEquipoService {
  private disponibilidad = new DisponibilidadService()
  private entregas = new EntregaService()
  private notificaciones = new NotificacionService()

  /**
   * The request stays pending. It may ask for more than the shelf holds: admin
   * bodega delivers what there is and the rest stays pending. Stock comes back
   * only for tools received in good condition.
   */
  async create(scope: AccessScope, payload: CrearSolicitudEquipo) {
    const trx = await db.transaction()
    let solicitudId = 0
    let avisos: Awaited<ReturnType<NotificacionService['pedidoEquipo']>> = []

    try {
      const elemento = await Elemento.query({ client: trx })
        .where('id_elemento', payload.idElemento)
        .preload('clasificacion')
        .forUpdate()
        .first()

      if (!elemento) {
        fail('El elemento indicado no existe', 404, 'E_NOT_FOUND')
      }

      if (elemento.caracterEfectivo() !== 'devolutivo') {
        fail(
          'Solo se pueden solicitar herramientas o equipos de carácter devolutivo',
          422,
          'E_CARACTER_INVALIDO'
        )
      }

      if (!elemento.estado) {
        fail('El elemento indicado no está activo', 422, 'E_ELEMENTO_INACTIVO')
      }

      await this.assertElementoDelCentro(scope, elemento.id, trx)

      const obra = await Obra.query({ client: trx }).where('id_obra', payload.idObra).first()
      this.assertObra(scope, obra, true)

      const solicitud = await SolicitudEquipo.create(
        {
          codigoSolicitud: payload.codigoSolicitud,
          idObra: payload.idObra,
          idElemento: payload.idElemento,
          idUsuario: scope.idUsuario,
          idUsuarioRegistra: null,
          cantidad: payload.cantidad,
          cantidadEntregada: 0,
          cantidadDevuelta: 0,
          ficha: payload.ficha ?? null,
          estado: 'pendiente',
          estadoElemento: null,
          observacion: payload.observacion ?? null,
          fecha: DateTime.now(),
          idUsuarioEntrega: null,
          fechaEntrega: null,
          fechaDevolucion: null,
        },
        { client: trx }
      )

      solicitudId = solicitud.id
      avisos = await this.notificaciones.pedidoEquipo(trx, {
        idSolicitud: solicitud.id,
        idElemento: elemento.id,
        idSolicitante: scope.idUsuario,
        cantidad: payload.cantidad,
        elemento: elemento.nombre,
        obra: obra.nombre,
      })
      await trx.commit()
    } catch (error) {
      await trx.rollback()
      throw error
    }

    this.notificaciones.emitir(avisos)
    return this.show(scope, solicitudId)
  }

  async index(scope: AccessScope, estado?: unknown, afuera?: unknown) {
    const filtro = estadoFiltro(estado)
    const soloAfuera = afueraFiltro(afuera)
    const query = this.conRelaciones(this.visibles(scope)).orderBy('fecha', 'desc')

    if (filtro) {
      query.whereIn('estado', filtro)
    }

    if (soloAfuera) {
      query.whereColumn('cantidad_entregada', '>', 'cantidad_devuelta')
    }

    return query
  }

  async show(scope: AccessScope, id: number) {
    const solicitud = await this.conRelaciones(this.visibles(scope))
      .where('id_solicitud_equipo', id)
      .first()

    if (!solicitud) {
      fail('La solicitud indicada no existe', 404, 'E_NOT_FOUND')
    }

    return solicitud
  }

  /**
   * Sale lo que haya en el estante hasta completar lo pedido. Si no alcanza,
   * la fila queda `parcial` y se puede volver a entregar cuando llegue más.
   */
  async entregar(
    scope: AccessScope,
    id: number,
    opciones: Omit<OpcionesEntrega, 'exigirExistencia'> = {}
  ) {
    const trx = await db.transaction()
    let avisos: Awaited<ReturnType<NotificacionService['entregaEquipo']>> = []

    try {
      const solicitud = await SolicitudEquipo.query({ client: trx })
        .where('id_solicitud_equipo', id)
        .forUpdate()
        .first()

      if (!solicitud) {
        fail('La solicitud indicada no existe', 404, 'E_NOT_FOUND')
      }

      if (solicitud.estado !== 'pendiente' && solicitud.estado !== 'parcial') {
        fail('Esa solicitud ya se entregó completa', 422, 'E_ESTADO_INVALIDO')
      }

      const obra = await Obra.query({ client: trx }).where('id_obra', solicitud.idObra).first()
      this.assertObra(scope, obra, false)
      const idStand = await this.assertElementoDelCentro(scope, solicitud.idElemento, trx)
      await assertStandInScope(scope, idStand)

      const elemento = await Elemento.query({ client: trx })
        .where('id_elemento', solicitud.idElemento)
        .forUpdate()
        .first()

      if (!elemento) {
        fail('El elemento indicado no existe', 404, 'E_NOT_FOUND')
      }

      // Antes de entregar: si ya había salido algo, esta entrega completa una parcial.
      const entregadaAntes = solicitud.cantidadEntregada
      const resultado = await this.entregas.entregar(
        trx,
        scope,
        { tipo: 'equipo', row: solicitud },
        elemento,
        { ...opciones, exigirExistencia: true }
      )

      avisos = [
        ...(await this.notificaciones.entregaEquipo(trx, {
          idSolicitud: solicitud.id,
          codigoSolicitud: solicitud.codigoSolicitud,
          idDestinatario: solicitud.idUsuario,
          idQuienEntrega: scope.idUsuario,
          cantidad: resultado.entregada,
          pendiente: resultado.pendiente,
          entregadaAntes,
          elemento: elemento.nombre,
        })),
        ...(await this.notificaciones.aplicarStock(elemento, true, trx)),
      ]

      await trx.commit()
    } catch (error) {
      await trx.rollback()
      throw error
    }

    this.notificaciones.emitir(avisos)
    return this.show(scope, id)
  }

  /**
   * Se puede devolver por partes y mientras la fila siga `parcial`: lo que
   * cuenta es lo que está afuera (entregado menos devuelto).
   *
   * Lo que vuelve en buen estado regresa al estante. Si ese elemento tiene
   * solicitudes esperando, bodega recibe un solo aviso y la respuesta las trae.
   * La misma fila entra si todavía le falta por entregar: recibir unas
   * unidades no cancela lo que el instructor sigue esperando, y entregárselas
   * es decisión de bodega.
   */
  async devolver(scope: AccessScope, id: number, input: DevolverEquipo) {
    const trx = await db.transaction()
    let avisos: Awaited<ReturnType<NotificacionService['devolucionEquipo']>> = []
    let pendientes: SolicitudPendiente[] = []

    try {
      const solicitud = await SolicitudEquipo.query({ client: trx })
        .where('id_solicitud_equipo', id)
        .forUpdate()
        .first()

      if (!solicitud) {
        fail('La solicitud indicada no existe', 404, 'E_NOT_FOUND')
      }

      const obra = await Obra.query({ client: trx }).where('id_obra', solicitud.idObra).first()
      this.assertObra(scope, obra, false)
      const idStand = await this.assertElementoDelCentro(scope, solicitud.idElemento, trx)
      await assertStandInScope(scope, idStand)

      const elemento = await Elemento.query({ client: trx })
        .where('id_elemento', solicitud.idElemento)
        .forUpdate()
        .first()

      if (!elemento) {
        fail('El elemento indicado no existe', 404, 'E_NOT_FOUND')
      }

      const lineas = this.lineasDevolucion(solicitud, input)
      const resultado = await this.entregas.devolver(trx, scope, solicitud, elemento, lineas)

      // Solo si el stock subió: lo dañado o perdido no vuelve al estante.
      if (resultado.buenas > 0) {
        pendientes = await this.disponibilidad.pendientesDe(elemento.id, trx)
      }

      avisos = [
        ...(await this.notificaciones.devolucionEquipo(trx, {
          idSolicitud: solicitud.id,
          idDestinatario: solicitud.idUsuario,
          idQuienRecibe: scope.idUsuario,
          elemento: elemento.nombre,
          lineas,
          afuera: resultado.afuera,
        })),
        ...(await this.notificaciones.aplicarStock(elemento, true, trx)),
        ...(pendientes.length
          ? await this.notificaciones.stockParaPendientes(trx, {
              idElemento: elemento.id,
              elemento: elemento.nombre,
              idQuienAgrega: scope.idUsuario,
              agregadas: resultado.buenas,
              cantidad: Number(elemento.cantidad),
              filas: pendientes,
              origen: 'devolucion',
            })
          : []),
      ]

      await trx.commit()
    } catch (error) {
      await trx.rollback()
      throw error
    }

    this.notificaciones.emitir(avisos)

    return {
      solicitud: await this.show(scope, id),
      solicitudesPendientes: pendientesQuePuedeEntregar(scope, pendientes),
    }
  }

  visibles(scope: AccessScope) {
    const query = SolicitudEquipo.query().whereHas('obra', (obra) => {
      obra.where('id_cformacion', scope.idCformacion)
    })

    if (can(scope, 'solicitud_equipo.entregar') && !can(scope, 'solicitud_equipo.crear')) {
      return query.whereIn(
        'id_elemento',
        db.from('elemento').select('id_elemento').whereIn('id_stand', standIdsQuery(scope))
      )
    }

    return query.where('id_usuario', scope.idUsuario)
  }

  conRelaciones(query: ReturnType<SolicitudEquipoService['visibles']>) {
    return query
      .preload('elemento')
      .preload('obra')
      .preload('usuario')
      .preload('usuarioRegistra')
      .preload('usuarioEntrega')
      .preload('entregas', (entregas) => entregas.preload('usuario').orderBy('fecha', 'asc'))
      .preload('devoluciones', (devoluciones) =>
        devoluciones.preload('usuario').orderBy('fecha', 'asc')
      )
  }

  private lineasDevolucion(solicitud: SolicitudEquipo, input: DevolverEquipo): LineaDevolucion[] {
    if (input.detalle?.length) {
      return input.detalle.map((linea) => ({
        ...linea,
        observacion: linea.observacion ?? input.observacion,
      }))
    }

    if (!input.estadoElemento) {
      fail('Indica el estado del equipo que se devuelve', 422, 'E_VALIDATION_ERROR')
    }

    return [
      {
        estadoElemento: input.estadoElemento,
        cantidad: input.cantidad ?? solicitud.cantidadEntregada - solicitud.cantidadDevuelta,
        observacion: input.observacion,
      },
    ]
  }

  private assertObra(
    scope: AccessScope,
    obra: Obra | null,
    exigirActiva: boolean
  ): asserts obra is Obra {
    if (!obra) {
      fail('La obra indicada no existe', 404, 'E_NOT_FOUND')
    }

    assertOwnedByCenter(scope, obra.idCformacion, 'La obra no pertenece a tu centro de formación')

    if (exigirActiva && !obra.estado) {
      fail('La obra indicada no está activa', 422, 'E_OBRA_INACTIVA')
    }
  }

  private async assertElementoDelCentro(
    scope: AccessScope,
    idElemento: number,
    client: Parameters<DisponibilidadService['ubicacion']>[1]
  ) {
    const lugar = await this.disponibilidad.ubicacion(idElemento, client)

    if (!lugar) {
      fail('El elemento indicado no existe', 404, 'E_NOT_FOUND')
    }

    assertOwnedByCenter(
      scope,
      lugar.idCformacion,
      'El elemento no pertenece a tu centro de formación'
    )

    return lugar.idStand
  }
}
