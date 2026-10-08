import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * El carácter (consumo o devolutivo) pasa a ser de cada elemento.
 *
 * Dentro de una misma clasificación hay de los dos: en ELEMENTO DE ASEO la
 * escoba se presta y se devuelve, los guantes desechables se gastan. La
 * clasificación queda solo como sugerencia al crear el elemento.
 *
 * - Cada elemento hereda el carácter de su clasificación actual.
 * - Los que no tienen clasificación quedan en NULL: bodega les asigna tipo y
 *   clasificación desde la pantalla de Elementos. Mientras tanto no se pueden
 *   pedir. Si no queda ninguno en NULL, la columna se vuelve NOT NULL.
 */
export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      await db.rawQuery(`
        ALTER TABLE elemento
          ADD COLUMN IF NOT EXISTS caracter varchar(20) NULL
      `)
      await db.rawQuery(`
        UPDATE elemento AS e
        SET caracter = ce.caracter
        FROM clasificacion_elemento AS ce
        WHERE ce.id_clasificacion_elemento = e.id_clasificacion_elemento
          AND e.caracter IS NULL
      `)
      await db.rawQuery(`ALTER TABLE elemento DROP CONSTRAINT IF EXISTS elemento_caracter_chk`)
      await db.rawQuery(`
        ALTER TABLE elemento
          ADD CONSTRAINT elemento_caracter_chk
          CHECK (caracter IN ('consumo', 'devolutivo'))
      `)

      const sinTipo = await db.rawQuery(
        `SELECT count(*)::int AS total FROM elemento WHERE caracter IS NULL`
      )

      if (Number(sinTipo.rows[0]?.total ?? 0) === 0) {
        await db.rawQuery(`ALTER TABLE elemento ALTER COLUMN caracter SET NOT NULL`)
      }
    })
  }

  async down() {
    this.defer(async (db) => {
      await db.rawQuery(`ALTER TABLE elemento DROP CONSTRAINT IF EXISTS elemento_caracter_chk`)
      await db.rawQuery(`ALTER TABLE elemento DROP COLUMN IF EXISTS caracter`)
    })
  }
}
