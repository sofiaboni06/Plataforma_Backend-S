import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Modulo from '#models/modulo'
import Perfil from '#models/perfil'
import User from '#models/usuario'
import RoleService from '#services/role_service'
import PermissionSeeder from '#database/seeders/permission_seeder'

export const COMPRAS_PROFILE_NAME = 'Compras'

export const COMPRAS_PERMISSIONS = [
  'programa_formacion.ver',
  'lista_maestra.ver',
  'lista_maestra.crear',
  'lista_maestra.editar',
  'lista_maestra.eliminar',
  'vigencia.ver',
  'solicitud_programa.ver',
  'proceso_compra.ver',
  'proceso_compra.crear',
  'proceso_compra.editar',
] as const

const DEMO_USER = {
  nombres: 'Pablo',
  apellidos: 'Compras',
  tipoDocumento: 'CC',
  numeroDocumento: '1001001007',
  email: 'compras@correo.com',
  password: '123456',
  idCformacion: 1,
}

export default class extends BaseSeeder {
  async run() {
    await new PermissionSeeder(this.client).run()

    let perfil = await Perfil.query().where('nombre', COMPRAS_PROFILE_NAME).first()
    if (!perfil) {
      perfil = await Perfil.create({
        nombre: COMPRAS_PROFILE_NAME,
        descripcion: 'Unifica solicitudes aprobadas y genera procesos de compra',
        estado: true,
      })
    }

    const formacion = await Modulo.query().where('nombre', 'Materiales de Formación').firstOrFail()
    const roles = new RoleService()
    await roles.assignModules(perfil.id, [formacion.id])
    await roles.assignPermissions(perfil.id, [...COMPRAS_PERMISSIONS])

    const user = await User.query().where('email', DEMO_USER.email).first()
    if (!user) {
      await User.create({ ...DEMO_USER, idPerfil: perfil.id, estado: true })
      return
    }
    if (user.idPerfil !== perfil.id) {
      user.idPerfil = perfil.id
      await user.save()
    }
  }
}
