import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Modulo from '#models/modulo'
import Perfil from '#models/perfil'
import User from '#models/usuario'
import RoleService from '#services/role_service'
import PermissionSeeder from '#database/seeders/permission_seeder'

export const INSTRUCTOR_PROFILE_NAME = 'Instructor'

/**
 * Pide material y equipo para una obra. No entrega ni registra devoluciones:
 * eso lo hace Admin bodega cuando recibe el equipo. Tampoco ve las alertas de
 * stock, que son de bodega.
 */
export const INSTRUCTOR_PERMISSIONS = [
  'obra.ver',
  'elemento.ver',
  'clasificacion_elemento.ver',
  'solicitud_material.ver',
  'solicitud_material.crear',
  'solicitud_equipo.ver',
  'solicitud_equipo.crear',
] as const

const DEMO_USER = {
  nombres: 'Camilo',
  apellidos: 'Instructor',
  tipoDocumento: 'CC',
  numeroDocumento: '1001001005',
  email: 'instructor@correo.com',
  password: '123456',
  idCformacion: 1,
}

/**
 * Safe to run again. Permissions are reset to this set. An existing demo
 * account keeps its password and is attached to the Instructor profile.
 */
export default class extends BaseSeeder {
  async run() {
    await new PermissionSeeder(this.client).run()

    const perfil = await this.perfil()
    await this.usuarioDemo(perfil)
  }

  private async perfil() {
    let perfil = await Perfil.query().where('nombre', INSTRUCTOR_PROFILE_NAME).first()

    if (!perfil) {
      perfil = await Perfil.create({
        nombre: INSTRUCTOR_PROFILE_NAME,
        descripcion: 'Pide materiales y equipos para una obra del centro',
        estado: true,
      })
    } else {
      perfil.descripcion = 'Pide materiales y equipos para una obra del centro'
      await perfil.save()
    }

    const inventario = await Modulo.query().where('nombre', 'Inventario').firstOrFail()
    const roles = new RoleService()
    await roles.assignModules(perfil.id, [inventario.id])
    await roles.assignPermissions(perfil.id, [...INSTRUCTOR_PERMISSIONS])

    return perfil
  }

  private async usuarioDemo(perfil: Perfil) {
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
