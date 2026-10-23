import { BaseSchema } from '@adonisjs/lucid/schema'
import PermissionService from '#services/permission_service'

/**
 * El front de Perfiles lee `permiso`, no el catálogo en código.
 * Si el seeder no se corrió, lista maestra no aparece. Esta migración
 * crea el módulo y las filas que falten.
 */
export default class extends BaseSchema {
  async up() {
    this.defer(async () => {
      await new PermissionService().syncFromCatalog()
    })
  }

  async down() {}
}
