import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Fechas de las solicitudes. Solo agrega columnas (todas `date` y nullable):
 * no crea tablas ni cambia datos. Las solicitudes viejas quedan sin fechas.
 *
 * solicitud_equipo (préstamo de devolutivos):
 * - fecha_inicio: desde cuándo lo necesita el instructor (inicio del préstamo).
 * - fecha_devolucion_propuesta: hasta cuándo lo pide el instructor al hacer la solicitud.
 * - fecha_devolucion_limite: la que bodega confirma o ajusta al entregar. Desde
 *   ese día, mientras quede equipo afuera, se avisa todos los días.
 *   (fecha_devolucion, que ya existía, sigue siendo cuándo volvió de verdad.)
 *
 * solicitud_material (consumo, no se devuelve):
 * - fecha_inicio y fecha_entrega_requerida: ya no se usan. El consumo se
 *   entrega y ya, sin fechas; las columnas quedan vacías para no tener que
 *   migrar otra vez. (fecha_entrega, que ya existía, sigue siendo cuándo salió.)
 */
export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      await db.rawQuery(`
        ALTER TABLE solicitud_equipo
          ADD COLUMN IF NOT EXISTS fecha_inicio date NULL,
          ADD COLUMN IF NOT EXISTS fecha_devolucion_propuesta date NULL,
          ADD COLUMN IF NOT EXISTS fecha_devolucion_limite date NULL
      `)
      await db.rawQuery(`
        ALTER TABLE solicitud_material
          ADD COLUMN IF NOT EXISTS fecha_inicio date NULL,
          ADD COLUMN IF NOT EXISTS fecha_entrega_requerida date NULL
      `)
    })
  }

  async down() {
    this.defer(async (db) => {
      await db.rawQuery(`
        ALTER TABLE solicitud_equipo
          DROP COLUMN IF EXISTS fecha_inicio,
          DROP COLUMN IF EXISTS fecha_devolucion_propuesta,
          DROP COLUMN IF EXISTS fecha_devolucion_limite
      `)
      await db.rawQuery(`
        ALTER TABLE solicitud_material
          DROP COLUMN IF EXISTS fecha_inicio,
          DROP COLUMN IF EXISTS fecha_entrega_requerida
      `)
    })
  }
}
