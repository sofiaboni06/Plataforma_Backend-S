import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { USOS_PRESUPUESTALES } from '#data/usos_presupuestales'
import UsoPresupuestal from '#models/uso_presupuestal'

/**
 * The budget-use list is the same for every training center. Safe to run
 * again: a name that already exists (ignoring case) is left as it was edited.
 */
export default class extends BaseSeeder {
  async run() {
    for (const item of USOS_PRESUPUESTALES) {
      const existing = await UsoPresupuestal.query()
        .whereRaw('lower(nombre) = lower(?)', [item.nombre])
        .first()

      if (!existing) {
        await UsoPresupuestal.create({
          nombre: item.nombre,
          estado: true,
        })
      }
    }
  }
}
