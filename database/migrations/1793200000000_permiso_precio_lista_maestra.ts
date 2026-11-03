import { BaseSchema } from '@adonisjs/lucid/schema'
import PermissionService from '#services/permission_service'

/**
 * El catálogo es la fuente. Esta migración no crea tablas: escribe la fila
 * `precio_lista_maestra.editar` en `permiso` para que Perfiles la muestre
 * sin depender de correr el seeder a mano.
 *
 * Quien ya editaba la lista conserva el precio. Compras no.
 */
export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      await new PermissionService().syncFromCatalog()
      await db.rawQuery(`
        insert into perfil_permiso (id_perfil, codigo, estado)
        select pp.id_perfil, 'precio_lista_maestra.editar', true
        from perfil_permiso pp
        join perfil pf on pf.id_perfil = pp.id_perfil
        where pp.codigo = 'lista_maestra.editar'
          and pp.estado = true
          and pf.nombre <> 'Compras'
          and not exists (
            select 1
            from perfil_permiso ya
            where ya.id_perfil = pp.id_perfil
              and ya.codigo = 'precio_lista_maestra.editar'
          )
      `)
      await db.rawQuery(`
        delete from perfil_permiso pp
        using perfil pf
        where pf.id_perfil = pp.id_perfil
          and pf.nombre = 'Compras'
          and pp.codigo in ('solicitud_programa.ver', 'proceso_compra.editar')
      `)
    })
  }

  async down() {}
}
