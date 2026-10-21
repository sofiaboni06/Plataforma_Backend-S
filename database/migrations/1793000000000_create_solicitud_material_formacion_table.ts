import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Solicitudes de materiales de formación: un instructor pide, para un
 * programa, un material de la lista maestra del programa. La fila se
 * referencian con FK RESTRICT —por eso la baja de la lista es lógica— y no
 * toca nada del flujo de inventario (obras, bodega, entregas ni devoluciones).
 */
export default class extends BaseSchema {
  async up() {
    this.schema.createTable('solicitud_material_formacion', (table) => {
      table.increments('id_solicitud_formacion')
      table
        .integer('id_lista_maestra')
        .notNullable()
        .references('id_lista_maestra')
        .inTable('lista_maestra_material')
        .onUpdate('CASCADE')
        .onDelete('RESTRICT')
      table
        .integer('id_usuario')
        .notNullable()
        .references('id_usuario')
        .inTable('usuario')
        .onUpdate('CASCADE')
        .onDelete('CASCADE')
      table.integer('cantidad_solicitada').notNullable()
      table.text('observaciones').nullable()
      table.string('estado', 20).notNullable().defaultTo('pendiente')
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.index(['id_lista_maestra'])
      table.index(['id_usuario'])
    })

    this.defer(async (db) => {
      await db.rawQuery(`
        ALTER TABLE solicitud_material_formacion
          ADD CONSTRAINT solicitud_material_formacion_cantidad_chk
          CHECK (cantidad_solicitada >= 1)
      `)
      await db.rawQuery(`
        ALTER TABLE solicitud_material_formacion
          ADD CONSTRAINT solicitud_material_formacion_estado_chk
          CHECK (estado IN ('pendiente', 'atendida', 'cancelada'))
      `)
    })
  }

  async down() {
    this.defer(async (db) => {
      await db.rawQuery(
        `ALTER TABLE solicitud_material_formacion DROP CONSTRAINT IF EXISTS solicitud_material_formacion_estado_chk`
      )
      await db.rawQuery(
        `ALTER TABLE solicitud_material_formacion DROP CONSTRAINT IF EXISTS solicitud_material_formacion_cantidad_chk`
      )
    })

    this.schema.dropTable('solicitud_material_formacion')
  }
}
