import { BaseTransformer } from '@adonisjs/core/transformers'
import type Vigencia from '#models/vigencia'

export default class VigenciaTransformer extends BaseTransformer<Vigencia> {
  toObject() {
    return {
      anio: this.resource.anio,
      activa: this.resource.activa,
      fechaApertura: this.resource.fechaApertura?.toISODate() ?? null,
      fechaCierre: this.resource.fechaCierre?.toISODate() ?? null,
    }
  }
}
