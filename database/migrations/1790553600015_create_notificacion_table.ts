import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Bandeja de cada usuario. El canal en vivo solo empuja lo que ya quedó
 * guardado aquí: si nadie está conectado, el aviso sigue al volver a entrar.
 */
export default class extends BaseSchema {
  async up() {
    this.schema.createTable('notificacion', (table) => {
      table.increments('id_notificacion')
      table
        .integer('id_usuario')
        .notNullable()
        .references('id_usuario')
        .inTable('usuario')
        .onUpdate('CASCADE')
        .onDelete('CASCADE')
      table.string('tipo', 40).notNullable()
      table.string('titulo', 200).notNullable()
      table.text('mensaje').notNullable()
      table.boolean('leida').notNullable().defaultTo(false)
      table.string('recurso', 40).nullable()
      table.integer('id_referencia').nullable()
      table.timestamp('fecha', { useTz: true }).notNullable().defaultTo(this.now())

      table.index(['id_usuario', 'leida'])
      table.index(['fecha'])
    })

    this.defer(async (db) => {
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
            'devolucion_equipo'
          ))
      `)
      await db.rawQuery(`
        ALTER TABLE notificacion
          ADD CONSTRAINT notificacion_recurso_chk
          CHECK (
            recurso IS NULL
            OR recurso IN ('alerta', 'solicitud_material', 'solicitud_equipo')
          )
      `)
    })
  }

  async down() {
    this.defer(async (db) => {
      await db.rawQuery(`ALTER TABLE notificacion DROP CONSTRAINT IF EXISTS notificacion_recurso_chk`)
      await db.rawQuery(`ALTER TABLE notificacion DROP CONSTRAINT IF EXISTS notificacion_tipo_chk`)
    })

    this.schema.dropTable('notificacion')
  }
}
