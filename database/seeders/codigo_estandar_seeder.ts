import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { CODIGOS_ESTANDAR } from '#data/codigos_estandar'
import CodigoEstandar from '#models/codigo_estandar'
import TrainingCenter from '#models/training_center'

/**
 * Copies the UNSPSC catalog into the first training center. Other centers
 * start empty and create their own codes. Safe to run again: an existing
 * code in that center keeps its id and only the name is refreshed.
 */
export default class extends BaseSeeder {
  async run() {
    const center = await TrainingCenter.query().orderBy('id_cformacion', 'asc').first()
    if (!center) {
      return
    }

    for (const item of CODIGOS_ESTANDAR) {
      await CodigoEstandar.updateOrCreate(
        { codigo: item.codigo, idCformacion: center.id },
        { nombre: item.nombre }
      )
    }
  }
}
