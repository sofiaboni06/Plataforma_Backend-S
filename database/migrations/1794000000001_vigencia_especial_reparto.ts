import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      await db.rawQuery(`
        CREATE TABLE IF NOT EXISTS public.vigencia_especial_asignacion (
          id_asignacion_especial SERIAL PRIMARY KEY,
          id_vigencia_especial INTEGER NOT NULL REFERENCES public.vigencia_especial(id_vigencia_especial) ON UPDATE CASCADE ON DELETE CASCADE,
          id_usuario INTEGER NOT NULL REFERENCES public.usuario(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT,
          monto NUMERIC(14,2) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
          CONSTRAINT uq_vigencia_especial_asignacion UNIQUE (id_vigencia_especial, id_usuario),
          CONSTRAINT vigencia_especial_asignacion_monto_chk CHECK (monto >= 0)
        )
      `)

      await db.rawQuery(`
        CREATE TABLE IF NOT EXISTS public.vigencia_especial_asignacion_red (
          id_asignacion_especial_red SERIAL PRIMARY KEY,
          id_asignacion_especial INTEGER NOT NULL REFERENCES public.vigencia_especial_asignacion(id_asignacion_especial) ON UPDATE CASCADE ON DELETE CASCADE,
          id_red_conocimiento INTEGER NOT NULL REFERENCES public.redes_conocimiento(id_red_conocimiento) ON UPDATE CASCADE ON DELETE RESTRICT,
          monto NUMERIC(14,2) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
          CONSTRAINT uq_vigencia_especial_asignacion_red UNIQUE (id_asignacion_especial, id_red_conocimiento),
          CONSTRAINT vigencia_especial_asignacion_red_monto_chk CHECK (monto >= 0)
        )
      `)

      await db.rawQuery(`ALTER TABLE notificacion DROP CONSTRAINT IF EXISTS notificacion_tipo_chk`)
      await db.rawQuery(`
        ALTER TABLE notificacion
          ADD CONSTRAINT notificacion_tipo_chk
          CHECK (tipo IN (
            'por_agotarse',
            'agotado',
            'solicitud_material',
            'solicitud_equipo',
            'entrega_material',
            'entrega_equipo',
            'devolucion_equipo',
            'solicitud_programa',
            'decision_solicitud_programa',
            'vigencia_especial'
          ))
      `)
    })
  }

  async down() {
    this.defer(async (db) => {
      await db.rawQuery(`DROP TABLE IF EXISTS public.vigencia_especial_asignacion_red`)
      await db.rawQuery(`DROP TABLE IF EXISTS public.vigencia_especial_asignacion`)
      await db.rawQuery(`ALTER TABLE notificacion DROP CONSTRAINT IF EXISTS notificacion_tipo_chk`)
      await db.rawQuery(`
        ALTER TABLE notificacion
          ADD CONSTRAINT notificacion_tipo_chk
          CHECK (tipo IN (
            'por_agotarse',
            'agotado',
            'solicitud_material',
            'solicitud_equipo',
            'entrega_material',
            'entrega_equipo',
            'devolucion_equipo',
            'solicitud_programa',
            'decision_solicitud_programa'
          ))
      `)
    })
  }
}
