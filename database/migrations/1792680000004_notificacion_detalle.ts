import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('notificacion', (table) => {
      table.jsonb('detalle').nullable()
    })
  }

  async down() {
    this.schema.alterTable('notificacion', (table) => {
      table.dropColumn('detalle')
    })
  }
}
