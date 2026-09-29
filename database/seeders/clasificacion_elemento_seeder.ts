import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { CLASIFICACIONES_ELEMENTO } from '#data/clasificaciones_elemento'
import ClasificacionElemento from '#models/clasificacion_elemento'

/**
 * Inserts the classifications from the unified inventory. Safe to run again:
 * a name that already exists (ignoring case) is left as the user edited it.
 */
export default class extends BaseSeeder {
  async run() {
    for (const item of CLASIFICACIONES_ELEMENTO) {
      const existing = await ClasificacionElemento.query()
        .whereRaw('lower(nombre) = lower(?)', [item.nombre])
        .first()

      if (!existing) {
        await ClasificacionElemento.create({ nombre: item.nombre, estado: true })
      }
    }
  }
}
