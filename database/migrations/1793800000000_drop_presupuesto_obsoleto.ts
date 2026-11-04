import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      await db.rawQuery(`DROP TABLE IF EXISTS public.presupuesto_asignacion_ficha`)
      await db.rawQuery(`DROP TABLE IF EXISTS public.presupuesto_programa`)
      await db.rawQuery(`DROP TABLE IF EXISTS public.presupuesto_ficha`)
    })
  }

  async down() {
    this.defer(async (db) => {
      await db.rawQuery(`
        CREATE TABLE IF NOT EXISTS public.presupuesto_ficha (
          id_presupuesto_ficha SERIAL PRIMARY KEY,
          id_presupuesto INTEGER NOT NULL REFERENCES public.presupuesto_coordinador(id_presupuesto) ON UPDATE CASCADE ON DELETE CASCADE,
          id_ficha INTEGER NOT NULL REFERENCES public.ficha(id_ficha) ON UPDATE CASCADE ON DELETE RESTRICT,
          monto NUMERIC(14,2) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
          CONSTRAINT uq_presupuesto_ficha UNIQUE (id_presupuesto, id_ficha),
          CONSTRAINT presupuesto_ficha_monto_chk CHECK (monto >= 0)
        )
      `)
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
      await db.rawQuery(`
        CREATE TABLE IF NOT EXISTS public.presupuesto_asignacion_ficha (
          id_presupuesto_asignacion_ficha SERIAL PRIMARY KEY,
          id_presupuesto_asignacion INTEGER NOT NULL REFERENCES public.presupuesto_asignacion(id_presupuesto_asignacion) ON UPDATE CASCADE ON DELETE CASCADE,
          id_ficha INTEGER NOT NULL REFERENCES public.ficha(id_ficha) ON UPDATE CASCADE ON DELETE RESTRICT,
          monto NUMERIC(14,2) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
          CONSTRAINT uq_presupuesto_asignacion_ficha UNIQUE (id_presupuesto_asignacion, id_ficha),
          CONSTRAINT presupuesto_asignacion_ficha_monto_chk CHECK (monto >= 0)
        )
      `)
    })
  }
}
