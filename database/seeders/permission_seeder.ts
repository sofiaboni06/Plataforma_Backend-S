import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Permiso from '#models/permiso'
import PermissionService from '#services/permission_service'
import { buildPermissionCatalog } from '#data/permission_catalog'

/**
 * Syncs the `permiso` table with the catalog defined in code. Safe to run as
 * many times as needed: known rows are refreshed and rows that no longer exist
 * in the catalog are deactivated instead of deleted, so profiles that still
 * reference them keep their history.
 */
export default class extends BaseSeeder {
  async run() {
    await new PermissionService().syncFromCatalog()

    const catalogCodes = new Set<string>(buildPermissionCatalog().map((item) => item.code))
    const stale = (await Permiso.all()).filter(
      (permiso) => !catalogCodes.has(permiso.code) && permiso.estado,
    )

    for (const permiso of stale) {
      permiso.estado = false
      await permiso.save()
    }
  }
}
