import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Ficha técnica del elemento: si es de consumo o devolutivo, el valor
 * unitario promedio y el porcentaje de aumento (editable, no fijo).
 * El valor con aumento no se guarda: se calcula al responder.
 */
export default class extends BaseSchema {
  protected tableName = 'elemento'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('clasificacion', 20).nullable()
      table.decimal('valor_unitario_promedio', 14, 2).nullable()
      table.decimal('porcentaje_aumento', 6, 2).nullable()
    })

    this.defer(async (db) => {
      await db.rawQuery(`
        ALTER TABLE elemento
          ADD CONSTRAINT elemento_clasificacion_chk
          CHECK (clasificacion IS NULL OR clasificacion IN ('consumo', 'devolutivo'))
      `)
      await db.rawQuery(`
        ALTER TABLE elemento
          ADD CONSTRAINT elemento_valor_unitario_promedio_chk
          CHECK (valor_unitario_promedio IS NULL OR valor_unitario_promedio >= 0)
      `)
      await db.rawQuery(`
        ALTER TABLE elemento
          ADD CONSTRAINT elemento_porcentaje_aumento_chk
          CHECK (porcentaje_aumento IS NULL OR porcentaje_aumento >= 0)
      `)
    })
  }

  async down() {
    this.defer(async (db) => {
      await db.rawQuery(`ALTER TABLE elemento DROP CONSTRAINT IF EXISTS elemento_clasificacion_chk`)
      await db.rawQuery(
        `ALTER TABLE elemento DROP CONSTRAINT IF EXISTS elemento_valor_unitario_promedio_chk`
      )
      await db.rawQuery(
        `ALTER TABLE elemento DROP CONSTRAINT IF EXISTS elemento_porcentaje_aumento_chk`
      )
    })

    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('porcentaje_aumento')
      table.dropColumn('valor_unitario_promedio')
      table.dropColumn('clasificacion')
    })
  }
}
