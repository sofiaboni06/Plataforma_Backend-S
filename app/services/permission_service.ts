import Permiso from '#models/permiso'
import {
  ACTION_LABELS,
  PERMISSION_RESOURCES,
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
}

function resourceLabel(recurso: PermissionResource) {
  return PERMISSION_RESOURCES[recurso]?.label ?? recurso
}
