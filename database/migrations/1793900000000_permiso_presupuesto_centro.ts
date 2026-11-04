import { BaseSchema } from '@adonisjs/lucid/schema'
import PermissionService from '#services/permission_service'

/**
 * Deja en Perfiles los permisos de presupuesto del centro.
 * Quien ya era subdirectora los recibe; el administrador no.
 */
export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      await new PermissionService().syncFromCatalog()
      await db.rawQuery(`
        insert into perfil_permiso (id_perfil, codigo, estado)
        select pf.id_perfil, codigo.codigo, true
        from perfil pf
        cross join (values ('presupuesto.ver'), ('presupuesto.editar')) as codigo(codigo)
        where pf.nombre ~* '^subdirector'
          and not exists (
            select 1
            from perfil_permiso ya
            where ya.id_perfil = pf.id_perfil
              and ya.codigo = codigo.codigo
          )
      `)
    })
  }

  async down() {}
}
