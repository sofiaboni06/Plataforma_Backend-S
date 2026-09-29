import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * The item becomes the catalog card (name, subcategory, description).
 * Stock numbers stay on elemento: gramaje is new, and each stock row can
 * point at the item it belongs to.
 *
 * Old serial rows keep their columns, but those columns are no longer required.
 * Their name is filled from the parent elemento plus the serial so the
 * partial unique index can be created.
 */
export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('item', (table) => {
      table.string('nombre', 150).nullable()
      table.text('descripcion').nullable()
      table
        .integer('id_subcategoria')
        .nullable()
        .references('id_subcategoria')
        .inTable('subcategoria')
        .onUpdate('CASCADE')
        .onDelete('RESTRICT')
    })

    this.defer(async (db) => {
      await db.rawQuery(`
        UPDATE item AS i
        SET nombre = e.nombre || ' ' || i.numero_serial,
            descripcion = e.descripcion_tecnica,
            id_subcategoria = e.id_subcategoria
        FROM elemento AS e
        WHERE e.id_elemento = i.id_elemento
          AND i.nombre IS NULL
      `)

      await db.rawQuery(`ALTER TABLE item ALTER COLUMN nombre SET NOT NULL`)
      await db.rawQuery(`ALTER TABLE item ALTER COLUMN id_subcategoria SET NOT NULL`)
      await db.rawQuery(`ALTER TABLE item ALTER COLUMN numero_serial DROP NOT NULL`)
      await db.rawQuery(`ALTER TABLE item ALTER COLUMN id_elemento DROP NOT NULL`)

      await db.rawQuery(`
        CREATE UNIQUE INDEX IF NOT EXISTS uq_item_subcategoria_nombre_activo
        ON item (id_subcategoria, nombre)
        WHERE estado IS DISTINCT FROM false
      `)
    })

    this.schema.alterTable('elemento', (table) => {
      table.decimal('gramaje', 10, 2).nullable()
      table
        .integer('id_item')
        .nullable()
        .references('id_item')
        .inTable('item')
        .onUpdate('CASCADE')
        .onDelete('RESTRICT')
    })
  }

  async down() {
    this.schema.alterTable('elemento', (table) => {
      table.dropColumn('id_item')
      table.dropColumn('gramaje')
    })

    this.defer(async (db) => {
      await db.rawQuery(`DROP INDEX IF EXISTS uq_item_subcategoria_nombre_activo`)
      await db.rawQuery(`DELETE FROM item WHERE id_elemento IS NULL`)
      await db.rawQuery(`ALTER TABLE item ALTER COLUMN numero_serial SET NOT NULL`)
      await db.rawQuery(`ALTER TABLE item ALTER COLUMN id_elemento SET NOT NULL`)
    })

    this.schema.alterTable('item', (table) => {
      table.dropColumn('descripcion')
      table.dropColumn('nombre')
      table.dropColumn('id_subcategoria')
    })
  }
}
