import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * La lista maestra de formación no comparte filas con el inventario.
 * `elemento` es stock de bodega; el anexo SENA vive solo en
 * `lista_maestra_material` (UNSPSC + producto + cantidad base).
 */
export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      await db.rawQuery(`
        ALTER TABLE public.lista_maestra_material
          DROP CONSTRAINT IF EXISTS uq_programa_elemento
      `)
      await db.rawQuery(`
        ALTER TABLE public.lista_maestra_material
          DROP CONSTRAINT IF EXISTS fk_lm_elemento
      `)
      await db.rawQuery(`
        ALTER TABLE public.lista_maestra_material
          DROP COLUMN IF EXISTS id_elemento CASCADE
      `)
    })
  }

  async down() {
    this.defer(async (db) => {
      await db.rawQuery(`
        ALTER TABLE public.lista_maestra_material
          ADD COLUMN IF NOT EXISTS id_elemento INTEGER
            REFERENCES public.elemento(id_elemento) ON UPDATE CASCADE ON DELETE RESTRICT
      `)
    })
  }
}
