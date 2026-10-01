import type User from '#models/usuario'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class UserTransformer extends BaseTransformer<User> {
  constructor(
    user: User,
    private permissions: string[] = [],
    private isAdmin: boolean = false
  ) {
    super(user)
  }

  toObject() {
    const trainingCenter = this.resource.trainingCenter
    const regional = trainingCenter?.regional
    const roleName = this.resource.perfil?.nombre ?? ''
    const bodegas = this.resource.bodegas ?? []

    return {
      id: this.resource.id,
      fullName: this.resource.fullName,
      roleLabel: roleName,
      location: [trainingCenter?.nombre, regional?.nombre].filter(Boolean).join(' — '),
      avatarUrl: '',
      documentType: this.resource.tipoDocumento,
      documentId: this.resource.numeroDocumento,
      email: this.resource.email,
      phone: '',
      address: '',
      trainingCenter: trainingCenter?.nombre ?? '',
      trainingCenterId: this.resource.idCformacion,
      regional: regional?.nombre ?? '',
      groupCode: '',
      role: roleName,
      initials: this.resource.initials,
      isAdmin: this.isAdmin,
      permissions: this.permissions,
      bodegaIds: bodegas.map((bodega) => bodega.id),
      bodegas: bodegas.map((bodega) => ({
        id: bodega.id,
        name: bodega.nombre,
      })),
    }
  }
}
