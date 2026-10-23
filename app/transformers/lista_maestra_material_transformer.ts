import { BaseTransformer } from '@adonisjs/core/transformers'
import type ListaMaestraMaterial from '#models/lista_maestra_material'

export default class ListaMaestraMaterialTransformer extends BaseTransformer<ListaMaestraMaterial> {
  toObject() {
    const programa = this.resource.programa

    return {
      id: this.resource.id,
      programaId: this.resource.programaId,
      codigoUnspsc: this.resource.codigoUnspsc,
      producto: this.resource.producto,
      descripcionTecnica: this.resource.descripcionTecnica,
      unidadMedida: this.resource.unidadMedida,
      cantidadBase: this.resource.cantidadBase,
      caracter: this.resource.caracter,
      observaciones: this.resource.observaciones,
      estado: this.resource.estado,
      programa: programa
        ? {
            id: programa.id,
            codigo: programa.codigo,
            nombre: programa.nombre,
            version: programa.version,
          }
        : null,
    }
  }
}
