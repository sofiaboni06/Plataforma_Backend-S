import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Clasificación, unidad de medida, código UNSPSC y uso presupuestal eran
 * catálogos globales. Cada centro de formación tiene los suyos: un centro
 * nuevo arranca sin filas. Las filas que ya existían quedan en el centro que
 * las usa; si nadie las usa, quedan en el primer centro.
 */
type CatalogSpec = {
  table: string
  idColumn: string
  elementoColumn: string
  insertColumns: string[]
  matchColumn: string
  dropIndexes: string[]
  dropConstraints: string[]
  uniqueSql: string[]
}

const CATALOGS: CatalogSpec[] = [
  {
    table: 'clasificacion_elemento',
    idColumn: 'id_clasificacion_elemento',
    elementoColumn: 'id_clasificacion_elemento',
    insertColumns: ['nombre', 'estado'],
    matchColumn: 'nombre',
    dropIndexes: ['uq_clasificacion_elemento_nombre'],
    dropConstraints: [],
    uniqueSql: [
      `CREATE UNIQUE INDEX uq_clasificacion_elemento_centro_nombre
       ON clasificacion_elemento (id_cformacion, lower(nombre))`,
    ],
  },
  {
    table: 'uso_presupuestal',
    idColumn: 'id_uso_presupuestal',
    elementoColumn: 'id_uso_presupuestal',
    insertColumns: ['nombre', 'estado'],
    matchColumn: 'nombre',
    dropIndexes: ['uq_uso_presupuestal_nombre'],
    dropConstraints: [],
    uniqueSql: [
      `CREATE UNIQUE INDEX uq_uso_presupuestal_centro_nombre
       ON uso_presupuestal (id_cformacion, lower(nombre))`,
    ],
  },
  {
    table: 'codigo_estandar',
    idColumn: 'id_codigo_estandar',
    elementoColumn: 'id_codigo_estandar',
    insertColumns: ['codigo', 'nombre'],
    matchColumn: 'codigo',
    dropIndexes: [],
    dropConstraints: ['codigo_estandar_codigo_unique'],
    uniqueSql: [
      `CREATE UNIQUE INDEX uq_codigo_estandar_centro_codigo
       ON codigo_estandar (id_cformacion, codigo)`,
    ],
  },
  {
    table: 'unidad_medida',
    idColumn: 'id_unidad_medida',
    elementoColumn: 'id_unidad_medida',
    insertColumns: ['nombre', 'abreviatura', 'estado'],
    matchColumn: 'nombre',
    dropIndexes: [],
    dropConstraints: ['uq_unidad_medida_nombre', 'uq_unidad_medida_abreviatura'],
    uniqueSql: [
      `CREATE UNIQUE INDEX uq_unidad_medida_centro_nombre
       ON unidad_medida (id_cformacion, nombre)`,
      `CREATE UNIQUE INDEX uq_unidad_medida_centro_abreviatura
       ON unidad_medida (id_cformacion, abreviatura)`,
    ],
  },
]

export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      for (const spec of CATALOGS) {
        await tieCatalogToCenter(db, spec)
      }
    })
  }

  async down() {
    this.defer(async (db) => {
      for (const spec of [...CATALOGS].reverse()) {
        await untieCatalog(db, spec)
      }
    })
  }
}

async function tieCatalogToCenter(
  db: {
    rawQuery: (sql: string, bindings?: unknown[]) => Promise<unknown>
  },
  spec: CatalogSpec
) {
  await db.rawQuery(`
    ALTER TABLE ${spec.table}
      ADD COLUMN IF NOT EXISTS id_cformacion integer NULL
      REFERENCES c_formacion (id_cformacion)
      ON UPDATE CASCADE
      ON DELETE RESTRICT
  `)

  for (const name of spec.dropIndexes) {
    await db.rawQuery(`DROP INDEX IF EXISTS ${name}`)
  }

  for (const name of spec.dropConstraints) {
    await db.rawQuery(`ALTER TABLE ${spec.table} DROP CONSTRAINT IF EXISTS ${name}`)
  }

  await db.rawQuery(`
    UPDATE ${spec.table} AS catalogo
    SET id_cformacion = usado.min_center
    FROM (
      SELECT e.${spec.elementoColumn} AS id_catalogo, MIN(b.id_cformacion) AS min_center
      FROM elemento e
      JOIN stand s ON s.id_stand = e.id_stand
      JOIN sub_bodega sb ON sb.id_sub_bodega = s.id_sub_bodega
      JOIN bodega b ON b.id_bodega = sb.id_bodega
      WHERE e.${spec.elementoColumn} IS NOT NULL
      GROUP BY e.${spec.elementoColumn}
    ) AS usado
    WHERE catalogo.${spec.idColumn} = usado.id_catalogo
  `)

  const insertedColumns = [...spec.insertColumns, 'id_cformacion'].join(', ')
  const selectedColumns = [...spec.insertColumns, 'id_cformacion'].join(', ')

  await db.rawQuery(`
    WITH extras AS (
      SELECT DISTINCT
        c.${spec.idColumn} AS old_id,
        b.id_cformacion,
        ${spec.insertColumns.map((column) => `c.${column}`).join(', ')}
      FROM elemento e
      JOIN ${spec.table} c ON c.${spec.idColumn} = e.${spec.elementoColumn}
      JOIN stand s ON s.id_stand = e.id_stand
      JOIN sub_bodega sb ON sb.id_sub_bodega = s.id_sub_bodega
      JOIN bodega b ON b.id_bodega = sb.id_bodega
      WHERE c.id_cformacion IS NOT NULL
        AND b.id_cformacion <> c.id_cformacion
    ),
    inserted AS (
      INSERT INTO ${spec.table} (${insertedColumns})
      SELECT ${selectedColumns}
      FROM extras
      RETURNING ${spec.idColumn} AS new_id, ${spec.matchColumn}, id_cformacion
    )
    UPDATE elemento e
    SET ${spec.elementoColumn} = i.new_id
    FROM stand s
    JOIN sub_bodega sb ON sb.id_sub_bodega = s.id_sub_bodega
    JOIN bodega b ON b.id_bodega = sb.id_bodega
    JOIN inserted i ON i.id_cformacion = b.id_cformacion
    JOIN extras x
      ON x.id_cformacion = i.id_cformacion
     AND x.${spec.matchColumn} = i.${spec.matchColumn}
    WHERE e.id_stand = s.id_stand
      AND e.${spec.elementoColumn} = x.old_id
      AND b.id_cformacion = x.id_cformacion
  `)

  await db.rawQuery(`
    UPDATE ${spec.table}
    SET id_cformacion = (SELECT MIN(id_cformacion) FROM c_formacion)
    WHERE id_cformacion IS NULL
  `)

  await db.rawQuery(`
    ALTER TABLE ${spec.table} ALTER COLUMN id_cformacion SET NOT NULL
  `)

  await db.rawQuery(`
    CREATE INDEX IF NOT EXISTS ${spec.table}_id_cformacion_idx
    ON ${spec.table} (id_cformacion)
  `)

  for (const sql of spec.uniqueSql) {
    await db.rawQuery(sql)
  }
}

async function untieCatalog(
  db: {
    rawQuery: (sql: string, bindings?: unknown[]) => Promise<unknown>
  },
  spec: CatalogSpec
) {
  await db.rawQuery(`DROP INDEX IF EXISTS ${spec.table}_id_cformacion_idx`)
  await db.rawQuery(`DROP INDEX IF EXISTS uq_${spec.table}_centro_nombre`)
  await db.rawQuery(`DROP INDEX IF EXISTS uq_${spec.table}_centro_codigo`)
  await db.rawQuery(`DROP INDEX IF EXISTS uq_${spec.table}_centro_abreviatura`)
  await db.rawQuery(
    `ALTER TABLE ${spec.table} DROP COLUMN IF EXISTS id_cformacion`
  )

  if (spec.table === 'clasificacion_elemento') {
    await db.rawQuery(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_clasificacion_elemento_nombre
      ON clasificacion_elemento (lower(nombre))
    `)
  }

  if (spec.table === 'uso_presupuestal') {
    await db.rawQuery(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_uso_presupuestal_nombre
      ON uso_presupuestal (lower(nombre))
    `)
  }

  if (spec.table === 'codigo_estandar') {
    await db.rawQuery(`
      ALTER TABLE codigo_estandar
        ADD CONSTRAINT codigo_estandar_codigo_unique UNIQUE (codigo)
    `)
  }

  if (spec.table === 'unidad_medida') {
    await db.rawQuery(`
      ALTER TABLE unidad_medida
        ADD CONSTRAINT uq_unidad_medida_nombre UNIQUE (nombre)
    `)
    await db.rawQuery(`
      ALTER TABLE unidad_medida
        ADD CONSTRAINT uq_unidad_medida_abreviatura UNIQUE (abreviatura)
    `)
  }
}
