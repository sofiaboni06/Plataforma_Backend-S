import { BaseTransformer } from '@adonisjs/core/transformers'
import type UsoPresupuestal from '#models/uso_presupuestal'

export default class UsoPresupuestalTransformer extends BaseTransformer<UsoPresupuestal> {
  toObject() {
    return {
      id: this.resource.id,
      idCformacion: this.resource.idCformacion,
      nombre: this.resource.nombre,
      estado: this.resource.estado,
    }
  }
}
