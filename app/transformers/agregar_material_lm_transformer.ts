import { BaseTransformer } from '@adonisjs/core/transformers'
import type AgregarMaterialLm from '#models/agregar_material_lm'
import ElementoTransformer from '#transformers/elemento_transformer'
import ProgramaFormacionTransformer from '#transformers/programa_formacion_transformer'

export default class AgregarMaterialLmTransformer extends BaseTransformer<AgregarMaterialLm> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'programaId',
        'centroId',
        'elementoId',
        'cantidadBase',
        'observaciones',
        'usuarioRegistroId',
        'estado',
        'createdAt',
        'updatedAt',
      ]),
      programa: ProgramaFormacionTransformer.transform(this.whenLoaded(this.resource.programa)),
      elemento: ElementoTransformer.transform(this.whenLoaded(this.resource.elemento)),
    }
  }
}