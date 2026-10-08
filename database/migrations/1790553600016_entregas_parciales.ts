import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Entregas por partes.
 *
 * - Cada fila guarda cuánto lleva entregado (y, si es equipo, devuelto). La
 *   fila pasa a `parcial` mientras falte algo por entregar.
 * - `entrega` es el historial: una fila por cada vez que bodega entrega.
 * - `devolucion` es la novedad: una fila por cantidad y estado recibido.
 * - `id_usuario_registra` marca las solicitudes que bodega hizo a nombre del
 *   instructor en el mostrador.
 */
export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      for (const tabla of ['solicitud_material', 'solicitud_equipo']) {
        await db.rawQuery(`
          ALTER TABLE ${tabla}
            ADD COLUMN IF NOT EXISTS cantidad_entregada integer NOT NULL DEFAULT 0
        `)
        await db.rawQuery(`
          ALTER TABLE ${tabla}
            ADD COLUMN IF NOT EXISTS id_usuario_registra integer NULL
            REFERENCES usuario (id_usuario)
            ON UPDATE CASCADE
            ON DELETE RESTRICT
        `)
        await db.rawQuery(`ALTER TABLE ${tabla} DROP CONSTRAINT IF EXISTS ${tabla}_estado_chk`)
      }

      await db.rawQuery(`
        ALTER TABLE solicitud_equipo
          ADD COLUMN IF NOT EXISTS cantidad_devuelta integer NOT NULL DEFAULT 0
      `)

      await db.rawQuery(`
        UPDATE solicitud_material
        SET cantidad_entregada = cantidad
        WHERE estado = 'entregado'
      `)
      await db.rawQuery(`
        UPDATE solicitud_equipo
        SET cantidad_entregada = cantidad
        WHERE estado IN ('entregado', 'devuelto')
      `)
      await db.rawQuery(`
        UPDATE solicitud_equipo
        SET cantidad_devuelta = cantidad
        WHERE estado = 'devuelto'
      `)

      await db.rawQuery(`
        ALTER TABLE solicitud_material
          ADD CONSTRAINT solicitud_material_estado_chk
          CHECK (estado IN ('pendiente', 'parcial', 'entregado'))
      `)
      await db.rawQuery(`
        ALTER TABLE solicitud_material
          ADD CONSTRAINT solicitud_material_entregada_chk
          CHECK (cantidad_entregada >= 0 AND cantidad_entregada <= cantidad)
      `)
      await db.rawQuery(`
        ALTER TABLE solicitud_equipo
          ADD CONSTRAINT solicitud_equipo_estado_chk
          CHECK (estado IN ('pendiente', 'parcial', 'entregado', 'devuelto'))
      `)
      await db.rawQuery(`
        ALTER TABLE solicitud_equipo
          ADD CONSTRAINT solicitud_equipo_entregada_chk
          CHECK (cantidad_entregada >= 0 AND cantidad_entregada <= cantidad)
      `)
      await db.rawQuery(`
        ALTER TABLE solicitud_equipo
          ADD CONSTRAINT solicitud_equipo_devuelta_chk
          CHECK (cantidad_devuelta >= 0 AND cantidad_devuelta <= cantidad_entregada)
      `)

      await db.rawQuery(`
        CREATE TABLE entrega (
          id_entrega serial PRIMARY KEY,
          id_solicitud_material integer NULL
            REFERENCES solicitud_material (id_solicitud_material)
            ON UPDATE CASCADE
            ON DELETE RESTRICT,
          id_solicitud_equipo integer NULL
            REFERENCES solicitud_equipo (id_solicitud_equipo)
            ON UPDATE CASCADE
            ON DELETE RESTRICT,
          id_usuario integer NOT NULL
            REFERENCES usuario (id_usuario)
            ON UPDATE CASCADE
            ON DELETE RESTRICT,
          cantidad integer NOT NULL,
          fecha timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
          observacion text NULL,
          CONSTRAINT entrega_cantidad_chk CHECK (cantidad > 0),
          CONSTRAINT entrega_solicitud_chk
            CHECK ((id_solicitud_material IS NULL) <> (id_solicitud_equipo IS NULL))
        )
      `)
      await db.rawQuery(`
        CREATE INDEX entrega_id_solicitud_material_idx ON entrega (id_solicitud_material)
      `)
      await db.rawQuery(`
        CREATE INDEX entrega_id_solicitud_equipo_idx ON entrega (id_solicitud_equipo)
      `)
      await db.rawQuery(`CREATE INDEX entrega_fecha_idx ON entrega (fecha)`)

      await db.rawQuery(`
        INSERT INTO entrega (id_solicitud_material, id_usuario, cantidad, fecha)
        SELECT id_solicitud_material,
               COALESCE(id_usuario_entrega, id_usuario),
               cantidad,
               COALESCE(fecha_entrega, fecha)
        FROM solicitud_material
        WHERE cantidad_entregada > 0
      `)
      await db.rawQuery(`
        INSERT INTO entrega (id_solicitud_equipo, id_usuario, cantidad, fecha)
        SELECT id_solicitud_equipo,
               COALESCE(id_usuario_entrega, id_usuario),
               cantidad,
               COALESCE(fecha_entrega, fecha)
        FROM solicitud_equipo
        WHERE cantidad_entregada > 0
      `)

      await db.rawQuery(`
        CREATE TABLE devolucion (
          id_devolucion serial PRIMARY KEY,
          id_solicitud_equipo integer NOT NULL
            REFERENCES solicitud_equipo (id_solicitud_equipo)
            ON UPDATE CASCADE
            ON DELETE RESTRICT,
          id_usuario integer NOT NULL
            REFERENCES usuario (id_usuario)
            ON UPDATE CASCADE
            ON DELETE RESTRICT,
          cantidad integer NOT NULL,
          estado_elemento varchar(20) NOT NULL,
          fecha timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
          observacion text NULL,
          CONSTRAINT devolucion_cantidad_chk CHECK (cantidad > 0),
          CONSTRAINT devolucion_estado_elemento_chk
            CHECK (estado_elemento IN ('bueno', 'danado', 'perdido', 'en_reparacion'))
        )
      `)
      await db.rawQuery(`
        CREATE INDEX devolucion_id_solicitud_equipo_idx ON devolucion (id_solicitud_equipo)
      `)

      await db.rawQuery(`
        INSERT INTO devolucion (
          id_solicitud_equipo, id_usuario, cantidad, estado_elemento, fecha, observacion
        )
        SELECT id_solicitud_equipo,
               COALESCE(id_usuario_entrega, id_usuario),
               cantidad,
               COALESCE(estado_elemento, 'bueno'),
               COALESCE(fecha_devolucion, fecha),
               observacion
        FROM solicitud_equipo
        WHERE cantidad_devuelta > 0
      `)
    })
  }

  async down() {
    this.defer(async (db) => {
      await db.rawQuery(`DROP TABLE IF EXISTS devolucion`)
      await db.rawQuery(`DROP TABLE IF EXISTS entrega`)

      await db.rawQuery(`
        ALTER TABLE solicitud_equipo DROP CONSTRAINT IF EXISTS solicitud_equipo_devuelta_chk
      `)
      await db.rawQuery(`ALTER TABLE solicitud_equipo DROP COLUMN IF EXISTS cantidad_devuelta`)

      for (const tabla of ['solicitud_material', 'solicitud_equipo']) {
        await db.rawQuery(`ALTER TABLE ${tabla} DROP CONSTRAINT IF EXISTS ${tabla}_entregada_chk`)
        await db.rawQuery(`ALTER TABLE ${tabla} DROP CONSTRAINT IF EXISTS ${tabla}_estado_chk`)
        await db.rawQuery(`UPDATE ${tabla} SET estado = 'pendiente' WHERE estado = 'parcial'`)
        await db.rawQuery(`ALTER TABLE ${tabla} DROP COLUMN IF EXISTS id_usuario_registra`)
        await db.rawQuery(`ALTER TABLE ${tabla} DROP COLUMN IF EXISTS cantidad_entregada`)
      }

      await db.rawQuery(`
        ALTER TABLE solicitud_material
          ADD CONSTRAINT solicitud_material_estado_chk
          CHECK (estado IN ('pendiente', 'entregado'))
      `)
      await db.rawQuery(`
        ALTER TABLE solicitud_equipo
          ADD CONSTRAINT solicitud_equipo_estado_chk
          CHECK (estado IN ('pendiente', 'entregado', 'devuelto'))
      `)
    })
  }
}
