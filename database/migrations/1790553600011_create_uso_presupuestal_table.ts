import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Uso presupuestal de la ficha (hoja FICHAS TECNICAS). Catálogo aparte del
 * código UNSPSC: el elemento elige de qué partida salió la plata.
 */
export default class extends BaseSchema {
  protected tableName = 'uso_presupuestal'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id_uso_presupuestal')
      table.string('nombre', 200).notNullable()
      table.boolean('estado').notNullable().defaultTo(true)
    })

    this.schema.alterTable('elemento', (table) => {
      table
        .integer('id_uso_presupuestal')
        .nullable()
        .references('id_uso_presupuestal')
        .inTable(this.tableName)
        .onUpdate('CASCADE')
        .onDelete('RESTRICT')
    })

    this.defer(async (db) => {
      await db.rawQuery(`
        CREATE UNIQUE INDEX uq_uso_presupuestal_nombre
        ON uso_presupuestal (lower(nombre))
      `)
    })
  }

  async down() {
    this.defer(async (db) => {
      await db.rawQuery(`DROP INDEX IF EXISTS uq_uso_presupuestal_nombre`)
    })

    this.schema.alterTable('elemento', (table) => {
      table.dropColumn('id_uso_presupuestal')
    })

    this.schema.dropTable(this.tableName)
  }
}
