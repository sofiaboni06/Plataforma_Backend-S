import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      await db.rawQuery(`
        CREATE TABLE IF NOT EXISTS public.lote_vigencia (
          id_lote SERIAL PRIMARY KEY,
          anio INTEGER NOT NULL REFERENCES public.vigencia(anio) ON UPDATE CASCADE ON DELETE RESTRICT,
          id_cformacion INTEGER NOT NULL REFERENCES public.c_formacion(id_cformacion) ON UPDATE CASCADE ON DELETE RESTRICT,
          nombre VARCHAR(80) NOT NULL,
          estado BOOLEAN DEFAULT TRUE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
        )
      `)
      await db.rawQuery(`
        CREATE UNIQUE INDEX IF NOT EXISTS uq_lote_vigencia_nombre
          ON public.lote_vigencia (anio, id_cformacion, lower(nombre))
      `)

      await db.rawQuery(`
        ALTER TABLE public.lista_maestra_material
          ADD COLUMN IF NOT EXISTS valor_unitario NUMERIC(14,2),
          ADD COLUMN IF NOT EXISTS id_lote INTEGER REFERENCES public.lote_vigencia(id_lote) ON UPDATE CASCADE ON DELETE SET NULL
      `)

      await db.rawQuery(`
        CREATE TABLE IF NOT EXISTS public.presupuesto_coordinador (
          id_presupuesto SERIAL PRIMARY KEY,
          anio INTEGER NOT NULL REFERENCES public.vigencia(anio) ON UPDATE CASCADE ON DELETE RESTRICT,
          id_usuario INTEGER NOT NULL REFERENCES public.usuario(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT,
          monto NUMERIC(14,2) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
          CONSTRAINT uq_presupuesto_coordinador UNIQUE (anio, id_usuario),
          CONSTRAINT presupuesto_coordinador_monto_chk CHECK (monto >= 0)
        )
      `)

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
    })
  }

  async down() {
    this.defer(async (db) => {
      await db.rawQuery(`DROP TABLE IF EXISTS public.presupuesto_ficha`)
      await db.rawQuery(`DROP TABLE IF EXISTS public.presupuesto_coordinador`)
      await db.rawQuery(`
        ALTER TABLE public.lista_maestra_material
          DROP COLUMN IF EXISTS id_lote,
          DROP COLUMN IF EXISTS valor_unitario
      `)
      await db.rawQuery(`DROP TABLE IF EXISTS public.lote_vigencia`)
    })
  }
}
