import { BaseTransformer } from '@adonisjs/core/transformers'
import type RedConocimiento from '#models/red_conocimiento'

export default class RedConocimientoTransformer extends BaseTransformer<RedConocimiento> {
  toObject() {
    const lineas = this.resource.lineasTematicas ?? []

    return {
      id: this.resource.id,
      nombre: this.resource.nombre,
      nombreGestor: this.resource.nombreGestor,
      telGestor: this.resource.telGestor,
      mailGestor: this.resource.mailGestor,
      nombreAsesor: this.resource.nombreAsesor,
      telAsesor: this.resource.telAsesor,
      mailAsesor: this.resource.mailAsesor,
      estado: this.resource.estado,
      lineaIds: lineas.map((linea) => linea.id),
      lineasTematicas: lineas.map((linea) => ({
        id: linea.id,
        nombre: linea.nombre,
        estado: linea.estado,
      })),
    }
  }
}
