import { BaseTransformer } from '@adonisjs/core/transformers'
import type CodigoEstandar from '#models/codigo_estandar'

export default class CodigoEstandarTransformer extends BaseTransformer<CodigoEstandar> {
  toObject() {
    return {
      id: this.resource.id,
      codigo: this.resource.codigo,
      nombre: this.resource.nombre,
    }
  }
}
