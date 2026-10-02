import vine from '@vinejs/vine'

export const createUnidadMedidaValidator = vine.compile(
  vine.object({
    nombre: vine.string().trim().minLength(1).maxLength(80),
    abreviatura: vine.string().trim().minLength(1).maxLength(20),
    estado: vine.boolean().optional(),
  })
)

export const updateUnidadMedidaValidator = vine.compile(
  vine.object({
    nombre: vine.string().trim().minLength(1).maxLength(80).optional(),
    abreviatura: vine.string().trim().minLength(1).maxLength(20).optional(),
    estado: vine.boolean().optional(),
  })
)
