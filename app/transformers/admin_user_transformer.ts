import type User from '#models/usuario'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class AdminUserTransformer extends BaseTransformer<User> {
  toObject() {
    const trainingCenter = this.resource.trainingCenter
    const regional = trainingCenter?.regional
    const roleName = this.resource.perfil?.nombre ?? ''

    return {
      id: this.resource.id,
      fullName: this.resource.fullName,
      nombres: this.resource.nombres,
      apellidos: this.resource.apellidos,
      documentType: this.resource.tipoDocumento,
      documentId: this.resource.numeroDocumento,
      email: this.resource.email,
      role: roleName,
      roleId: this.resource.idPerfil,
      trainingCenter: trainingCenter?.nombre ?? '',
      trainingCenterId: this.resource.idCformacion,
      location: [trainingCenter?.nombre, regional?.nombre].filter(Boolean).join(' — '),
      active: this.resource.estado,
      bodegaIds: (this.resource.bodegas ?? []).map((bodega) => bodega.id),
      bodegas: (this.resource.bodegas ?? []).map((bodega) => ({
        id: bodega.id,
        name: bodega.nombre,
      })),
    }
  }
}
