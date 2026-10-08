import { BaseTransformer } from '@adonisjs/core/transformers'
import type { Solicitante } from '#services/solicitud_service'

/**
 * Lo que bodega necesita ver para confirmar a quién le registra la solicitud
 * y qué tipo de solicitud puede llevar.
 */
export default class SolicitanteTransformer extends BaseTransformer<Solicitante> {
  toObject() {
    const usuario = this.resource.usuario

    return {
      id: usuario.id,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      tipoDocumento: usuario.tipoDocumento,
      numeroDocumento: usuario.numeroDocumento,
      email: usuario.email,
      activo: usuario.estado,
      puedeConsumo: this.resource.puedeConsumo,
      puedeDevolutivo: this.resource.puedeDevolutivo,
    }
  }
}
