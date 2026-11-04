import { BaseTransformer } from '@adonisjs/core/transformers'
import type VigenciaEspecial from '#models/vigencia_especial'

export default class VigenciaEspecialTransformer extends BaseTransformer<VigenciaEspecial> {
  toObject() {
    return {
      id: this.resource.id,
      anio: this.resource.anio,
      nombre: this.resource.nombre,
      monto: this.resource.monto,
      activa: this.resource.activa,
      programas: (this.resource.programas ?? []).map((fila) => ({
        id: fila.programaId,
        nombre: fila.programa?.nombre ?? null,
        codigo: fila.programa?.codigo ?? null,
      })),
    }
  }
}
