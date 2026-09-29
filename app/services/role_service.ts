import { Exception } from '@adonisjs/core/exceptions'
import Modulo from '#models/modulo'
import Perfil from '#models/perfil'
import Permiso from '#models/permiso'
import { buildModuleTree } from '#services/module_tree'

export default class RoleService {
  async list() {
    return Perfil.query().orderBy('id_perfil', 'asc')
  }

  async show(id: number) {
    const role = await Perfil.query()
      .where('id', id)
      .preload('modulos', (query) => {
        query.where('modulo.estado', true).wherePivot('estado', true)
      })
      .preload('permisos', (query) => {
        query.where('permiso.estado', true).wherePivot('estado', true)
      })
      .first()

    if (!role) {
      throw new Exception('El perfil no existe', { status: 404, code: 'E_NOT_FOUND' })
    }

    const catalog = await Modulo.query().where('estado', true).orderBy('id_modulo', 'asc')
    const grantedIds = new Set(role.modulos.map((item) => item.id))

    return {
      role,
      moduleIds: [...grantedIds],
      permissionCodes: role.permisos.map((item) => item.code),
      tree: buildModuleTree(catalog, grantedIds),
    }
  }

  async create(payload: { name: string; description?: string }) {
    const exists = await Perfil.query().where('nombre', payload.name).first()
    if (exists) {
      throw new Exception('Ya existe un perfil con ese nombre', {
        status: 422,
        code: 'E_VALIDATION_ERROR',
      })
    }

    return Perfil.create({
      nombre: payload.name,
      descripcion: payload.description ?? null,
      estado: true,
    })
  }

  async update(
    id: number,
    payload: { name?: string; description?: string; active?: boolean }
  ) {
    const role = await Perfil.find(id)
    if (!role) {
      throw new Exception('El perfil no existe', { status: 404, code: 'E_NOT_FOUND' })
    }

    if (payload.name && payload.name !== role.nombre) {
      const exists = await Perfil.query().where('nombre', payload.name).whereNot('id', id).first()
      if (exists) {
        throw new Exception('Ya existe un perfil con ese nombre', {
          status: 422,
          code: 'E_VALIDATION_ERROR',
        })
      }
    }

    role.merge({
      ...(payload.name !== undefined ? { nombre: payload.name } : {}),
      ...(payload.description !== undefined ? { descripcion: payload.description } : {}),
      ...(payload.active !== undefined ? { estado: payload.active } : {}),
    })
    await role.save()
    return role
  }

  async assignModules(id: number, moduleIds: number[]) {
    const role = await Perfil.find(id)
    if (!role) {
      throw new Exception('El perfil no existe', { status: 404, code: 'E_NOT_FOUND' })
    }

    const uniqueIds = [...new Set(moduleIds)]

    if (uniqueIds.length) {
      const found = await Modulo.query().whereIn('id', uniqueIds).where('estado', true)
      if (found.length !== uniqueIds.length) {
        throw new Exception('Hay un módulo que no existe o está inactivo', {
          status: 422,
          code: 'E_VALIDATION_ERROR',
        })
      }
    }

    const pivot = Object.fromEntries(uniqueIds.map((moduleId) => [moduleId, { estado: true }]))
    await role.related('modulos').sync(pivot)
    await this.pruneOrphanPermissions(role, uniqueIds)

    return this.show(id)
  }

  async assignPermissions(id: number, permissionCodes: string[]) {
    const role = await Perfil.find(id)
    if (!role) {
      throw new Exception('El perfil no existe', { status: 404, code: 'E_NOT_FOUND' })
    }

    const uniqueCodes = [...new Set(permissionCodes)]

    if (uniqueCodes.length) {
      const found = await Permiso.query().whereIn('codigo', uniqueCodes).where('estado', true)
      const foundCodes = new Set<string>(found.map((permiso) => permiso.code))
      const unknown = uniqueCodes.filter((code) => !foundCodes.has(code))

      if (unknown.length) {
        throw new Exception(
          `Estos permisos no existen o están inactivos: ${unknown.join(', ')}`,
          { status: 422, code: 'E_VALIDATION_ERROR' }
        )
      }

      const grantedModuleIds = await this.grantedModuleIds(role)
      const outsideModules = found.filter((permiso) => !grantedModuleIds.includes(permiso.idModulo))

      if (outsideModules.length) {
        throw new Exception(
          `El perfil no tiene acceso al módulo de estos permisos: ${outsideModules
            .map((permiso) => permiso.code)
            .join(', ')}. Asigna primero el módulo.`,
          { status: 422, code: 'E_VALIDATION_ERROR' }
        )
      }
    }

    const pivot = Object.fromEntries(uniqueCodes.map((code) => [code, { estado: true }]))
    await role.related('permisos').sync(pivot)

    return this.show(id)
  }

  private async grantedModuleIds(role: Perfil) {
    const modulos = await role
      .related('modulos')
      .query()
      .wherePivot('estado', true)
      .where('modulo.estado', true)
      .select('modulo.id_modulo')

    return modulos.map((modulo) => modulo.id)
  }

  /**
   * Revoking a module must drop the permissions that hang from it, otherwise a
   * profile would keep hitting the API for a module it can no longer see.
   */
  private async pruneOrphanPermissions(role: Perfil, grantedModuleIds: number[]) {
    const permisos = await role
      .related('permisos')
      .query()
      .select('permiso.codigo', 'permiso.id_modulo')

    const orphans = permisos
      .filter((permiso) => !grantedModuleIds.includes(permiso.idModulo))
      .map((permiso) => permiso.code)

    if (orphans.length) {
      await role.related('permisos').detach(orphans)
    }
  }
}
