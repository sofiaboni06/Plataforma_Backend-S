import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { USOS_PRESUPUESTALES } from '#data/usos_presupuestales'
import UsoPresupuestal from '#models/uso_presupuestal'

/**
 * Inserts the budget uses from the technical sheet. Safe to run again:
 * a name that already exists (ignoring case) is left as the user edited it.
 */
export default class extends BaseSeeder {
  async run() {
    for (const item of USOS_PRESUPUESTALES) {
      const existing = await UsoPresupuestal.query()
        .whereRaw('lower(nombre) = lower(?)', [item.nombre])
        .first()

      if (!existing) {
        await UsoPresupuestal.create({ nombre: item.nombre, estado: true })
      }
    }
  }
}
