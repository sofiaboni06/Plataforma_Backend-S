import PermissionService from '#services/permission_service'
import type { HttpContext } from '@adonisjs/core/http'

export default class PermissionsController {
  async index({ serialize }: HttpContext) {
    const modules = await new PermissionService().catalog()
    return serialize({ modules })
  }
}
