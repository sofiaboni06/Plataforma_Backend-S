import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Standardized UNSPSC codes (hoja CODIGOS). An elemento picks one when it
 * is created; many stock rows can share the same code.
 */
export default class extends BaseSchema {
  protected tableName = 'codigo_estandar'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id_codigo_estandar')
      table.string('codigo', 20).notNullable().unique()
      table.string('nombre', 200).notNullable()
    })

    this.schema.alterTable('elemento', (table) => {
      table
        .integer('id_codigo_estandar')
        .nullable()
        .references('id_codigo_estandar')
        .inTable(this.tableName)
        .onUpdate('CASCADE')
        .onDelete('RESTRICT')
    })
  }

  async down() {
    this.schema.alterTable('elemento', (table) => {
      table.dropColumn('id_codigo_estandar')
    })

    this.schema.dropTable(this.tableName)
  }
}
