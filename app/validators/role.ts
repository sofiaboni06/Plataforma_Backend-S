import vine from '@vinejs/vine'

export const createRoleValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(100),
  description: vine.string().trim().maxLength(500).optional(),
})

export const updateRoleValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(100).optional(),
  description: vine.string().trim().maxLength(500).optional(),
  active: vine.boolean().optional(),
})

export const assignModulesValidator = vine.create({
  moduleIds: vine.array(vine.number().positive()),
})

export const assignPermissionsValidator = vine.create({
  permissionCodes: vine.array(vine.string().trim().minLength(1).maxLength(80)),
})

export const createCatalogModuleValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(100),
  description: vine.string().trim().maxLength(500).optional(),
  parentId: vine.number().positive().optional(),
})
