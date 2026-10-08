import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'password_reset_codes'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('id_usuario')
        .unsigned()
        .references('id_usuario')
        .inTable('usuario')
        .onDelete('CASCADE')
        .notNullable()

      table.string('correo', 150).notNullable()

      table.string('codigo_hash', 255).notNullable()

      table.timestamp('expira_en').notNullable()

      table.timestamp('usado_en').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('id_usuario')
      table.dropColumn('correo')
      table.dropColumn('codigo_hash')
      table.dropColumn('expira_en')
      table.dropColumn('usado_en')
    })
  }
}