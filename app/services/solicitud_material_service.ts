import { Exception } from '@adonisjs/core/exceptions'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import Elemento from '#models/elemento'
import Obra from '#models/obra'
import SolicitudMaterial from '#models/solicitud_material'
import {
  assertOwnedByCenter,
  assertStandInScope,
  can,
  standIdsQuery,
  type AccessScope,
} from '#services/access_control'
import DisponibilidadService from '#services/disponibilidad_service'

type CrearSolicitudMaterial = {
  codigoSolicitud: string
  idObra: number
  idElemento: number
  cantidad: number
  ficha?: string
  observacion?: string
}

const ESTADOS = ['pendiente', 'entregado'] as const

function fail(message: string, status: number, code: string): never {
  throw new Exception(message, { status, code })
}

function estadoFiltro(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return undefined
  }

  if (typeof value === 'string' && ESTADOS.includes(value as (typeof ESTADOS)[number])) {
    return value as (typeof ESTADOS)[number]
  }

  fail('El estado indicado no es válido', 422, 'E_VALIDATION_ERROR')
}

export default class SolicitudMaterialService {
  private disponibilidad = new DisponibilidadService()

  /**
   * The request stays pending. Stock leaves the shelf when admin bodega delivers.
   */
  async create(scope: AccessScope, payload: CrearSolicitudMaterial) {
    const trx = await db.transaction()
    let solicitudId = 0

    try {
      const elemento = await Elemento.query({ client: trx })
        .where('id_elemento', payload.idElemento)
        .preload('clasificacion')
        .forUpdate()
        .first()

      if (!elemento) {
        fail('El elemento indicado no existe', 404, 'E_NOT_FOUND')
      }

      if (!elemento.clasificacion || elemento.clasificacion.caracter !== 'consumo') {
        fail('Solo se pueden solicitar materiales de carácter consumo', 422, 'E_CARACTER_INVALIDO')
      }

      if (!elemento.estado) {
        fail('El elemento indicado no está activo', 422, 'E_ELEMENTO_INACTIVO')
      }

      await this.assertElementoDelCentro(scope, elemento.id, trx)

      const obra = await Obra.query({ client: trx }).where('id_obra', payload.idObra).first()
      this.assertObra(scope, obra, true)

      const comprometido =
        (await this.disponibilidad.comprometido([elemento.id], trx)).get(elemento.id) ?? 0
      this.disponibilidad.assertCantidad(Number(elemento.cantidad), comprometido, payload.cantidad)

      const solicitud = await SolicitudMaterial.create(
        {
          codigoSolicitud: payload.codigoSolicitud,
          idObra: payload.idObra,
          idElemento: payload.idElemento,
          idUsuario: scope.idUsuario,
          cantidad: payload.cantidad,
          ficha: payload.ficha ?? null,
          estado: 'pendiente',
          observacion: payload.observacion ?? null,
          fecha: DateTime.now(),
          idUsuarioEntrega: null,
          fechaEntrega: null,
        },
        { client: trx }
      )

      solicitudId = solicitud.id
      await trx.commit()
    } catch (error) {
      await trx.rollback()
      throw error
    }

    return this.show(scope, solicitudId)
  }

  async index(scope: AccessScope, estado?: unknown) {
    const filtro = estadoFiltro(estado)
    const query = this.visibles(scope)
      .preload('elemento')
      .preload('obra')
      .preload('usuario')
      .preload('usuarioEntrega')
      .orderBy('fecha', 'desc')

    if (filtro) {
      query.where('estado', filtro)
    }

    return query
  }

  async show(scope: AccessScope, id: number) {
    const solicitud = await this.visibles(scope)
      .where('id_solicitud_material', id)
      .preload('elemento')
      .preload('obra')
      .preload('usuario')
      .preload('usuarioEntrega')
      .first()

    if (!solicitud) {
      fail('La solicitud de material indicada no existe', 404, 'E_NOT_FOUND')
    }

    return solicitud
  }

  async entregar(scope: AccessScope, id: number) {
    const trx = await db.transaction()

    try {
      const solicitud = await SolicitudMaterial.query({ client: trx })
        .where('id_solicitud_material', id)
        .forUpdate()
        .first()

      if (!solicitud) {
        fail('La solicitud de material indicada no existe', 404, 'E_NOT_FOUND')
      }

      if (solicitud.estado !== 'pendiente') {
        fail(
          'Solo se puede entregar una solicitud de material que esté pendiente',
          422,
          'E_ESTADO_INVALIDO'
        )
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

      if (Number(elemento.cantidad) < solicitud.cantidad) {
        fail(
          'No hay suficiente cantidad disponible para entregar la solicitud',
          422,
          'E_STOCK_INSUFICIENTE'
        )
      }

      elemento.cantidad = Number(elemento.cantidad) - solicitud.cantidad
      await elemento.useTransaction(trx).save()

      solicitud.estado = 'entregado'
      solicitud.idUsuarioEntrega = scope.idUsuario
      solicitud.fechaEntrega = DateTime.now()
      await solicitud.useTransaction(trx).save()

      await trx.commit()
    } catch (error) {
      await trx.rollback()
      throw error
    }

    return this.show(scope, id)
  }

  private visibles(scope: AccessScope) {
    const query = SolicitudMaterial.query().whereHas('obra', (obra) => {
      obra.where('id_cformacion', scope.idCformacion)
    })

    if (scope.isAdmin) {
      return query
    }

    if (can(scope, 'solicitud_material.entregar') && !can(scope, 'solicitud_material.crear')) {
      return query.whereIn(
        'id_elemento',
        db.from('elemento').select('id_elemento').whereIn('id_stand', standIdsQuery(scope))
      )
    }

    return query.where('id_usuario', scope.idUsuario)
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
