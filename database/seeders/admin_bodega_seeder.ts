import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { buildPermissionCatalog } from '#data/permission_catalog'
import Bodega from '#models/bodega'
import Modulo from '#models/modulo'
import Perfil from '#models/perfil'
import User from '#models/usuario'
import RoleService from '#services/role_service'
import PermissionSeeder from '#database/seeders/permission_seeder'

export const ADMIN_BODEGA_PROFILE_NAME = 'Admin bodega'

const DEMO_USER = {
  nombres: 'Andrea',
  apellidos: 'Bodega',
  tipoDocumento: 'CC',
  numeroDocumento: '1001001004',
  email: 'adminbodega@correo.com',
  password: '123456',
  idCformacion: 1,
}

const SIN_BODEGA = new Set(['bodega.crear', 'bodega.eliminar'])

/**
 * Admin bodega: every inventory permission except creating or deleting a
 * bodega. The general admin creates the bodega and assigns it on the user.
 * The demo account keeps a single bodega of its center.
 *
 * Safe to run again. The permission list is reset to this set. A demo account
 * that already has exactly one bodega is left alone.
 */
export default class extends BaseSeeder {
  async run() {
    await new PermissionSeeder(this.client).run()

    const perfil = await this.perfil()
    await this.usuarioDemo(perfil)
  }

  private async perfil() {
    let perfil = await Perfil.query().where('nombre', ADMIN_BODEGA_PROFILE_NAME).first()

    if (!perfil) {
      perfil = await Perfil.create({
        nombre: ADMIN_BODEGA_PROFILE_NAME,
        descripcion: 'Inventario de la bodega que el administrador le asigna',
        estado: true,
      })
    } else {
      perfil.descripcion = 'Inventario de la bodega que el administrador le asigna'
      await perfil.save()
    }

    const inventario = await Modulo.query().where('nombre', 'Inventario').firstOrFail()
    const codes = buildPermissionCatalog()
      .filter((definition) => definition.module === 'Inventario')
      .map((definition) => definition.code)
      .filter((code) => !SIN_BODEGA.has(code))

    const roles = new RoleService()
    await roles.assignModules(perfil.id, [inventario.id])
    await roles.assignPermissions(perfil.id, codes)

    return perfil
  }

  private async usuarioDemo(perfil: Perfil) {
    const bodega = await Bodega.query()
      .where('id_cformacion', DEMO_USER.idCformacion)
      .where('estado', true)
      .orderBy('id_bodega', 'asc')
      .first()

    let user = await User.query().where('email', DEMO_USER.email).first()
    if (!user) {
      user = await User.create({ ...DEMO_USER, idPerfil: perfil.id, estado: true })
    }

    if (!bodega) {
      return
    }

    const assigned = await user.related('bodegas').query().orderBy('id_bodega', 'asc')
    if (assigned.length === 1) {
      return
    }

    const keep = assigned[0] ?? bodega
    await user.related('bodegas').sync({ [keep.id]: { estado: true } })
  }
}
