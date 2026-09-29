import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Materiales de consumo (hoja MATERIALES DE CONSUMO).
 *
 * actividad: catálogo del uso y del lugar. La misma actividad se repite
 * (formaleta del andén, enchape, mantenimiento) así que no va como texto
 * suelto en cada salida.
 *
 * prestamo: la salida. Quién lo pidió es usuario; el rol es su perfil.
 * El elemento, la bodega y la unidad ya viven en elemento.
 *
 * novedad: la devolución de ese préstamo.
 *
 * alerta: aviso cuando el stock del elemento llega a su mínimo
 * (cantidad_minima, 10 por defecto) o se agota. Una sola alerta activa
 * por elemento.
 */
export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('elemento', (table) => {
      table.integer('cantidad_minima').notNullable().defaultTo(10)
    })

    this.schema.createTable('actividad', (table) => {
      table.increments('id_actividad')
      table.string('nombre', 200).notNullable()
      table.string('lugar', 200).nullable()
      table.boolean('estado').notNullable().defaultTo(true)
    })

    this.schema.createTable('prestamo', (table) => {
      table.increments('id_prestamo')
      table
        .integer('id_elemento')
        .notNullable()
        .references('id_elemento')
        .inTable('elemento')
        .onUpdate('CASCADE')
        .onDelete('RESTRICT')
      table
        .integer('id_usuario')
        .notNullable()
        .references('id_usuario')
        .inTable('usuario')
        .onUpdate('CASCADE')
        .onDelete('RESTRICT')
      table
        .integer('id_actividad')
        .notNullable()
        .references('id_actividad')
        .inTable('actividad')
        .onUpdate('CASCADE')
        .onDelete('RESTRICT')
      table.integer('cantidad').notNullable()
      table.string('ficha', 50).nullable()
      table.timestamp('fecha', { useTz: true }).notNullable().defaultTo(this.now())
      table.string('estado', 20).notNullable().defaultTo('prestado')
      table.text('observacion').nullable()

      table.index(['id_elemento'])
      table.index(['id_usuario'])
      table.index(['id_actividad'])
      table.index(['fecha'])
    })

    this.schema.createTable('novedad', (table) => {
      table.increments('id_novedad')
      table
        .integer('id_prestamo')
        .notNullable()
        .references('id_prestamo')
        .inTable('prestamo')
        .onUpdate('CASCADE')
        .onDelete('RESTRICT')
      table
        .integer('id_elemento')
        .notNullable()
        .references('id_elemento')
        .inTable('elemento')
        .onUpdate('CASCADE')
        .onDelete('RESTRICT')
      table
        .integer('id_usuario')
        .notNullable()
        .references('id_usuario')
        .inTable('usuario')
        .onUpdate('CASCADE')
        .onDelete('RESTRICT')
      table.integer('cantidad').notNullable()
      table.timestamp('fecha', { useTz: true }).notNullable().defaultTo(this.now())
      table.text('observacion').nullable()
      table.boolean('estado').notNullable().defaultTo(true)

      table.index(['id_prestamo'])
      table.index(['id_elemento'])
      table.index(['id_usuario'])
    })

    this.schema.createTable('alerta', (table) => {
      table.increments('id_alerta')
      table
        .integer('id_elemento')
        .notNullable()
        .references('id_elemento')
        .inTable('elemento')
        .onUpdate('CASCADE')
        .onDelete('RESTRICT')
      table.string('tipo', 20).notNullable()
      table.integer('cantidad').notNullable()
      table.integer('cantidad_minima').notNullable()
      table.boolean('estado').notNullable().defaultTo(true)
      table.timestamp('fecha', { useTz: true }).notNullable().defaultTo(this.now())

      table.index(['id_elemento'])
    })

    this.defer(async (db) => {
      await db.rawQuery(`
        ALTER TABLE elemento
          ADD CONSTRAINT elemento_cantidad_minima_chk
          CHECK (cantidad_minima >= 0)
      `)
      await db.rawQuery(`
        CREATE UNIQUE INDEX uq_actividad_nombre_lugar
        ON actividad (lower(nombre), lower(coalesce(lugar, '')))
      `)
      await db.rawQuery(`
        ALTER TABLE prestamo
          ADD CONSTRAINT prestamo_cantidad_chk CHECK (cantidad > 0)
      `)
      await db.rawQuery(`
        ALTER TABLE prestamo
          ADD CONSTRAINT prestamo_estado_chk
          CHECK (estado IN ('prestado', 'devuelto', 'consumido'))
      `)
      await db.rawQuery(`
        ALTER TABLE novedad
          ADD CONSTRAINT novedad_cantidad_chk CHECK (cantidad > 0)
      `)
      await db.rawQuery(`
        ALTER TABLE alerta
          ADD CONSTRAINT alerta_tipo_chk
          CHECK (tipo IN ('por_agotarse', 'agotado'))
      `)
      await db.rawQuery(`
        ALTER TABLE alerta
          ADD CONSTRAINT alerta_cantidad_chk
          CHECK (cantidad >= 0 AND cantidad_minima >= 0)
      `)
      await db.rawQuery(`
        CREATE UNIQUE INDEX uq_alerta_elemento_activa
        ON alerta (id_elemento)
        WHERE estado = true
      `)
    })
  }

  async down() {
    this.defer(async (db) => {
      await db.rawQuery(`DROP INDEX IF EXISTS uq_alerta_elemento_activa`)
      await db.rawQuery(`ALTER TABLE alerta DROP CONSTRAINT IF EXISTS alerta_cantidad_chk`)
      await db.rawQuery(`ALTER TABLE alerta DROP CONSTRAINT IF EXISTS alerta_tipo_chk`)
      await db.rawQuery(`ALTER TABLE novedad DROP CONSTRAINT IF EXISTS novedad_cantidad_chk`)
      await db.rawQuery(`ALTER TABLE prestamo DROP CONSTRAINT IF EXISTS prestamo_estado_chk`)
      await db.rawQuery(`ALTER TABLE prestamo DROP CONSTRAINT IF EXISTS prestamo_cantidad_chk`)
      await db.rawQuery(`DROP INDEX IF EXISTS uq_actividad_nombre_lugar`)
      await db.rawQuery(
        `ALTER TABLE elemento DROP CONSTRAINT IF EXISTS elemento_cantidad_minima_chk`
      )
    })

    this.schema.dropTable('alerta')
    this.schema.dropTable('novedad')
    this.schema.dropTable('prestamo')
    this.schema.dropTable('actividad')

    this.schema.alterTable('elemento', (table) => {
      table.dropColumn('cantidad_minima')
    })
  }
}
