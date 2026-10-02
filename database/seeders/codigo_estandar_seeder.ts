import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { CODIGOS_ESTANDAR } from '#data/codigos_estandar'
import CodigoEstandar from '#models/codigo_estandar'

/**
 * The UNSPSC list is the same for every training center. Safe to run again:
 * an existing code keeps its id and only the name is refreshed.
 */
export default class extends BaseSeeder {
  async run() {
    for (const item of CODIGOS_ESTANDAR) {
      await CodigoEstandar.updateOrCreate({ codigo: item.codigo }, { nombre: item.nombre })
    }
  }
}
