import { BaseTransformer } from '@adonisjs/core/transformers'
import type { DateTime } from 'luxon'
import type Notificacion from '#models/notificacion'

function fechaIso(value: DateTime | null) {
  return value?.toISO() ?? null
}

export function notificacionJson(row: Notificacion) {
  return {
    id: row.id,
    tipo: row.tipo,
    titulo: row.titulo,
    mensaje: row.mensaje,
    leida: row.leida,
    recurso: row.recurso,
    idReferencia: row.idReferencia,
    fecha: fechaIso(row.fecha),
  }
}

export default class NotificacionTransformer extends BaseTransformer<Notificacion> {
  toObject() {
    return notificacionJson(this.resource)
  }
}
