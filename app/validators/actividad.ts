import vine from '@vinejs/vine'

export const createActividadValidator = vine.compile(
  vine.object({
    nombre: vine.string().trim().minLength(1).maxLength(200),
    lugar: vine.string().trim().maxLength(200).optional(),
    estado: vine.boolean().optional(),
  }),
)

export const updateActividadValidator = vine.compile(
  vine.object({
    nombre: vine.string().trim().minLength(1).maxLength(200).optional(),
    lugar: vine.string().trim().maxLength(200).optional(),
    estado: vine.boolean().optional(),
  }),
)