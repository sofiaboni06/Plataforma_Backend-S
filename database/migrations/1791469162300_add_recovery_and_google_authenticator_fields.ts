import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'password_reset_codes'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp('verificado_en').nullable()
    })

    this.schema.alterTable('usuario', (table) => {
      table.boolean('google_authenticator_enabled').notNullable().defaultTo(false)
      table.string('google_authenticator_secret', 500).nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('verificado_en')
    })

    this.schema.alterTable('usuario', (table) => {
      table.dropColumn('google_authenticator_enabled')
      table.dropColumn('google_authenticator_secret')
    })
  }
}
