import vine from '@vinejs/vine'

export const createCodigoEstandarValidator = vine.compile(
  vine.object({
    codigo: vine.string().trim().minLength(1).maxLength(20),
    nombre: vine.string().trim().minLength(1).maxLength(200),
  })
)

export const updateCodigoEstandarValidator = vine.compile(
  vine.object({
    codigo: vine.string().trim().minLength(1).maxLength(20).optional(),
    nombre: vine.string().trim().minLength(1).maxLength(200).optional(),
  })
)
