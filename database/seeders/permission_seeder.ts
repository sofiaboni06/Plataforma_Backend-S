import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Modulo from '#models/modulo'
import Permiso from '#models/permiso'
import { buildPermissionCatalog } from '#data/permission_catalog'

/**
 * Syncs the `permiso` table with the catalog defined in code. Safe to run as
 * many times as needed: known rows are refreshed and rows that no longer exist
 * in the catalog are deactivated instead of deleted, so profiles that still
 * reference them keep their history.
 */
export default class extends BaseSeeder {
  async run() {
    const catalog = buildPermissionCatalog()

    const modules = await Modulo.query()
      .whereIn('nombre', [...new Set(catalog.map((item) => item.module))])
      .select('id_modulo', 'nombre')

    const moduleIdByName = new Map(modules.map((modulo) => [modulo.nombre, modulo.id]))

    const missingModules = [
      ...new Set(catalog.map((item) => item.module).filter((name) => !moduleIdByName.has(name))),
    ]

    if (missingModules.length) {
      throw new Error(
        `No existe el módulo "${missingModules.join('", "')}" en la tabla modulo. ` +
          'Revisa que el nombre en permission_catalog.ts coincida con el del dump.'
      )
    }

    const existing = await Permiso.all()
    const existingByCode = new Map(existing.map((permiso) => [permiso.code, permiso]))

    for (const definition of catalog) {
      const current = existingByCode.get(definition.code)
      const attributes = {
        idModulo: moduleIdByName.get(definition.module)!,
        code: definition.code,
        recurso: definition.resource,
        accion: definition.action,
        nombre: definition.name,
        estado: true,
      }

      if (current) {
        current.merge(attributes)
        await current.save()
        continue
      }

      await Permiso.create(attributes)
    }

    const catalogCodes = new Set<string>(catalog.map((item) => item.code))
    const stale = existing.filter((permiso) => !catalogCodes.has(permiso.code) && permiso.estado)

    for (const permiso of stale) {
      permiso.estado = false
      await permiso.save()
    }
  }
}
