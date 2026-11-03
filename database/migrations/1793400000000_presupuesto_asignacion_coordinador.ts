import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      await db.rawQuery(`
        CREATE TABLE IF NOT EXISTS public.presupuesto_asignacion (
          id_presupuesto_asignacion SERIAL PRIMARY KEY,
          id_presupuesto INTEGER NOT NULL REFERENCES public.presupuesto_coordinador(id_presupuesto) ON UPDATE CASCADE ON DELETE CASCADE,
          id_usuario INTEGER NOT NULL REFERENCES public.usuario(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT,
          monto NUMERIC(14,2) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
          CONSTRAINT uq_presupuesto_asignacion UNIQUE (id_presupuesto, id_usuario),
          CONSTRAINT presupuesto_asignacion_monto_chk CHECK (monto >= 0)
        )
      `)
    })
  }

  async down() {
    this.defer(async (db) => {
      await db.rawQuery(`DROP TABLE IF EXISTS public.presupuesto_asignacion`)
    })
  }
}
