import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'usuario_bodega'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id_usuario_bodega')

      table
        .integer('id_usuario')
        .notNullable()
        .references('id_usuario')
        .inTable('usuario')
        .onDelete('CASCADE')

      table
        .integer('id_bodega')
        .notNullable()
        .references('id_bodega')
        .inTable('bodega')
        .onDelete('CASCADE')

      table.boolean('estado').notNullable().defaultTo(true)

      table.unique(['id_usuario', 'id_bodega'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
