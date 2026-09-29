import type Elemento from '#models/elemento'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class ElementoTransformer extends BaseTransformer<Elemento> {
  toObject() {
    const subcategoria = this.resource.subcategoria
    const stand = this.resource.stand
    const unidadMedida = this.resource.unidadMedida

    const item = this.resource.item
    const itemSubcategoria = item?.subcategoria
    const codigoEstandar = this.resource.codigoEstandar
    const clasificacion = this.resource.clasificacion
    const usoPresupuestal = this.resource.usoPresupuestal

    return {
      id: this.resource.id,
      idItem: this.resource.idItem,
      idSubcategoria: this.resource.idSubcategoria,
      idStand: this.resource.idStand,
      nombre: this.resource.nombre,
      cantidad: this.resource.cantidad,
      cantidadMinima: this.resource.cantidadMinima,
      gramaje: this.resource.gramaje,
      idClasificacion: this.resource.idClasificacion,
      clasificacion: clasificacion ? { id: clasificacion.id, nombre: clasificacion.nombre } : null,
      valorUnitarioPromedio: this.resource.valorUnitarioPromedio,
      porcentajeAumento: this.resource.porcentajeAumento,
      valorConAumento: this.resource.valorConAumento(),
      estado: this.resource.estado,
      idUnidadMedida: this.resource.idUnidadMedida,
      codigo: this.resource.codigo,
      idCodigoEstandar: this.resource.idCodigoEstandar,
      idUsoPresupuestal: this.resource.idUsoPresupuestal,
      codigoEstandar: codigoEstandar
        ? {
            id: codigoEstandar.id,
            codigo: codigoEstandar.codigo,
            nombre: codigoEstandar.nombre,
          }
        : null,
      usoPresupuestal: usoPresupuestal
        ? { id: usoPresupuestal.id, nombre: usoPresupuestal.nombre }
        : null,
      descripcion: this.resource.descripcionTecnica,
      marca: this.resource.marca,
      color: this.resource.color,
      urlFotografia: urlFotografiaPublica(this.resource),
      item: item
        ? {
            id: item.id,
            nombre: item.nombre,
            descripcion: item.descripcion,
            idSubcategoria: item.idSubcategoria,
            subcategoria: itemSubcategoria
              ? {
                  id: itemSubcategoria.id,
                  nombre: itemSubcategoria.nombre,
                  idCategoria: itemSubcategoria.idCategoria,
                  categoria: itemSubcategoria.categoria
                    ? {
                        id: itemSubcategoria.categoria.id,
                        nombre: itemSubcategoria.categoria.nombre,
                      }
                    : null,
                }
              : null,
          }
        : null,
      subcategoria: subcategoria
        ? {
            id: subcategoria.id,
            nombre: subcategoria.nombre,
            idCategoria: subcategoria.idCategoria,
            categoria: subcategoria.categoria
              ? { id: subcategoria.categoria.id, nombre: subcategoria.categoria.nombre }
              : null,
          }
        : null,
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
                  bodega: stand.subBodega.bodega
                    ? {
                        id: stand.subBodega.bodega.id,
                        nombre: stand.subBodega.bodega.nombre,
                      }
                    : null,
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

/**
 * The column stores a relative path. Clients receive the API route that
 * streams the file. A legacy absolute URL is returned unchanged.
 */
function urlFotografiaPublica(elemento: Elemento) {
  const ruta = elemento.urlFotografia
  if (!ruta) {
    return null
  }

  if (/^https?:\/\//i.test(ruta)) {
    return ruta
  }

  if (ruta === `elementos/${elemento.id}/foto.webp`) {
    return `/api/v1/inventario/elementos/${elemento.id}/fotografia`
  }

  return null
}
