/**
 * Source of truth for the permission catalog. The `permiso` table is filled
 * from here by `database/seeders/permission_seeder.ts`, so adding a resource or
 * an action means editing this file and running `node ace db:seed` again.
 *
 * `module` must match `modulo.nombre` in the dump, since permissions hang from
 * the module a profile was granted.
 */
export const PERMISSION_ACTIONS = ['ver', 'crear', 'editar', 'eliminar', 'entregar', 'devolver'] as const

export type PermissionAction = (typeof PERMISSION_ACTIONS)[number]

export const ACTION_LABELS: Record<PermissionAction, string> = {
  ver: 'Ver',
  crear: 'Crear',
  editar: 'Editar',
  eliminar: 'Eliminar',
  entregar: 'Entregar',
  devolver: 'Devolver',
}

export const PERMISSION_RESOURCES = {
  bodega: {
    module: 'Inventario',
    label: 'Bodegas',
    actions: ['ver', 'crear', 'editar', 'eliminar'],
  },
  stand: {
    module: 'Inventario',
    label: 'Stands',
    actions: ['ver', 'crear', 'editar', 'eliminar'],
  },
  categoria: {
    module: 'Inventario',
    label: 'Categorías',
    actions: ['ver', 'crear', 'editar', 'eliminar'],
  },
  subcategoria: {
    module: 'Inventario',
    label: 'Subcategorías',
    actions: ['ver', 'crear', 'editar'],
  },
  elemento: {
    module: 'Inventario',
    label: 'Elementos',
    actions: ['ver', 'crear', 'editar', 'eliminar'],
  },
  item: {
    module: 'Inventario',
    label: 'Items',
    actions: ['ver', 'crear', 'editar', 'eliminar'],
  },
  unidad_medida: {
    module: 'Inventario',
    label: 'Unidades de medida',
    actions: ['ver', 'crear', 'editar', 'eliminar'],
  },
  codigo_estandar: {
    module: 'Inventario',
    label: 'Códigos UNSPSC',
    actions: ['crear', 'editar', 'eliminar'],
  },
  clasificacion_elemento: {
    module: 'Inventario',
    label: 'Clasificaciones de elemento',
    actions: ['ver', 'crear', 'editar', 'eliminar'],
  },
  uso_presupuestal: {
    module: 'Inventario',
    label: 'Usos presupuestales',
    actions: ['ver', 'crear', 'editar', 'eliminar'],
  },
  obra: {
    module: 'Inventario',
    label: 'Obras',
    actions: ['ver', 'crear', 'editar', 'eliminar'],
  },
  solicitud_material: {
    module: 'Inventario',
    label: 'Solicitudes de material',
    actions: ['ver', 'crear', 'entregar'],
  },
  solicitud_equipo: {
    module: 'Inventario',
    label: 'Solicitudes de equipo',
    actions: ['ver', 'crear', 'entregar', 'devolver'],
  },
  alerta: {
    module: 'Inventario',
    label: 'Alertas',
    actions: ['ver'],
  },
} as const

type PermissionResources = typeof PERMISSION_RESOURCES

export type PermissionResource = keyof PermissionResources

/**
 * Pedir, entregar, devolver y las alertas de stock son del centro: las ve
 * quien pide o quien atiende la bodega. El administrador de la plataforma no
 * las recibe aunque se salte el resto de permisos.
 */
export const CENTER_ONLY_RESOURCES: ReadonlySet<PermissionResource> = new Set([
  'solicitud_material',
  'solicitud_equipo',
  'alerta',
])

export function isCenterOnlyCode(code: string) {
  return CENTER_ONLY_RESOURCES.has(code.split('.')[0] as PermissionResource)
}

export type PermissionCode = {
  [R in PermissionResource]: `${R}.${PermissionResources[R]['actions'][number]}`
}[PermissionResource]

export type PermissionDefinition = {
  code: PermissionCode
  module: string
  resource: PermissionResource
  action: PermissionAction
  name: string
}

export function buildPermissionCatalog(): PermissionDefinition[] {
  const definitions: PermissionDefinition[] = []

  for (const [resource, config] of Object.entries(PERMISSION_RESOURCES)) {
    for (const action of config.actions) {
      definitions.push({
        code: `${resource}.${action}` as PermissionCode,
        module: config.module,
        resource: resource as PermissionResource,
        action,
        name: `${ACTION_LABELS[action]} ${config.label.toLowerCase()}`,
      })
    }
  }

  return definitions
}
