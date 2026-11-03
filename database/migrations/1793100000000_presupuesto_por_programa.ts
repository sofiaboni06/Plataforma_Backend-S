import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      await db.rawQuery(`
        CREATE TABLE IF NOT EXISTS public.presupuesto_programa (
          id_presupuesto_programa SERIAL PRIMARY KEY,
          id_presupuesto INTEGER NOT NULL REFERENCES public.presupuesto_coordinador(id_presupuesto) ON UPDATE CASCADE ON DELETE CASCADE,
          id_programa_formacion INTEGER NOT NULL REFERENCES public.programa_formacion(id_programa_formacion) ON UPDATE CASCADE ON DELETE RESTRICT,
          monto NUMERIC(14,2) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
          CONSTRAINT uq_presupuesto_programa UNIQUE (id_presupuesto, id_programa_formacion),
          CONSTRAINT presupuesto_programa_monto_chk CHECK (monto >= 0)
        )
      `)
    })
  }

  async down() {
    this.defer(async (db) => {
      await db.rawQuery(`DROP TABLE IF EXISTS public.presupuesto_programa`)
    })
  }
}
