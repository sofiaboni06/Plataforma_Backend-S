import type Elemento from '#models/elemento'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class ElementoTransformer extends BaseTransformer<Elemento> {
  toObject() {
    const subcategoria = this.resource.subcategoria
    const stand = this.resource.stand
    const unidadMedida = this.resource.unidadMedida

    const item = this.resource.item
    const codigoEstandar = this.resource.codigoEstandar
    const clasificacion = this.resource.clasificacion

    return {
      id: this.resource.id,
      idItem: this.resource.idItem,
      idSubcategoria: this.resource.idSubcategoria,
      idStand: this.resource.idStand,
      nombre: this.resource.nombre,
      cantidad: this.resource.cantidad,
      gramaje: this.resource.gramaje,
      idClasificacion: this.resource.idClasificacion,
      clasificacion: clasificacion
        ? { id: clasificacion.id, nombre: clasificacion.nombre }
        : null,
      valorUnitarioPromedio: this.resource.valorUnitarioPromedio,
      porcentajeAumento: this.resource.porcentajeAumento,
      valorConAumento: this.resource.valorConAumento(),
      estado: this.resource.estado,
      idUnidadMedida: this.resource.idUnidadMedida,
      codigo: this.resource.codigo,
      idCodigoEstandar: this.resource.idCodigoEstandar,
      codigoEstandar: codigoEstandar
        ? {
            id: codigoEstandar.id,
            codigo: codigoEstandar.codigo,
            nombre: codigoEstandar.nombre,
          }
        : null,
      descripcion: this.resource.descripcionTecnica,
      marca: this.resource.marca,
      color: this.resource.color,
      urlFotografia: this.resource.urlFotografia,
      item: item
        ? {
            id: item.id,
            nombre: item.nombre,
            descripcion: item.descripcion,
            idSubcategoria: item.idSubcategoria,
          }
        : null,
      subcategoria: subcategoria ? { id: subcategoria.id, nombre: subcategoria.nombre } : null,
      stand: stand
        ? {
            id: stand.id,
            nombre: stand.nombre,
            idSubBodega: stand.idSubBodega,
            subBodega: stand.subBodega
              ? {
                  id: stand.subBodega.id,
                  nombre: stand.subBodega.nombre,
                  idBodega: stand.subBodega.idBodega,
                }
              : null,
          }
        : null,
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
