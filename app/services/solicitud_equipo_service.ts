import { Exception } from '@adonisjs/core/exceptions'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import Elemento from '#models/elemento'
import Obra from '#models/obra'
import SolicitudEquipo, { type EstadoElementoEquipo } from '#models/solicitud_equipo'

type CrearSolicitudEquipo = {
  codigoSolicitud: string
  idObra: number
  idElemento: number
  cantidad: number
  ficha?: string
  observacion?: string
}

function fail(message: string, status: number, code: string): never {
  throw new Exception(message, { status, code })
}

export default class SolicitudEquipoService {
  /**
   * El pedido queda pendiente. El stock del elemento se descuenta al entregar.
   */
  async create(payload: CrearSolicitudEquipo, idUsuario: number) {
    const elemento = await Elemento.query()
      .where('id_elemento', payload.idElemento)
      .preload('clasificacion')
      .first()

    if (!elemento) {
      fail('El elemento indicado no existe', 404, 'E_NOT_FOUND')
    }

    if (!elemento.clasificacion || elemento.clasificacion.caracter !== 'devolutivo') {
      fail(
        'Solo se pueden solicitar herramientas o equipos de carácter devolutivo',
        422,
        'E_CARACTER_INVALIDO'
      )
    }

    if (!elemento.estado) {
      fail('El elemento indicado no está activo', 422, 'E_ELEMENTO_INACTIVO')
    }

    const obra = await Obra.query().where('id_obra', payload.idObra).first()

    if (!obra) {
      fail('La obra indicada no existe', 404, 'E_NOT_FOUND')
    }

    if (!obra.estado) {
      fail('La obra indicada no está activa', 422, 'E_OBRA_INACTIVA')
    }

    const solicitud = await SolicitudEquipo.create({
      codigoSolicitud: payload.codigoSolicitud,
      idObra: payload.idObra,
      idElemento: payload.idElemento,
      idUsuario,
      cantidad: payload.cantidad,
      ficha: payload.ficha ?? null,
      estado: 'pendiente',
      estadoElemento: null,
      observacion: payload.observacion ?? null,
      fecha: DateTime.now(),
      idUsuarioEntrega: null,
      fechaEntrega: null,
      fechaDevolucion: null,
    })

    return this.show(solicitud.id)
  }

  async index() {
    return SolicitudEquipo.query()
      .preload('elemento')
      .preload('obra')
      .preload('usuario')
      .preload('usuarioEntrega')
      .orderBy('fecha', 'desc')
  }

  async show(id: number) {
    const solicitud = await SolicitudEquipo.query()
      .where('id_solicitud_equipo', id)
      .preload('elemento')
      .preload('obra')
      .preload('usuario')
      .preload('usuarioEntrega')
      .first()

    if (!solicitud) {
      fail('La solicitud indicada no existe', 404, 'E_NOT_FOUND')
    }

    return solicitud
  }

  async entregar(id: number, idUsuarioEntrega: number) {
    const trx = await db.transaction()

    try {
      const solicitud = await SolicitudEquipo.query({ client: trx })
        .where('id_solicitud_equipo', id)
        .forUpdate()
        .first()

      if (!solicitud) {
        fail('La solicitud indicada no existe', 404, 'E_NOT_FOUND')
      }

      if (solicitud.estado !== 'pendiente') {
        fail('Solo se puede entregar una solicitud que esté pendiente', 422, 'E_ESTADO_INVALIDO')
      }

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
      solicitud.idUsuarioEntrega = idUsuarioEntrega
      solicitud.fechaEntrega = DateTime.now()
      await solicitud.useTransaction(trx).save()

      await trx.commit()
    } catch (error) {
      await trx.rollback()
      throw error
    }

    return this.show(id)
  }

  async devolver(id: number, estadoElemento: EstadoElementoEquipo, observacion?: string) {
    const trx = await db.transaction()

    try {
      const solicitud = await SolicitudEquipo.query({ client: trx })
        .where('id_solicitud_equipo', id)
        .forUpdate()
        .first()

      if (!solicitud) {
        fail('La solicitud indicada no existe', 404, 'E_NOT_FOUND')
      }

      if (solicitud.estado !== 'entregado') {
        fail('Solo se puede devolver una solicitud que esté entregada', 422, 'E_ESTADO_INVALIDO')
      }

      const elemento = await Elemento.query({ client: trx })
        .where('id_elemento', solicitud.idElemento)
        .forUpdate()
        .first()

      if (!elemento) {
        fail('El elemento indicado no existe', 404, 'E_NOT_FOUND')
      }

      solicitud.estado = 'devuelto'
      solicitud.estadoElemento = estadoElemento
      solicitud.fechaDevolucion = DateTime.now()
      solicitud.observacion = observacion?.trim() || null

      if (estadoElemento === 'bueno') {
        elemento.cantidad = Number(elemento.cantidad) + solicitud.cantidad
        await elemento.useTransaction(trx).save()
      }

      await solicitud.useTransaction(trx).save()

      await trx.commit()
    } catch (error) {
      await trx.rollback()
      throw error
    }

    return this.show(id)
  }
}
