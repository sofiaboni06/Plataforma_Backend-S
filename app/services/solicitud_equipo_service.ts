import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

import SolicitudEquipo from '#models/solicitud_equipo'
import Elemento from '#models/elemento'


export default class SolicitudEquipoService {
  /**
   * Registrar pedido.
   *
   * IMPORTANTE:
   * Aquí NO se modifica el stock del elemento.
   */
  async create(
    payload: {
      codigoSolicitud: string
      idObra: number
      idElemento: number
      cantidad: number
      ficha?: string
      observacion?: string
    },
    idUsuario: number
  ) {
    const elemento = await Elemento
      .query()
      .where('id', payload.idElemento)
      .preload('clasificacion')
      .first()

    if (!elemento) {
      throw new Error('El elemento indicado no existe')
    }

    if (!elemento.clasificacion) {
      throw new Error('El elemento no tiene clasificación')
    }

    if (elemento.clasificacion.caracter !== 'devolutivo') {
      throw new Error(
        'Solo se pueden solicitar herramientas o equipos de carácter devolutivo'
      )
    }

    const obraExists = await db
      .from('obra')
      .where('id_obra', payload.idObra)
      .first()

    if (!obraExists) {
      throw new Error('La obra indicada no existe')
    }

    const solicitud = await SolicitudEquipo.create({
      codigoSolicitud: payload.codigoSolicitud,
      idObra: payload.idObra,
      idElemento: payload.idElemento,
      idUsuario: idUsuario,
      cantidad: payload.cantidad,
      ficha: payload.ficha ?? null,
      estado: 'pendiente',
      estadoElemento: null,
      observacion: payload.observacion ?? null,
      fecha: DateTime.now(),
    })

    await solicitud.load('elemento')
    await solicitud.load('obra')
    await solicitud.load('usuario')

    return solicitud
  }

  /**
   * Listar solicitudes.
   */
  async index() {
    return SolicitudEquipo
      .query()
      .preload('elemento')
      .preload('obra')
      .preload('usuario')
      .orderBy('fecha', 'desc')
  }

  /**
   * Consultar una solicitud.
   */
  async show(id: number) {
    const solicitud = await SolicitudEquipo
      .query()
      .where('idSolicitudEquipo', id)
      .preload('elemento')
      .preload('obra')
      .preload('usuario')
      .first()

    if (!solicitud) {
      throw new Error('La solicitud indicada no existe')
    }

    return solicitud
  }
  async entregar(id: number, idUsuarioEntrega: number) {
  const trx = await db.transaction()

  try {
    const solicitud = await SolicitudEquipo
      .query({ client: trx })
      .where('idSolicitudEquipo', id)
      .forUpdate()
      .first()

    if (!solicitud) {
      throw new Error('La solicitud indicada no existe')
    }

    if (solicitud.estado !== 'pendiente') {
      throw new Error(
        'Solo se puede entregar una solicitud que esté pendiente'
      )
    }

    const elemento = await Elemento
      .query({ client: trx })
      .where('id', solicitud.idElemento)
      .forUpdate()
      .first()

    if (!elemento) {
      throw new Error('El elemento indicado no existe')
    }

    if (elemento.cantidad < solicitud.cantidad) {
      throw new Error(
        'No hay suficiente cantidad disponible para entregar la solicitud'
      )
    }

    elemento.cantidad -= solicitud.cantidad

    await elemento
      .useTransaction(trx)
      .save()

    solicitud.estado = 'entregado'
    solicitud.idUsuarioEntrega = idUsuarioEntrega
    solicitud.fechaEntrega = DateTime.now()

    await solicitud
      .useTransaction(trx)
      .save()

    await trx.commit()

    await solicitud.load('elemento')
    await solicitud.load('obra')
    await solicitud.load('usuario')

    return solicitud
  } catch (error) {
    await trx.rollback()
    throw error
  }
}

  async devolver(
    id: number,
    estadoElemento: 'bueno' | 'danado' | 'perdido' | 'en_reparacion',
    observacion?: string
  ) {
    const trx = await db.transaction()

    try {
      const solicitud = await SolicitudEquipo
        .query({ client: trx })
        .where('idSolicitudEquipo', id)
        .forUpdate()
        .first()

      if (!solicitud) {
        throw new Error('La solicitud indicada no existe')
      }

      if (solicitud.estado !== 'entregado') {
        throw new Error(
          'Solo se puede devolver una solicitud que esté entregada'
        )
      }

      const elemento = await Elemento
        .query({ client: trx })
        .where('id', solicitud.idElemento)
        .forUpdate()
        .first()

      if (!elemento) {
        throw new Error('El elemento indicado no existe')
      }

      solicitud.estado = 'devuelto'
      solicitud.estadoElemento = estadoElemento
      solicitud.fechaDevolucion = DateTime.now()
      solicitud.observacion = observacion?.trim() || null

      if (estadoElemento === 'bueno') {
        elemento.cantidad += solicitud.cantidad

        await elemento
          .useTransaction(trx)
          .save()
      }

      await solicitud
        .useTransaction(trx)
        .save()

      await trx.commit()

      await solicitud.load('elemento')
      await solicitud.load('obra')
      await solicitud.load('usuario')

      return solicitud
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }
}