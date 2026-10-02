import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Categorías, subcategorías, clasificaciones, unidades, usos presupuestales y
 * códigos UNSPSC son de la plataforma: una sola lista para todos los centros.
 * El ítem sí es del centro que lo crea, así que guarda su propio id_cformacion
 * antes de soltar la categoría.
 */
export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      await db.rawQuery(`
        ALTER TABLE item
          ADD COLUMN IF NOT EXISTS id_cformacion integer NULL
          REFERENCES c_formacion (id_cformacion)
          ON UPDATE CASCADE
          ON DELETE RESTRICT
      `)

      await db.rawQuery(`
        UPDATE item AS i
        SET id_cformacion = c.id_cformacion
        FROM subcategoria AS s
        JOIN categoria AS c ON c.id_categoria = s.id_categoria
        WHERE i.id_subcategoria = s.id_subcategoria
          AND i.id_cformacion IS NULL
      `)

      await db.rawQuery(`
        UPDATE item
        SET id_cformacion = (SELECT MIN(id_cformacion) FROM c_formacion)
        WHERE id_cformacion IS NULL
      `)

      await db.rawQuery(`ALTER TABLE item ALTER COLUMN id_cformacion SET NOT NULL`)
      await db.rawQuery(`
        CREATE INDEX IF NOT EXISTS item_id_cformacion_idx ON item (id_cformacion)
      `)
      await db.rawQuery(`DROP INDEX IF EXISTS uq_item_subcategoria_nombre_activo`)
      await db.rawQuery(`
        CREATE UNIQUE INDEX IF NOT EXISTS uq_item_centro_subcategoria_nombre
        ON item (id_cformacion, id_subcategoria, nombre)
        WHERE estado IS DISTINCT FROM false
      `)

      await collapseByNombre(db, {
        table: 'clasificacion_elemento',
        idColumn: 'id_clasificacion_elemento',
        elementoColumn: 'id_clasificacion_elemento',
      })
      await collapseByNombre(db, {
        table: 'uso_presupuestal',
        idColumn: 'id_uso_presupuestal',
        elementoColumn: 'id_uso_presupuestal',
      })
      await collapseCodigo(db)
      await collapseUnidad(db)

      await mergeCategorias(db)

      await dropCenterColumn(db, 'clasificacion_elemento', [
        'uq_clasificacion_elemento_centro_nombre',
        'clasificacion_elemento_id_cformacion_idx',
      ])
      await dropCenterColumn(db, 'uso_presupuestal', [
        'uq_uso_presupuestal_centro_nombre',
        'uso_presupuestal_id_cformacion_idx',
      ])
      await dropCenterColumn(db, 'codigo_estandar', [
        'uq_codigo_estandar_centro_codigo',
        'codigo_estandar_id_cformacion_idx',
      ])
      await dropCenterColumn(db, 'unidad_medida', [
        'uq_unidad_medida_centro_nombre',
        'uq_unidad_medida_centro_abreviatura',
        'unidad_medida_id_cformacion_idx',
      ])
      await dropCenterColumn(db, 'categoria', [])

      await db.rawQuery(`
        CREATE UNIQUE INDEX IF NOT EXISTS uq_clasificacion_elemento_nombre
        ON clasificacion_elemento (lower(nombre))
      `)
      await db.rawQuery(`
        CREATE UNIQUE INDEX IF NOT EXISTS uq_uso_presupuestal_nombre
        ON uso_presupuestal (lower(nombre))
      `)
      await db.rawQuery(`
        ALTER TABLE codigo_estandar
          DROP CONSTRAINT IF EXISTS codigo_estandar_codigo_unique
      `)
      await db.rawQuery(`
        ALTER TABLE codigo_estandar
          ADD CONSTRAINT codigo_estandar_codigo_unique UNIQUE (codigo)
      `)
      await db.rawQuery(`
        ALTER TABLE unidad_medida DROP CONSTRAINT IF EXISTS uq_unidad_medida_nombre
      `)
      await db.rawQuery(`
        ALTER TABLE unidad_medida DROP CONSTRAINT IF EXISTS uq_unidad_medida_abreviatura
      `)
      await db.rawQuery(`
        ALTER TABLE unidad_medida ADD CONSTRAINT uq_unidad_medida_nombre UNIQUE (nombre)
      `)
      await db.rawQuery(`
        ALTER TABLE unidad_medida
          ADD CONSTRAINT uq_unidad_medida_abreviatura UNIQUE (abreviatura)
      `)
      await db.rawQuery(`
        CREATE UNIQUE INDEX IF NOT EXISTS uq_categoria_nombre
        ON categoria (lower(nombre))
      `)
      await db.rawQuery(`
        CREATE UNIQUE INDEX IF NOT EXISTS uq_subcategoria_categoria_nombre
        ON subcategoria (id_categoria, lower(nombre))
      `)
    })
  }

  async down() {
    this.defer(async (db) => {
      await db.rawQuery(`DROP INDEX IF EXISTS uq_categoria_nombre`)
      await db.rawQuery(`DROP INDEX IF EXISTS uq_subcategoria_categoria_nombre`)
      await db.rawQuery(`DROP INDEX IF EXISTS uq_clasificacion_elemento_nombre`)
      await db.rawQuery(`DROP INDEX IF EXISTS uq_uso_presupuestal_nombre`)
      await db.rawQuery(`
        ALTER TABLE codigo_estandar DROP CONSTRAINT IF EXISTS codigo_estandar_codigo_unique
      `)
      await db.rawQuery(`
        ALTER TABLE unidad_medida DROP CONSTRAINT IF EXISTS uq_unidad_medida_nombre
      `)
      await db.rawQuery(`
        ALTER TABLE unidad_medida DROP CONSTRAINT IF EXISTS uq_unidad_medida_abreviatura
      `)

      for (const table of [
        'categoria',
        'clasificacion_elemento',
        'uso_presupuestal',
        'codigo_estandar',
        'unidad_medida',
      ]) {
        await db.rawQuery(`
          ALTER TABLE ${table}
            ADD COLUMN IF NOT EXISTS id_cformacion integer NULL
            REFERENCES c_formacion (id_cformacion)
        `)
        await db.rawQuery(`
          UPDATE ${table}
          SET id_cformacion = (SELECT MIN(id_cformacion) FROM c_formacion)
          WHERE id_cformacion IS NULL
        `)
        await db.rawQuery(`ALTER TABLE ${table} ALTER COLUMN id_cformacion SET NOT NULL`)
      }

      await db.rawQuery(`DROP INDEX IF EXISTS uq_item_centro_subcategoria_nombre`)
      await db.rawQuery(`DROP INDEX IF EXISTS item_id_cformacion_idx`)
      await db.rawQuery(`ALTER TABLE item DROP COLUMN IF EXISTS id_cformacion`)
      await db.rawQuery(`
        CREATE UNIQUE INDEX IF NOT EXISTS uq_item_subcategoria_nombre_activo
        ON item (id_subcategoria, nombre)
        WHERE estado IS DISTINCT FROM false
      `)
    })
  }
}

type NamedCatalog = {
  table: string
  idColumn: string
  elementoColumn: string
}

async function collapseByNombre(
  db: { rawQuery: (sql: string) => Promise<unknown> },
  spec: NamedCatalog
) {
  await db.rawQuery(`
    WITH canon AS (
      SELECT DISTINCT ON (lower(nombre))
        lower(nombre) AS clave,
        ${spec.idColumn} AS keep_id
      FROM ${spec.table}
      ORDER BY lower(nombre), (estado IS TRUE) DESC, ${spec.idColumn}
    )
    UPDATE elemento AS e
    SET ${spec.elementoColumn} = canon.keep_id
    FROM ${spec.table} AS src
    JOIN canon ON canon.clave = lower(src.nombre)
    WHERE e.${spec.elementoColumn} = src.${spec.idColumn}
      AND src.${spec.idColumn} <> canon.keep_id
  `)

  await db.rawQuery(`
    WITH canon AS (
      SELECT DISTINCT ON (lower(nombre))
        lower(nombre) AS clave,
        ${spec.idColumn} AS keep_id
      FROM ${spec.table}
      ORDER BY lower(nombre), (estado IS TRUE) DESC, ${spec.idColumn}
    )
    DELETE FROM ${spec.table} AS src
    USING canon
    WHERE lower(src.nombre) = canon.clave
      AND src.${spec.idColumn} <> canon.keep_id
  `)
}

async function collapseCodigo(db: { rawQuery: (sql: string) => Promise<unknown> }) {
  await db.rawQuery(`
    WITH canon AS (
      SELECT DISTINCT ON (codigo) codigo AS clave, id_codigo_estandar AS keep_id
      FROM codigo_estandar
      ORDER BY codigo, id_codigo_estandar
    )
    UPDATE elemento AS e
    SET id_codigo_estandar = canon.keep_id
    FROM codigo_estandar AS src
    JOIN canon ON canon.clave = src.codigo
    WHERE e.id_codigo_estandar = src.id_codigo_estandar
      AND src.id_codigo_estandar <> canon.keep_id
  `)

  await db.rawQuery(`
    WITH canon AS (
      SELECT DISTINCT ON (codigo) codigo AS clave, id_codigo_estandar AS keep_id
      FROM codigo_estandar
      ORDER BY codigo, id_codigo_estandar
    )
    DELETE FROM codigo_estandar AS src
    USING canon
    WHERE src.codigo = canon.clave
      AND src.id_codigo_estandar <> canon.keep_id
  `)
}

async function collapseUnidad(db: { rawQuery: (sql: string) => Promise<unknown> }) {
  await db.rawQuery(`
    WITH canon AS (
      SELECT DISTINCT ON (lower(nombre))
        lower(nombre) AS clave,
        id_unidad_medida AS keep_id
      FROM unidad_medida
      ORDER BY lower(nombre), (estado IS NOT FALSE) DESC, id_unidad_medida
    )
    UPDATE elemento AS e
    SET id_unidad_medida = canon.keep_id
    FROM unidad_medida AS src
    JOIN canon ON canon.clave = lower(src.nombre)
    WHERE e.id_unidad_medida = src.id_unidad_medida
      AND src.id_unidad_medida <> canon.keep_id
  `)

  await db.rawQuery(`
    WITH canon AS (
      SELECT DISTINCT ON (lower(nombre))
        lower(nombre) AS clave,
        id_unidad_medida AS keep_id
      FROM unidad_medida
      ORDER BY lower(nombre), (estado IS NOT FALSE) DESC, id_unidad_medida
    )
    DELETE FROM unidad_medida AS src
    USING canon
    WHERE lower(src.nombre) = canon.clave
      AND src.id_unidad_medida <> canon.keep_id
  `)

  await db.rawQuery(`
    WITH ranked AS (
      SELECT
        id_unidad_medida,
        ROW_NUMBER() OVER (PARTITION BY lower(abreviatura) ORDER BY id_unidad_medida) AS n
      FROM unidad_medida
    )
    UPDATE unidad_medida AS u
    SET abreviatura = left(u.abreviatura, 12) || u.id_unidad_medida::text
    FROM ranked
    WHERE u.id_unidad_medida = ranked.id_unidad_medida
      AND ranked.n > 1
  `)
}

async function mergeCategorias(db: { rawQuery: (sql: string) => Promise<unknown> }) {
  await db.rawQuery(`
    WITH canon AS (
      SELECT DISTINCT ON (lower(nombre))
        lower(nombre) AS clave,
        id_categoria AS keep_id
      FROM categoria
      ORDER BY lower(nombre), (estado IS TRUE) DESC, id_categoria
    )
    UPDATE subcategoria AS s
    SET id_categoria = canon.keep_id
    FROM categoria AS src
    JOIN canon ON canon.clave = lower(src.nombre)
    WHERE s.id_categoria = src.id_categoria
      AND src.id_categoria <> canon.keep_id
  `)

  await db.rawQuery(`
    WITH canon_sub AS (
      SELECT DISTINCT ON (id_categoria, lower(nombre))
        id_categoria,
        lower(nombre) AS clave,
        id_subcategoria AS keep_id
      FROM subcategoria
      ORDER BY id_categoria, lower(nombre), (estado IS TRUE) DESC, id_subcategoria
    ),
    collision AS (
      SELECT loser.id_item AS loser_id, keeper.id_item AS keeper_id
      FROM subcategoria AS src
      JOIN canon_sub
        ON canon_sub.id_categoria = src.id_categoria
       AND canon_sub.clave = lower(src.nombre)
       AND canon_sub.keep_id <> src.id_subcategoria
      JOIN item AS loser ON loser.id_subcategoria = src.id_subcategoria
      JOIN item AS keeper
        ON keeper.id_subcategoria = canon_sub.keep_id
       AND keeper.id_cformacion = loser.id_cformacion
       AND keeper.nombre = loser.nombre
       AND keeper.id_item <> loser.id_item
       AND keeper.estado IS DISTINCT FROM false
       AND loser.estado IS DISTINCT FROM false
    )
    UPDATE elemento AS e
    SET id_item = collision.keeper_id
    FROM collision
    WHERE e.id_item = collision.loser_id
  `)

  await db.rawQuery(`
    WITH canon_sub AS (
      SELECT DISTINCT ON (id_categoria, lower(nombre))
        id_categoria,
        lower(nombre) AS clave,
        id_subcategoria AS keep_id
      FROM subcategoria
      ORDER BY id_categoria, lower(nombre), (estado IS TRUE) DESC, id_subcategoria
    )
    UPDATE item AS loser
    SET estado = false
    FROM subcategoria AS src
    JOIN canon_sub
      ON canon_sub.id_categoria = src.id_categoria
     AND canon_sub.clave = lower(src.nombre)
     AND canon_sub.keep_id <> src.id_subcategoria
    JOIN item AS keeper
      ON keeper.id_subcategoria = canon_sub.keep_id
     AND keeper.estado IS DISTINCT FROM false
    WHERE loser.id_subcategoria = src.id_subcategoria
      AND loser.estado IS DISTINCT FROM false
      AND keeper.id_cformacion = loser.id_cformacion
      AND keeper.nombre = loser.nombre
      AND keeper.id_item <> loser.id_item
  `)

  await db.rawQuery(`
    WITH canon_sub AS (
      SELECT DISTINCT ON (id_categoria, lower(nombre))
        id_categoria,
        lower(nombre) AS clave,
        id_subcategoria AS keep_id
      FROM subcategoria
      ORDER BY id_categoria, lower(nombre), (estado IS TRUE) DESC, id_subcategoria
    )
    UPDATE item AS i
    SET id_subcategoria = canon_sub.keep_id
    FROM subcategoria AS src
    JOIN canon_sub
      ON canon_sub.id_categoria = src.id_categoria
     AND canon_sub.clave = lower(src.nombre)
    WHERE i.id_subcategoria = src.id_subcategoria
      AND src.id_subcategoria <> canon_sub.keep_id
  `)

  await db.rawQuery(`
    WITH canon_sub AS (
      SELECT DISTINCT ON (id_categoria, lower(nombre))
        id_categoria,
        lower(nombre) AS clave,
        id_subcategoria AS keep_id
      FROM subcategoria
      ORDER BY id_categoria, lower(nombre), (estado IS TRUE) DESC, id_subcategoria
    )
    UPDATE elemento AS e
    SET id_subcategoria = canon_sub.keep_id
    FROM subcategoria AS src
    JOIN canon_sub
      ON canon_sub.id_categoria = src.id_categoria
     AND canon_sub.clave = lower(src.nombre)
    WHERE e.id_subcategoria = src.id_subcategoria
      AND src.id_subcategoria <> canon_sub.keep_id
  `)

  await db.rawQuery(`
    WITH canon_sub AS (
      SELECT DISTINCT ON (id_categoria, lower(nombre))
        id_subcategoria AS keep_id
      FROM subcategoria
      ORDER BY id_categoria, lower(nombre), (estado IS TRUE) DESC, id_subcategoria
    )
    DELETE FROM subcategoria AS src
    WHERE NOT EXISTS (
      SELECT 1 FROM canon_sub WHERE canon_sub.keep_id = src.id_subcategoria
    )
  `)

  await db.rawQuery(`
    WITH canon AS (
      SELECT DISTINCT ON (lower(nombre)) id_categoria AS keep_id
      FROM categoria
      ORDER BY lower(nombre), (estado IS TRUE) DESC, id_categoria
    )
    DELETE FROM categoria AS src
    WHERE NOT EXISTS (SELECT 1 FROM canon WHERE canon.keep_id = src.id_categoria)
  `)
}

async function dropCenterColumn(
  db: { rawQuery: (sql: string) => Promise<unknown> },
  table: string,
  indexes: string[]
) {
  for (const index of indexes) {
    await db.rawQuery(`DROP INDEX IF EXISTS ${index}`)
  }

  await db.rawQuery(`ALTER TABLE ${table} DROP COLUMN IF EXISTS id_cformacion`)
}
