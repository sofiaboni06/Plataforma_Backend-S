import Modulo from '#models/modulo'
import Permiso from '#models/permiso'
import {
  ACTION_LABELS,
  PERMISSION_RESOURCES,
  buildPermissionCatalog,
  type PermissionResource,
} from '#data/permission_catalog'

type PermissionNode = {
  id: number
  code: string
  action: string
  actionLabel: string
  name: string
}

type ResourceNode = {
  resource: string
  label: string
  permissions: PermissionNode[]
}

type ModuleNode = {
  id: number
  name: string
  resources: ResourceNode[]
}

export default class PermissionService {
  async list() {
    return Permiso.query().where('estado', true).orderBy('id_permiso', 'asc')
  }

  /**
   * Shape the admin UI consumes to render the permission checkboxes: module →
   * resource → one entry per action.
   */
  async catalog(): Promise<ModuleNode[]> {
    const permisos = await Permiso.query()
      .where('permiso.estado', true)
      .preload('modulo')
      .orderBy('id_permiso', 'asc')

    const modules = new Map<number, ModuleNode>()

    for (const permiso of permisos) {
      let moduleNode = modules.get(permiso.idModulo)

      if (!moduleNode) {
        moduleNode = {
          id: permiso.idModulo,
          name: permiso.modulo?.nombre ?? '',
          resources: [],
        }
        modules.set(permiso.idModulo, moduleNode)
      }

      let resourceNode = moduleNode.resources.find((item) => item.resource === permiso.recurso)

      if (!resourceNode) {
        resourceNode = {
          resource: permiso.recurso,
          label: resourceLabel(permiso.recurso),
          permissions: [],
        }
        moduleNode.resources.push(resourceNode)
      }

      resourceNode.permissions.push({
        id: permiso.id,
        code: permiso.code,
        action: permiso.accion,
        actionLabel: ACTION_LABELS[permiso.accion] ?? permiso.accion,
        name: permiso.nombre,
      })
    }

    return [...modules.values()]
  }

  /**
   * Crea los módulos que falten y deja `permiso` al día con el catálogo.
   * Así Perfiles muestra lista maestra, solicitudes y compras sin depender
   * de que alguien recuerde correr el seeder.
   */
  async syncFromCatalog() {
    const catalog = buildPermissionCatalog()
    const moduleIdByName = new Map<string, number>()

    for (const nombre of new Set(catalog.map((item) => item.module))) {
      const existing = await Modulo.query().whereILike('nombre', nombre).first()
      const modulo =
        existing ??
        (await Modulo.create({
          nombre,
          descripcion: `Permisos de ${nombre}`,
          estado: true,
        }))
      moduleIdByName.set(nombre, modulo.id)
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
  }
}

function resourceLabel(recurso: PermissionResource) {
  return PERMISSION_RESOURCES[recurso]?.label ?? recurso
}
