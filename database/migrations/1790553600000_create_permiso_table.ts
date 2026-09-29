import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'permiso'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id_permiso')

      table
        .integer('id_modulo')
        .notNullable()
        .references('id_modulo')
        .inTable('modulo')
        .onDelete('CASCADE')

      table.string('recurso', 50).notNullable()
      table.string('accion', 20).notNullable()
      table.string('nombre', 120).notNullable()
      table.boolean('estado').notNullable().defaultTo(true)

      table.unique(['recurso', 'accion'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
