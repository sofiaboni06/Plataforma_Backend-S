import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Sub-bodega sits between the training-center bodega and the stand.
 * Madera, cerámica and the rest are sub-bodegas; stands stay inside one of them.
 * Existing stands move under a "General" sub-bodega of their current bodega.
 */
export default class extends BaseSchema {
  protected tableName = 'sub_bodega'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id_sub_bodega')
      table
        .integer('id_bodega')
        .notNullable()
        .references('id_bodega')
        .inTable('bodega')
        .onUpdate('CASCADE')
        .onDelete('RESTRICT')
      table.string('nombre', 150).notNullable()
      table.boolean('estado').notNullable().defaultTo(true)
      table.unique(['id_bodega', 'nombre'])
    })

    this.schema.alterTable('stand', (table) => {
      table
        .integer('id_sub_bodega')
        .nullable()
        .references('id_sub_bodega')
        .inTable(this.tableName)
        .onUpdate('CASCADE')
        .onDelete('RESTRICT')
    })

    this.defer(async (db) => {
      await db.rawQuery(`
        INSERT INTO sub_bodega (id_bodega, nombre, estado)
        SELECT DISTINCT id_bodega, 'General', true
        FROM stand
      `)
      await db.rawQuery(`
        UPDATE stand AS s
        SET id_sub_bodega = sb.id_sub_bodega
        FROM sub_bodega AS sb
        WHERE sb.id_bodega = s.id_bodega
          AND sb.nombre = 'General'
      `)
      await db.rawQuery(`ALTER TABLE stand DROP CONSTRAINT IF EXISTS uq_stand_bodega_nombre`)
      await db.rawQuery(`ALTER TABLE stand DROP CONSTRAINT IF EXISTS fk_stand_bodega`)
      await db.rawQuery(`ALTER TABLE stand DROP COLUMN id_bodega CASCADE`)
      await db.rawQuery(`ALTER TABLE stand ALTER COLUMN id_sub_bodega SET NOT NULL`)
      await db.rawQuery(`
        ALTER TABLE stand
          ADD CONSTRAINT uq_stand_sub_bodega_nombre UNIQUE (id_sub_bodega, nombre)
      `)
    })
  }

  async down() {
    this.schema.alterTable('stand', (table) => {
      table
        .integer('id_bodega')
        .nullable()
        .references('id_bodega')
        .inTable('bodega')
        .onUpdate('CASCADE')
        .onDelete('RESTRICT')
    })

    this.defer(async (db) => {
      await db.rawQuery(`ALTER TABLE stand DROP CONSTRAINT IF EXISTS uq_stand_sub_bodega_nombre`)
      await db.rawQuery(`
        UPDATE stand AS s
        SET id_bodega = sb.id_bodega
        FROM sub_bodega AS sb
        WHERE sb.id_sub_bodega = s.id_sub_bodega
      `)
      await db.rawQuery(`ALTER TABLE stand ALTER COLUMN id_bodega SET NOT NULL`)
      await db.rawQuery(`
        ALTER TABLE stand
          ADD CONSTRAINT uq_stand_bodega_nombre UNIQUE (id_bodega, nombre)
      `)
      await db.rawQuery(`ALTER TABLE stand DROP COLUMN id_sub_bodega CASCADE`)
      await db.rawQuery(`DROP TABLE IF EXISTS sub_bodega`)
    })
  }
}
