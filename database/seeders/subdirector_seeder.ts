import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Modulo from '#models/modulo'
import Perfil from '#models/perfil'
import User from '#models/usuario'
import RoleService from '#services/role_service'
import PermissionSeeder from '#database/seeders/permission_seeder'

const EMAIL = 'subdirector@correo.com'
const PERFIL = 'Subdirectora'

const PERMISOS = [
  'vigencia.ver',
  'programa_formacion.ver',
  'solicitud_programa.ver',
  'solicitud_programa.editar',
] as const

export default class extends BaseSeeder {
  async run() {
    await new PermissionSeeder(this.client).run()

    const descripcion = 'Asigna el monto único del centro en cada vigencia.'
    let perfil = await Perfil.query().where('nombre', PERFIL).first()
    if (!perfil) {
      perfil = await Perfil.create({ nombre: PERFIL, descripcion, estado: true })
    }

    const formacion = await Modulo.query().where('nombre', 'Materiales de Formación').firstOrFail()
    const roles = new RoleService()
    await roles.assignModules(perfil.id, [formacion.id])
    await roles.assignPermissions(perfil.id, [...PERMISOS])

    const user = await User.query().where('email', EMAIL).first()
    if (!user) {
      await User.create({
        nombres: 'Andrea',
        apellidos: 'Subdirectora',
        tipoDocumento: 'CC',
        numeroDocumento: '1001001008',
        email: EMAIL,
        password: '123456',
        idPerfil: perfil.id,
        idCformacion: 1,
        estado: true,
      })
      return
    }

    user.idPerfil = perfil.id
    user.estado = true
    await user.save()
  }
}
