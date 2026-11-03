import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      await db.rawQuery(`
        ALTER TABLE public.presupuesto_coordinador
          ADD COLUMN IF NOT EXISTS id_cformacion INTEGER
      `)
      await db.rawQuery(`
        UPDATE public.presupuesto_coordinador AS p
        SET id_cformacion = u.id_cformacion
        FROM public.usuario AS u
        WHERE u.id_usuario = p.id_usuario
          AND p.id_cformacion IS NULL
      `)
      await db.rawQuery(`
        WITH ranked AS (
          SELECT
            id_presupuesto,
            FIRST_VALUE(id_presupuesto) OVER (
              PARTITION BY anio, id_cformacion
              ORDER BY monto DESC, id_presupuesto ASC
            ) AS keeper
          FROM public.presupuesto_coordinador
          WHERE id_cformacion IS NOT NULL
        )
        DELETE FROM public.presupuesto_programa AS pp
        USING ranked
        WHERE pp.id_presupuesto = ranked.id_presupuesto
          AND ranked.id_presupuesto <> ranked.keeper
          AND EXISTS (
            SELECT 1
            FROM public.presupuesto_programa AS otro
            WHERE otro.id_presupuesto = ranked.keeper
              AND otro.id_programa_formacion = pp.id_programa_formacion
          )
      `)
      await db.rawQuery(`
        WITH ranked AS (
          SELECT
            id_presupuesto,
            FIRST_VALUE(id_presupuesto) OVER (
              PARTITION BY anio, id_cformacion
              ORDER BY monto DESC, id_presupuesto ASC
            ) AS keeper
          FROM public.presupuesto_coordinador
          WHERE id_cformacion IS NOT NULL
        )
        UPDATE public.presupuesto_programa AS pp
        SET id_presupuesto = ranked.keeper
        FROM ranked
        WHERE pp.id_presupuesto = ranked.id_presupuesto
          AND ranked.id_presupuesto <> ranked.keeper
      `)
      await db.rawQuery(`
        WITH ranked AS (
          SELECT
            id_presupuesto,
            FIRST_VALUE(id_presupuesto) OVER (
              PARTITION BY anio, id_cformacion
              ORDER BY monto DESC, id_presupuesto ASC
            ) AS keeper
          FROM public.presupuesto_coordinador
          WHERE id_cformacion IS NOT NULL
        )
        DELETE FROM public.presupuesto_coordinador AS p
        USING ranked
        WHERE p.id_presupuesto = ranked.id_presupuesto
          AND ranked.id_presupuesto <> ranked.keeper
      `)
      await db.rawQuery(`
        ALTER TABLE public.presupuesto_coordinador
          DROP CONSTRAINT IF EXISTS uq_presupuesto_coordinador
      `)
      await db.rawQuery(`
        ALTER TABLE public.presupuesto_coordinador
          DROP COLUMN IF EXISTS id_usuario
      `)
      await db.rawQuery(`
        ALTER TABLE public.presupuesto_coordinador
          ALTER COLUMN id_cformacion SET NOT NULL
      `)
      await db.rawQuery(`
        ALTER TABLE public.presupuesto_coordinador
          DROP CONSTRAINT IF EXISTS presupuesto_coordinador_id_cformacion_fkey
      `)
      await db.rawQuery(`
        ALTER TABLE public.presupuesto_coordinador
          ADD CONSTRAINT presupuesto_coordinador_id_cformacion_fkey
          FOREIGN KEY (id_cformacion)
          REFERENCES public.c_formacion(id_cformacion)
          ON UPDATE CASCADE ON DELETE RESTRICT
      `)
      await db.rawQuery(`
        ALTER TABLE public.presupuesto_coordinador
          ADD CONSTRAINT uq_presupuesto_centro_vigencia UNIQUE (anio, id_cformacion)
      `)
    })
  }

  async down() {
    this.defer(async (db) => {
      await db.rawQuery(`
        ALTER TABLE public.presupuesto_coordinador
          DROP CONSTRAINT IF EXISTS uq_presupuesto_centro_vigencia
      `)
      await db.rawQuery(`
        ALTER TABLE public.presupuesto_coordinador
          DROP CONSTRAINT IF EXISTS presupuesto_coordinador_id_cformacion_fkey
      `)
      await db.rawQuery(`
        ALTER TABLE public.presupuesto_coordinador
          ADD COLUMN IF NOT EXISTS id_usuario INTEGER
      `)
      await db.rawQuery(`
        ALTER TABLE public.presupuesto_coordinador
          DROP COLUMN IF EXISTS id_cformacion
      `)
    })
  }
}
