import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * `codigo` (recurso.accion) becomes the natural key of a permission. It is
 * stable across databases, unlike the serial `id_permiso`, so it is what
 * `perfil_permiso` points at from the next migration onwards.
 */
export default class extends BaseSchema {
  protected tableName = 'permiso'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('codigo', 80).nullable()
    })

    this.defer(async (db) => {
      await db.rawQuery(
        `update permiso set codigo = recurso || '.' || accion where codigo is null`
      )
    })

    this.schema.alterTable(this.tableName, (table) => {
      table.string('codigo', 80).notNullable().alter()
      table.unique(['codigo'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropUnique(['codigo'])
      table.dropColumn('codigo')
    })
  }
}
