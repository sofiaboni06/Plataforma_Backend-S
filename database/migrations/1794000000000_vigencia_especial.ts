import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      await db.rawQuery(`
        CREATE TABLE IF NOT EXISTS public.vigencia_especial (
          id_vigencia_especial SERIAL PRIMARY KEY,
          anio INTEGER NOT NULL REFERENCES public.vigencia(anio) ON UPDATE CASCADE ON DELETE RESTRICT,
          id_cformacion INTEGER NOT NULL REFERENCES public.c_formacion(id_cformacion) ON UPDATE CASCADE ON DELETE RESTRICT,
          nombre VARCHAR(120) NOT NULL,
          monto NUMERIC(14,2) DEFAULT 0 NOT NULL,
          activa BOOLEAN DEFAULT TRUE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
          CONSTRAINT vigencia_especial_monto_chk CHECK (monto >= 0)
        )
      `)

      await db.rawQuery(`
        CREATE TABLE IF NOT EXISTS public.vigencia_especial_programa (
          id_vigencia_especial_programa SERIAL PRIMARY KEY,
          id_vigencia_especial INTEGER NOT NULL REFERENCES public.vigencia_especial(id_vigencia_especial) ON UPDATE CASCADE ON DELETE CASCADE,
          id_programa_formacion INTEGER NOT NULL REFERENCES public.programa_formacion(id_programa_formacion) ON UPDATE CASCADE ON DELETE RESTRICT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
          CONSTRAINT uq_vigencia_especial_programa UNIQUE (id_vigencia_especial, id_programa_formacion)
        )
      `)
    })
  }

  async down() {
    this.defer(async (db) => {
      await db.rawQuery(`DROP TABLE IF EXISTS public.vigencia_especial_programa`)
      await db.rawQuery(`DROP TABLE IF EXISTS public.vigencia_especial`)
    })
  }
}
