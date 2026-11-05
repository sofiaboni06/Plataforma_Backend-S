import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Un programa puede cargarse con nombre y fichas antes de que el centro
 * le asigne red, línea temática y nivel. Esas tres quedan vacías y se
 * completan después por el mismo formulario de edición.
 */
export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      await db.rawQuery(`
        ALTER TABLE public.programa_formacion
          ALTER COLUMN id_red_conocimiento DROP NOT NULL,
          ALTER COLUMN id_linea_tematica DROP NOT NULL,
          ALTER COLUMN id_nivel_programa DROP NOT NULL
      `)
    })
  }

  async down() {
    this.defer(async (db) => {
      await db.rawQuery(`
        ALTER TABLE public.programa_formacion
          ALTER COLUMN id_red_conocimiento SET NOT NULL,
          ALTER COLUMN id_linea_tematica SET NOT NULL,
          ALTER COLUMN id_nivel_programa SET NOT NULL
      `)
    })
  }
}
