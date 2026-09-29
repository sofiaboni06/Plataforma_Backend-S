import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'perfil_permiso'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id_perfil_permiso')

      table
        .integer('id_perfil')
        .notNullable()
        .references('id_perfil')
        .inTable('perfil')
        .onDelete('CASCADE')

      table
        .integer('id_permiso')
        .notNullable()
        .references('id_permiso')
        .inTable('permiso')
        .onDelete('CASCADE')

      table.boolean('estado').notNullable().defaultTo(true)

      table.unique(['id_perfil', 'id_permiso'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
