import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Guías del asistente. Cada fila es una hoja: título, módulo
 * y el paso a paso que después el bot puede leer.
 */
export default class extends BaseSchema {
  protected tableName = 'assistant_source'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id_source')

      table.string('titulo', 200).notNullable()
      table.string('modulo', 120).notNullable()
      table.text('contenido').notNullable()
      table.boolean('estado').notNullable().defaultTo(true)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
