import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Swaps the link of `perfil_permiso` from the serial `id_permiso` to the
 * `codigo` natural key. Rows already granted are translated in place, so the
 * permissions a profile has today survive the change.
 */
export default class extends BaseSchema {
  protected tableName = 'perfil_permiso'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('codigo', 80).nullable()
    })

    this.defer(async (db) => {
      await db.rawQuery(`
        update perfil_permiso pp
        set codigo = p.codigo
        from permiso p
        where p.id_permiso = pp.id_permiso and pp.codigo is null
      `)

      // A row that cannot be translated points at a permission that no longer
      // exists, so it never granted anything anyway.
      await db.rawQuery(`delete from perfil_permiso where codigo is null`)
    })

    // Dropping the column also drops its foreign key and the
    // unique(id_perfil, id_permiso) constraint that depends on it.
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('id_permiso')
    })

    this.schema.alterTable(this.tableName, (table) => {
      table.string('codigo', 80).notNullable().alter()
      table.foreign('codigo').references('codigo').inTable('permiso').onDelete('CASCADE')
      table.unique(['id_perfil', 'codigo'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('id_permiso').nullable().references('id_permiso').inTable('permiso')
    })

    this.defer(async (db) => {
      await db.rawQuery(`
        update perfil_permiso pp
        set id_permiso = p.id_permiso
        from permiso p
        where p.codigo = pp.codigo and pp.id_permiso is null
      `)

      await db.rawQuery(`delete from perfil_permiso where id_permiso is null`)
    })

    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('codigo')
    })

    this.schema.alterTable(this.tableName, (table) => {
      table.integer('id_permiso').notNullable().alter()
      table.unique(['id_perfil', 'id_permiso'])
    })
  }
}
