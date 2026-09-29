import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { CLASIFICACIONES_ELEMENTO } from '#data/clasificaciones_elemento'
import ClasificacionElemento from '#models/clasificacion_elemento'
import TrainingCenter from '#models/training_center'

/**
 * Inserts the classifications for the first training center only. Other
 * centers start empty and create their own. Safe to run again: a name that
 * already exists in that center (ignoring case) is left as the user edited it.
 */
export default class extends BaseSeeder {
  async run() {
    const center = await TrainingCenter.query().orderBy('id_cformacion', 'asc').first()
    if (!center) {
      return
    }

    for (const item of CLASIFICACIONES_ELEMENTO) {
      const existing = await ClasificacionElemento.query()
        .where('id_cformacion', center.id)
        .whereRaw('lower(nombre) = lower(?)', [item.nombre])
        .first()

      if (!existing) {
        await ClasificacionElemento.create({
          idCformacion: center.id,
          nombre: item.nombre,
          estado: true,
        })
      }
    }
  }
}
