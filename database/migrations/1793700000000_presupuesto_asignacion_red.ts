import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      await db.rawQuery(`
        CREATE TABLE IF NOT EXISTS public.presupuesto_asignacion_red (
          id_presupuesto_asignacion_red SERIAL PRIMARY KEY,
          id_presupuesto_asignacion INTEGER NOT NULL REFERENCES public.presupuesto_asignacion(id_presupuesto_asignacion) ON UPDATE CASCADE ON DELETE CASCADE,
          id_red_conocimiento INTEGER NOT NULL REFERENCES public.redes_conocimiento(id_red_conocimiento) ON UPDATE CASCADE ON DELETE RESTRICT,
          monto NUMERIC(14,2) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
          CONSTRAINT uq_presupuesto_asignacion_red UNIQUE (id_presupuesto_asignacion, id_red_conocimiento),
          CONSTRAINT presupuesto_asignacion_red_monto_chk CHECK (monto >= 0)
        )
      `)
      await db.rawQuery(`
        INSERT INTO public.presupuesto_asignacion_red (id_presupuesto_asignacion, id_red_conocimiento, monto)
        SELECT a.id_presupuesto_asignacion, p.id_red_conocimiento, SUM(a.monto)
        FROM public.presupuesto_asignacion_area a
        JOIN public.programa_formacion p ON p.id_programa_formacion = a.id_programa_formacion
        GROUP BY a.id_presupuesto_asignacion, p.id_red_conocimiento
        ON CONFLICT (id_presupuesto_asignacion, id_red_conocimiento) DO NOTHING
      `)
    })
  }

  async down() {
    this.defer(async (db) => {
      await db.rawQuery(`DROP TABLE IF EXISTS public.presupuesto_asignacion_red`)
    })
  }
}
