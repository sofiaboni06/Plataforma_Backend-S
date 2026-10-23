import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Pedido de formación al coordinador y su decisión al instructor.
 * Reusa la bandeja `notificacion`; solo se amplían los CHECK.
 */
export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      await db.rawQuery(`ALTER TABLE notificacion DROP CONSTRAINT IF EXISTS notificacion_tipo_chk`)
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
            'devolucion_equipo',
            'solicitud_programa',
            'decision_solicitud_programa'
          ))
      `)
      await db.rawQuery(`ALTER TABLE notificacion DROP CONSTRAINT IF EXISTS notificacion_recurso_chk`)
      await db.rawQuery(`
        ALTER TABLE notificacion
          ADD CONSTRAINT notificacion_recurso_chk
          CHECK (
            recurso IS NULL
            OR recurso IN ('alerta', 'solicitud_material', 'solicitud_equipo', 'solicitud_programa')
          )
      `)
    })
  }

  async down() {
    this.defer(async (db) => {
      await db.rawQuery(`ALTER TABLE notificacion DROP CONSTRAINT IF EXISTS notificacion_tipo_chk`)
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
      await db.rawQuery(`ALTER TABLE notificacion DROP CONSTRAINT IF EXISTS notificacion_recurso_chk`)
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
}
