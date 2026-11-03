import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      await db.rawQuery(`
        CREATE TABLE IF NOT EXISTS public.presupuesto_asignacion_area (
          id_presupuesto_asignacion_area SERIAL PRIMARY KEY,
          id_presupuesto_asignacion INTEGER NOT NULL REFERENCES public.presupuesto_asignacion(id_presupuesto_asignacion) ON UPDATE CASCADE ON DELETE CASCADE,
          id_programa_formacion INTEGER NOT NULL REFERENCES public.programa_formacion(id_programa_formacion) ON UPDATE CASCADE ON DELETE RESTRICT,
          monto NUMERIC(14,2) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
          CONSTRAINT uq_presupuesto_asignacion_area UNIQUE (id_presupuesto_asignacion, id_programa_formacion),
          CONSTRAINT presupuesto_asignacion_area_monto_chk CHECK (monto >= 0)
        )
      `)
      await db.rawQuery(`
        INSERT INTO public.presupuesto_asignacion_area (id_presupuesto_asignacion, id_programa_formacion, monto)
        SELECT pf.id_presupuesto_asignacion, f.programa_id, SUM(pf.monto)
        FROM public.presupuesto_asignacion_ficha pf
        JOIN public.ficha f ON f.id_ficha = pf.id_ficha
        GROUP BY pf.id_presupuesto_asignacion, f.programa_id
        ON CONFLICT (id_presupuesto_asignacion, id_programa_formacion) DO NOTHING
      `)
    })
  }

  async down() {
    this.defer(async (db) => {
      await db.rawQuery(`DROP TABLE IF EXISTS public.presupuesto_asignacion_area`)
    })
  }
}
