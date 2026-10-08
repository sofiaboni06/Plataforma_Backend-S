import { BaseTransformer } from '@adonisjs/core/transformers'
import type Entrega from '#models/entrega'
import { cantidadesDe, entregaJson, persona } from '#transformers/solicitud_transformer'

/**
 * Una salida de bodega con la fila de solicitud a la que pertenece: qué se
 * entregó, a quién, para qué obra y cuánto le queda pendiente.
 */
export default class EntregaTransformer extends BaseTransformer<Entrega> {
  toObject() {
    const material = this.resource.solicitudMaterial
    const tipo = material ? 'material' : 'equipo'
    const solicitud = material ?? this.resource.solicitudEquipo
    const elemento = solicitud?.elemento
    const obra = solicitud?.obra

    return {
      ...entregaJson(this.resource),
      tipo,
      solicitud: solicitud
        ? {
            id: solicitud.id,
            codigoSolicitud: solicitud.codigoSolicitud,
            estado: solicitud.estado,
            ...cantidadesDe(solicitud, tipo),
            usuario: persona(solicitud.usuario),
            elemento: elemento
              ? { id: elemento.id, nombre: elemento.nombre, codigo: elemento.codigo }
              : null,
            obra: obra ? { id: obra.id, nombre: obra.nombre, lugar: obra.lugar } : null,
          }
        : null,
    }
  }
}
