import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

import SolicitudMaterial from '#models/solicitud_material'
import Elemento from '#models/elemento'

export default class SolicitudMaterialService {
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

    if (elemento.clasificacion.caracter !== 'consumo') {
      throw new Error(
        'Solo se pueden solicitar materiales de carácter consumo'
      )
    }

    const obraExists = await db
      .from('obra')
      .where('id_obra', payload.idObra)
      .first()

    if (!obraExists) {
      throw new Error('La obra indicada no existe')
    }

    if (payload.cantidad <= 0) {
      throw new Error('La cantidad debe ser mayor que cero')
    }

    const solicitud = await SolicitudMaterial.create({
      codigoSolicitud: payload.codigoSolicitud,
      idObra: payload.idObra,
      idElemento: payload.idElemento,
      idUsuario,
      cantidad: payload.cantidad,
      ficha: payload.ficha ?? null,
      estado: 'pendiente',
      observacion: payload.observacion ?? null,
      fecha: DateTime.now(),
      idUsuarioEntrega: null,
      fechaEntrega: null,
    })

    await solicitud.load('elemento')
    await solicitud.load('obra')
    await solicitud.load('usuario')

    return solicitud
  }

  async index() {
    return SolicitudMaterial
      .query()
      .preload('elemento')
      .preload('obra')
      .preload('usuario')
      .preload('usuarioEntrega')
      .orderBy('fecha', 'desc')
  }

  async show(id: number) {
    const solicitud = await SolicitudMaterial
      .query()
      .where('id', id)
      .preload('elemento')
      .preload('obra')
      .preload('usuario')
      .preload('usuarioEntrega')
      .first()

    if (!solicitud) {
      throw new Error('La solicitud de material indicada no existe')
    }

    return solicitud
  }

  async entregar(id: number, idUsuarioEntrega: number) {
    const trx = await db.transaction()

    try {
      const solicitud = await SolicitudMaterial
        .query({ client: trx })
        .where('id', id)
        .forUpdate()
        .first()

      if (!solicitud) {
        throw new Error('La solicitud de material indicada no existe')
      }

      if (solicitud.estado !== 'pendiente') {
        throw new Error(
          'Solo se puede entregar una solicitud de material que esté pendiente'
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
      await solicitud.load('usuarioEntrega')

      return solicitud
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }
}