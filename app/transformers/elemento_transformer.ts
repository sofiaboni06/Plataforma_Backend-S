import type Elemento from '#models/elemento'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class ElementoTransformer extends BaseTransformer<Elemento> {
  toObject() {
    const subcategoria = this.resource.subcategoria
    const stand = this.resource.stand
    const unidadMedida = this.resource.unidadMedida

    return {
      id: this.resource.id,
      idSubcategoria: this.resource.idSubcategoria,
      idStand: this.resource.idStand,
      nombre: this.resource.nombre,
      cantidad: this.resource.cantidad,
      estado: this.resource.estado,
      idUnidadMedida: this.resource.idUnidadMedida,
      codigo: this.resource.codigo,
      descripcion: this.resource.descripcionTecnica,
      marca: this.resource.marca,
      urlFotografia: this.resource.urlFotografia,
      subcategoria: subcategoria
        ? { id: subcategoria.id, nombre: subcategoria.nombre }
        : null,
      stand: stand ? { id: stand.id, nombre: stand.nombre, idBodega: stand.idBodega } : null,
      unidadMedida: unidadMedida
        ? {
            id: unidadMedida.id,
            nombre: unidadMedida.nombre,
            abreviatura: unidadMedida.abreviatura,
          }
        : null,
    }
  }
}
