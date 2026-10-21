import { BaseTransformer } from '@adonisjs/core/transformers'
import type ListaMaestraMaterial from '#models/lista_maestra_material'
import type ProgramaFormacion from '#models/programa_formacion'
import type Elemento from '#models/elemento'
import type SolicitudMaterialFormacion from '#models/solicitud_material_formacion'

/**
 * Presenta un material de formación con su programa y su elemento (el
 * elemento aporta nombre, código y unidad de medida, los mismos datos con los
 * que se busca en inventario).
 */
export default class MaterialFormacionTransformer extends BaseTransformer<ListaMaestraMaterial> {
  toObject() {
    const programa = this.resource.programa
    const elemento = this.resource.elemento
    const unidadMedida = elemento?.unidadMedida

    return {
      id: this.resource.id,
      idPrograma: this.resource.idProgramaFormacion,
      idElemento: this.resource.idElemento,
      cantidadBase: Number(this.resource.cantidadBase),
      observaciones: this.resource.observaciones,
      estado: this.resource.estado,
      createdAt: this.resource.createdAt,
      updatedAt: this.resource.updatedAt,
      programa: programa
        ? {
            id: programa.id,
            codigo: programa.codigo,
            nombre: programa.nombre,
            version: programa.version,
            estado: programa.estado,
          }
        : null,
      elemento: elemento
        ? {
            id: elemento.id,
            nombre: elemento.nombre,
            codigo: elemento.codigo,
            estado: elemento.estado,
            // El front resuelve la URL pública con fotoUrlDelElemento.
            urlFotografia: elemento.urlFotografia ?? null,
            unidadMedida: unidadMedida
              ? {
                  id: unidadMedida.id,
                  nombre: unidadMedida.nombre,
                  abreviatura: unidadMedida.abreviatura,
                }
              : null,
          }
        : null,
    }
  }
}

/**
 * Opción del selector de programas del formulario (solo programas activos).
 */
export class ProgramaOpcionTransformer extends BaseTransformer<ProgramaFormacion> {
  toObject() {
    return {
      id: this.resource.id,
      codigo: this.resource.codigo,
      nombre: this.resource.nombre,
      version: this.resource.version,
    }
  }
}

/**
 * Opción del selector de elementos: identificación global (nombre, código,
 * marca, tipo, unidad) sin stock ni ubicación, porque materiales de
 * formación no es inventario.
 */
export class ElementoOpcionTransformer extends BaseTransformer<Elemento> {
  toObject() {
    const unidadMedida = this.resource.unidadMedida
    const clasificacion = this.resource.clasificacion

    return {
      id: this.resource.id,
      nombre: this.resource.nombre,
      codigo: this.resource.codigo,
      estado: this.resource.estado,
      // Identificación del material solicitado: datos del propio elemento
      // (marca y tipo cuando existen), no stock de inventario.
      marca: this.resource.marca ?? null,
      clasificacion: clasificacion
        ? { id: clasificacion.id, nombre: clasificacion.nombre }
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
 * Solicitud de material de formación: pide un material de la lista maestra
 * de un programa. Trae programa, elemento (con marca y tipo) y quién la
 * pidió; no lleva stock ni ubicación porque no es inventario.
 */
export class SolicitudMaterialFormacionTransformer extends BaseTransformer<SolicitudMaterialFormacion> {
  toObject() {
    const material = this.resource.material
    const programa = material?.programa ?? null
    const elemento = material?.elemento ?? null
    const unidadMedida = elemento?.unidadMedida ?? null
    const clasificacion = elemento?.clasificacion ?? null
    const usuario = this.resource.usuario

    return {
      id: this.resource.id,
      idMaterial: this.resource.idListaMaestra,
      idPrograma: programa?.id ?? null,
      idElemento: elemento?.id ?? null,
      cantidadSolicitada: Number(this.resource.cantidadSolicitada),
      observaciones: this.resource.observaciones,
      estado: this.resource.estado,
      createdAt: this.resource.createdAt,
      updatedAt: this.resource.updatedAt,
      solicitante: usuario ? `${usuario.nombres} ${usuario.apellidos}` : null,
      programa: programa
        ? {
            id: programa.id,
            codigo: programa.codigo,
            nombre: programa.nombre,
            version: programa.version,
            estado: programa.estado,
          }
        : null,
      elemento: elemento
        ? {
            id: elemento.id,
            nombre: elemento.nombre,
            codigo: elemento.codigo,
            estado: elemento.estado,
            urlFotografia: elemento.urlFotografia ?? null,
            marca: elemento.marca ?? null,
            clasificacion: clasificacion ? { id: clasificacion.id, nombre: clasificacion.nombre } : null,
            unidadMedida: unidadMedida
              ? {
                  id: unidadMedida.id,
                  nombre: unidadMedida.nombre,
                  abreviatura: unidadMedida.abreviatura,
                }
              : null,
          }
        : null,
    }
  }
}
