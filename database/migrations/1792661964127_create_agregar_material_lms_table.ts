import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'agregar_material_lm'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id_agregar_material_lm')

      table
        .integer('id_programa_formacion')
        .unsigned()
        .notNullable()
        .references('id_programa_formacion')
        .inTable('programa_formacion')
        .onDelete('RESTRICT')

      table
        .integer('id_cformacion')
        .unsigned()
        .nullable()
        .references('id_cformacion')
        .inTable('c_formacion')
        .onDelete('RESTRICT')

      table
        .integer('id_elemento')
        .unsigned()
        .notNullable()
        .references('id_elemento')
        .inTable('elemento')
        .onDelete('RESTRICT')

      table.decimal('cantidad_base', 12, 2).notNullable().defaultTo(1)
      table.text('observaciones').nullable()

      table
        .integer('id_usuario_registro')
        .unsigned()
        .nullable()
        .references('id_usuario')
        .inTable('usuario')
        .onDelete('SET NULL')

      table.boolean('estado').notNullable().defaultTo(true)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}