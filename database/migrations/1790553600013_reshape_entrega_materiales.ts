import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Entrega de materiales: dos procesos, dos tablas.
 *
 * - clasificacion_elemento.caracter decide si el kardex va a consumo o
 *   devolutivo.
 * - actividad pasa a obra y queda del centro, no de la bodega.
 * - prestamo se parte: solicitud_material (consumo) y solicitud_equipo
 *   (herramienta / maquinaria / equipo).
 * - La devolución no es tabla: es el estado `devuelto`.
 * - La novedad tampoco: estado_elemento vive en solicitud_equipo.
 */
export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      await db.rawQuery(`
        ALTER TABLE clasificacion_elemento
          ADD COLUMN IF NOT EXISTS caracter varchar(20) NULL
      `)
      await db.rawQuery(`
        UPDATE clasificacion_elemento
        SET caracter = CASE
          WHEN lower(
            translate(nombre, 'ÁÉÍÓÚÜáéíóúü', 'AEIOUUaeiouu')
          ) LIKE '%consumo%'
            OR lower(
              translate(nombre, 'ÁÉÍÓÚÜáéíóúü', 'AEIOUUaeiouu')
            ) LIKE '%aseo%'
            OR lower(
              translate(nombre, 'ÁÉÍÓÚÜáéíóúü', 'AEIOUUaeiouu')
            ) LIKE '%quimico%'
          THEN 'consumo'
          ELSE 'devolutivo'
        END
        WHERE caracter IS NULL
      `)
      await db.rawQuery(`
        ALTER TABLE clasificacion_elemento
          ALTER COLUMN caracter SET NOT NULL
      `)
      await db.rawQuery(`
        ALTER TABLE clasificacion_elemento
          DROP CONSTRAINT IF EXISTS clasificacion_elemento_caracter_chk
      `)
      await db.rawQuery(`
        ALTER TABLE clasificacion_elemento
          ADD CONSTRAINT clasificacion_elemento_caracter_chk
          CHECK (caracter IN ('consumo', 'devolutivo'))
      `)

      await db.rawQuery(`DROP TABLE IF EXISTS novedad`)

      await db.rawQuery(`
        ALTER TABLE prestamo
          DROP CONSTRAINT IF EXISTS prestamo_id_actividad_foreign
      `)

      await db.rawQuery(`ALTER TABLE actividad RENAME TO obra`)
      await db.rawQuery(`ALTER TABLE obra RENAME COLUMN id_actividad TO id_obra`)
      await db.rawQuery(`
        ALTER SEQUENCE IF EXISTS actividad_id_actividad_seq
          RENAME TO obra_id_obra_seq
      `)
      await db.rawQuery(`
        ALTER TABLE obra RENAME CONSTRAINT actividad_pkey TO obra_pkey
      `)
      await db.rawQuery(`DROP INDEX IF EXISTS uq_actividad_nombre_lugar`)
      await db.rawQuery(`
        ALTER TABLE obra
          ADD COLUMN IF NOT EXISTS id_cformacion integer NULL
          REFERENCES c_formacion (id_cformacion)
          ON UPDATE CASCADE
          ON DELETE RESTRICT
      `)
      await db.rawQuery(`
        UPDATE obra
        SET id_cformacion = (SELECT MIN(id_cformacion) FROM c_formacion)
        WHERE id_cformacion IS NULL
      `)
      await db.rawQuery(`ALTER TABLE obra ALTER COLUMN id_cformacion SET NOT NULL`)
      await db.rawQuery(`
        CREATE INDEX IF NOT EXISTS obra_id_cformacion_idx
        ON obra (id_cformacion)
      `)
      await db.rawQuery(`
        CREATE UNIQUE INDEX IF NOT EXISTS uq_obra_centro_nombre
        ON obra (id_cformacion, lower(nombre))
      `)

      await db.rawQuery(`ALTER TABLE prestamo RENAME TO solicitud_material`)
      await db.rawQuery(`
        ALTER TABLE solicitud_material
          RENAME COLUMN id_prestamo TO id_solicitud_material
      `)
      await db.rawQuery(`
        ALTER TABLE solicitud_material
          RENAME COLUMN id_actividad TO id_obra
      `)
      await db.rawQuery(`
        ALTER SEQUENCE IF EXISTS prestamo_id_prestamo_seq
          RENAME TO solicitud_material_id_solicitud_material_seq
      `)
      await db.rawQuery(`
        ALTER TABLE solicitud_material
          RENAME CONSTRAINT prestamo_pkey TO solicitud_material_pkey
      `)
      await db.rawQuery(`
        ALTER TABLE solicitud_material
          DROP CONSTRAINT IF EXISTS prestamo_estado_chk
      `)
      await db.rawQuery(`
        ALTER TABLE solicitud_material
          DROP CONSTRAINT IF EXISTS prestamo_cantidad_chk
      `)
      await db.rawQuery(`
        UPDATE solicitud_material
        SET estado = CASE
          WHEN estado = 'prestado' THEN 'pendiente'
          ELSE 'entregado'
        END
      `)
      await db.rawQuery(`
        ALTER TABLE solicitud_material
          ALTER COLUMN estado SET DEFAULT 'pendiente'
      `)
      await db.rawQuery(`
        ALTER TABLE solicitud_material
          ADD COLUMN IF NOT EXISTS codigo_solicitud varchar(50) NULL
      `)
      await db.rawQuery(`
        UPDATE solicitud_material
        SET codigo_solicitud = 'MIG-' || id_solicitud_material::text
        WHERE codigo_solicitud IS NULL
      `)
      await db.rawQuery(`
        ALTER TABLE solicitud_material
          ALTER COLUMN codigo_solicitud SET NOT NULL
      `)
      await db.rawQuery(`
        ALTER TABLE solicitud_material
          ADD COLUMN IF NOT EXISTS id_usuario_entrega integer NULL
          REFERENCES usuario (id_usuario)
          ON UPDATE CASCADE
          ON DELETE RESTRICT
      `)
      await db.rawQuery(`
        ALTER TABLE solicitud_material
          ADD COLUMN IF NOT EXISTS fecha_entrega timestamptz NULL
      `)
      await db.rawQuery(`
        ALTER TABLE solicitud_material
          ADD CONSTRAINT solicitud_material_id_obra_foreign
          FOREIGN KEY (id_obra)
          REFERENCES obra (id_obra)
          ON UPDATE CASCADE
          ON DELETE RESTRICT
      `)
      await db.rawQuery(`
        ALTER TABLE solicitud_material
          ADD CONSTRAINT solicitud_material_cantidad_chk
          CHECK (cantidad > 0)
      `)
      await db.rawQuery(`
        ALTER TABLE solicitud_material
          ADD CONSTRAINT solicitud_material_estado_chk
          CHECK (estado IN ('pendiente', 'entregado'))
      `)
      await db.rawQuery(`
        CREATE INDEX IF NOT EXISTS solicitud_material_codigo_solicitud_idx
        ON solicitud_material (codigo_solicitud)
      `)
      await db.rawQuery(`
        CREATE INDEX IF NOT EXISTS solicitud_material_id_obra_idx
        ON solicitud_material (id_obra)
      `)
      await db.rawQuery(`
        CREATE INDEX IF NOT EXISTS solicitud_material_estado_idx
        ON solicitud_material (estado)
      `)

      await db.rawQuery(`
        CREATE TABLE solicitud_equipo (
          id_solicitud_equipo serial PRIMARY KEY,
          codigo_solicitud varchar(50) NOT NULL,
          id_obra integer NOT NULL
            REFERENCES obra (id_obra)
            ON UPDATE CASCADE
            ON DELETE RESTRICT,
          id_elemento integer NOT NULL
            REFERENCES elemento (id_elemento)
            ON UPDATE CASCADE
            ON DELETE RESTRICT,
          id_usuario integer NOT NULL
            REFERENCES usuario (id_usuario)
            ON UPDATE CASCADE
            ON DELETE RESTRICT,
          id_usuario_entrega integer NULL
            REFERENCES usuario (id_usuario)
            ON UPDATE CASCADE
            ON DELETE RESTRICT,
          cantidad integer NOT NULL,
          ficha varchar(50) NULL,
          estado varchar(20) NOT NULL DEFAULT 'pendiente',
          estado_elemento varchar(20) NULL,
          fecha timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
          fecha_entrega timestamptz NULL,
          fecha_devolucion timestamptz NULL,
          observacion text NULL,
          CONSTRAINT solicitud_equipo_cantidad_chk CHECK (cantidad > 0),
          CONSTRAINT solicitud_equipo_estado_chk
            CHECK (estado IN ('pendiente', 'entregado', 'devuelto')),
          CONSTRAINT solicitud_equipo_estado_elemento_chk
            CHECK (
              estado_elemento IS NULL
              OR estado_elemento IN ('bueno', 'danado', 'perdido', 'en_reparacion')
            )
        )
      `)
      await db.rawQuery(`
        CREATE INDEX solicitud_equipo_codigo_solicitud_idx
        ON solicitud_equipo (codigo_solicitud)
      `)
      await db.rawQuery(`
        CREATE INDEX solicitud_equipo_id_obra_idx ON solicitud_equipo (id_obra)
      `)
      await db.rawQuery(`
        CREATE INDEX solicitud_equipo_id_elemento_idx
        ON solicitud_equipo (id_elemento)
      `)
      await db.rawQuery(`
        CREATE INDEX solicitud_equipo_id_usuario_idx
        ON solicitud_equipo (id_usuario)
      `)
      await db.rawQuery(`
        CREATE INDEX solicitud_equipo_estado_idx ON solicitud_equipo (estado)
      `)
      await db.rawQuery(`
        CREATE INDEX solicitud_equipo_fecha_idx ON solicitud_equipo (fecha)
      `)
    })
  }

  async down() {
    this.defer(async (db) => {
      await db.rawQuery(`DROP TABLE IF EXISTS solicitud_equipo`)

      await db.rawQuery(`DROP INDEX IF EXISTS solicitud_material_estado_idx`)
      await db.rawQuery(`DROP INDEX IF EXISTS solicitud_material_id_obra_idx`)
      await db.rawQuery(`DROP INDEX IF EXISTS solicitud_material_codigo_solicitud_idx`)
      await db.rawQuery(`
        ALTER TABLE solicitud_material
          DROP CONSTRAINT IF EXISTS solicitud_material_estado_chk
      `)
      await db.rawQuery(`
        ALTER TABLE solicitud_material
          DROP CONSTRAINT IF EXISTS solicitud_material_cantidad_chk
      `)
      await db.rawQuery(`
        ALTER TABLE solicitud_material
          DROP CONSTRAINT IF EXISTS solicitud_material_id_obra_foreign
      `)
      await db.rawQuery(`
        ALTER TABLE solicitud_material DROP COLUMN IF EXISTS fecha_entrega
      `)
      await db.rawQuery(`
        ALTER TABLE solicitud_material DROP COLUMN IF EXISTS id_usuario_entrega
      `)
      await db.rawQuery(`
        ALTER TABLE solicitud_material DROP COLUMN IF EXISTS codigo_solicitud
      `)
      await db.rawQuery(`
        UPDATE solicitud_material
        SET estado = CASE
          WHEN estado = 'pendiente' THEN 'prestado'
          ELSE 'consumido'
        END
      `)
      await db.rawQuery(`
        ALTER TABLE solicitud_material
          ALTER COLUMN estado SET DEFAULT 'prestado'
      `)
      await db.rawQuery(`
        ALTER TABLE solicitud_material
          ADD CONSTRAINT prestamo_cantidad_chk CHECK (cantidad > 0)
      `)
      await db.rawQuery(`
        ALTER TABLE solicitud_material
          ADD CONSTRAINT prestamo_estado_chk
          CHECK (estado IN ('prestado', 'devuelto', 'consumido'))
      `)
      await db.rawQuery(`
        ALTER TABLE solicitud_material
          RENAME CONSTRAINT solicitud_material_pkey TO prestamo_pkey
      `)
      await db.rawQuery(`
        ALTER SEQUENCE IF EXISTS solicitud_material_id_solicitud_material_seq
          RENAME TO prestamo_id_prestamo_seq
      `)
      await db.rawQuery(`
        ALTER TABLE solicitud_material
          RENAME COLUMN id_obra TO id_actividad
      `)
      await db.rawQuery(`
        ALTER TABLE solicitud_material
          RENAME COLUMN id_solicitud_material TO id_prestamo
      `)
      await db.rawQuery(`ALTER TABLE solicitud_material RENAME TO prestamo`)

      await db.rawQuery(`DROP INDEX IF EXISTS uq_obra_centro_nombre`)
      await db.rawQuery(`DROP INDEX IF EXISTS obra_id_cformacion_idx`)
      await db.rawQuery(`ALTER TABLE obra DROP COLUMN IF EXISTS id_cformacion`)
      await db.rawQuery(`ALTER TABLE obra RENAME CONSTRAINT obra_pkey TO actividad_pkey`)
      await db.rawQuery(`
        ALTER SEQUENCE IF EXISTS obra_id_obra_seq
          RENAME TO actividad_id_actividad_seq
      `)
      await db.rawQuery(`ALTER TABLE obra RENAME COLUMN id_obra TO id_actividad`)
      await db.rawQuery(`ALTER TABLE obra RENAME TO actividad`)
      await db.rawQuery(`
        CREATE UNIQUE INDEX uq_actividad_nombre_lugar
        ON actividad (lower(nombre), lower(coalesce(lugar, '')))
      `)
      await db.rawQuery(`
        ALTER TABLE prestamo
          ADD CONSTRAINT prestamo_id_actividad_foreign
          FOREIGN KEY (id_actividad)
          REFERENCES actividad (id_actividad)
          ON UPDATE CASCADE
          ON DELETE RESTRICT
      `)

      await db.rawQuery(`
        CREATE TABLE novedad (
          id_novedad serial PRIMARY KEY,
          id_prestamo integer NOT NULL
            REFERENCES prestamo (id_prestamo)
            ON UPDATE CASCADE
            ON DELETE RESTRICT,
          id_elemento integer NOT NULL
            REFERENCES elemento (id_elemento)
            ON UPDATE CASCADE
            ON DELETE RESTRICT,
          id_usuario integer NOT NULL
            REFERENCES usuario (id_usuario)
            ON UPDATE CASCADE
            ON DELETE RESTRICT,
          cantidad integer NOT NULL,
          fecha timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
          observacion text NULL,
          estado boolean NOT NULL DEFAULT true,
          CONSTRAINT novedad_cantidad_chk CHECK (cantidad > 0)
        )
      `)
      await db.rawQuery(`CREATE INDEX novedad_id_prestamo_index ON novedad (id_prestamo)`)
      await db.rawQuery(`CREATE INDEX novedad_id_elemento_index ON novedad (id_elemento)`)
      await db.rawQuery(`CREATE INDEX novedad_id_usuario_index ON novedad (id_usuario)`)

      await db.rawQuery(`
        ALTER TABLE clasificacion_elemento
          DROP CONSTRAINT IF EXISTS clasificacion_elemento_caracter_chk
      `)
      await db.rawQuery(`
        ALTER TABLE clasificacion_elemento DROP COLUMN IF EXISTS caracter
      `)
    })
  }
}
