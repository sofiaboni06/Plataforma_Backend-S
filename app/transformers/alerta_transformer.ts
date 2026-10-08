import { BaseTransformer } from '@adonisjs/core/transformers'
import type { DateTime } from 'luxon'
import type Alerta from '#models/alerta'

function fechaIso(value: DateTime | null) {
  return value?.toISO() ?? null
}

export default class AlertaTransformer extends BaseTransformer<Alerta> {
  toObject() {
    const elemento = this.resource.elemento

    return {
      id: this.resource.id,
      idElemento: this.resource.idElemento,
      tipo: this.resource.tipo,
      cantidad: this.resource.cantidad,
      cantidadMinima: this.resource.cantidadMinima,
      estado: this.resource.estado,
      fecha: fechaIso(this.resource.fecha),
      elemento: elemento
        ? {
            id: elemento.id,
            nombre: elemento.nombre,
            codigo: elemento.codigo,
          }
        : null,
    }
  }
}
