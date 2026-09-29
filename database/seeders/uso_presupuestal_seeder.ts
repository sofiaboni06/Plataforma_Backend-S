import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { USOS_PRESUPUESTALES } from '#data/usos_presupuestales'
import TrainingCenter from '#models/training_center'
import UsoPresupuestal from '#models/uso_presupuestal'

/**
 * Inserts the budget uses for the first training center only. Other centers
 * start empty and create their own. Safe to run again: a name that already
 * exists in that center (ignoring case) is left as the user edited it.
 */
export default class extends BaseSeeder {
  async run() {
    const center = await TrainingCenter.query().orderBy('id_cformacion', 'asc').first()
    if (!center) {
      return
    }

    for (const item of USOS_PRESUPUESTALES) {
      const existing = await UsoPresupuestal.query()
        .where('id_cformacion', center.id)
        .whereRaw('lower(nombre) = lower(?)', [item.nombre])
        .first()

      if (!existing) {
        await UsoPresupuestal.create({
          idCformacion: center.id,
          nombre: item.nombre,
          estado: true,
        })
      }
    }
  }
}
