import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Clasificación del elemento leaves the fixed consumo/devolutivo check and
 * becomes its own catalog. Existing text values are copied across, then the
 * old column goes away.
 */
export default class extends BaseSchema {
  async up() {
    this.schema.createTable('clasificacion_elemento', (table) => {
      table.increments('id_clasificacion_elemento')
      table.string('nombre', 150).notNullable()
      table.boolean('estado').notNullable().defaultTo(true)
    })

    this.defer(async (db) => {
      await db.rawQuery(`
        CREATE UNIQUE INDEX uq_clasificacion_elemento_nombre
        ON clasificacion_elemento (lower(nombre))
      `)

      await db.rawQuery(`
        INSERT INTO clasificacion_elemento (nombre, estado)
        SELECT DISTINCT ON (lower(btrim(clasificacion))) btrim(clasificacion), true
        FROM elemento
        WHERE clasificacion IS NOT NULL AND btrim(clasificacion) <> ''
        ORDER BY lower(btrim(clasificacion)), btrim(clasificacion)
      `)

      await db.rawQuery(`ALTER TABLE elemento DROP CONSTRAINT IF EXISTS elemento_clasificacion_chk`)
      await db.rawQuery(`
        ALTER TABLE elemento
          ADD COLUMN id_clasificacion_elemento integer NULL
      `)
      await db.rawQuery(`
        UPDATE elemento AS e
        SET id_clasificacion_elemento = c.id_clasificacion_elemento
        FROM clasificacion_elemento AS c
        WHERE lower(c.nombre) = lower(btrim(e.clasificacion))
      `)
      await db.rawQuery(`ALTER TABLE elemento DROP COLUMN clasificacion`)
      await db.rawQuery(`
        ALTER TABLE elemento
          ADD CONSTRAINT elemento_id_clasificacion_elemento_fk
          FOREIGN KEY (id_clasificacion_elemento)
          REFERENCES clasificacion_elemento (id_clasificacion_elemento)
          ON UPDATE CASCADE
          ON DELETE RESTRICT
      `)
    })
  }

  async down() {
    this.defer(async (db) => {
      await db.rawQuery(`ALTER TABLE elemento ADD COLUMN clasificacion varchar(150) NULL`)
      await db.rawQuery(`
        UPDATE elemento AS e
        SET clasificacion = c.nombre
        FROM clasificacion_elemento AS c
        WHERE c.id_clasificacion_elemento = e.id_clasificacion_elemento
      `)
      await db.rawQuery(`
        ALTER TABLE elemento DROP CONSTRAINT IF EXISTS elemento_id_clasificacion_elemento_fk
      `)
      await db.rawQuery(`ALTER TABLE elemento DROP COLUMN IF EXISTS id_clasificacion_elemento`)
      await db.rawQuery(`DROP TABLE IF EXISTS clasificacion_elemento`)
    })
  }
}
