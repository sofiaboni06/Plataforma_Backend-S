import vine from '@vinejs/vine'

export const createLineaTematicaValidator = vine.compile(
  vine.object({
    nombre: vine.string().trim().minLength(1).maxLength(150),
    descripcion: vine.string().trim().maxLength(1000).nullable().optional(),
    estado: vine.boolean().optional(),
  })
)

export const updateLineaTematicaValidator = vine.compile(
  vine.object({
    nombre: vine.string().trim().minLength(1).maxLength(150).optional(),
    descripcion: vine.string().trim().maxLength(1000).nullable().optional(),
    estado: vine.boolean().optional(),
  })
)
