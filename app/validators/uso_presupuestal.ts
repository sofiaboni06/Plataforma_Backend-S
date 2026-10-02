import vine from '@vinejs/vine'

export const createUsoPresupuestalValidator = vine.compile(
  vine.object({
    nombre: vine.string().trim().minLength(1).maxLength(200),
    estado: vine.boolean().optional(),
  })
)

export const updateUsoPresupuestalValidator = vine.compile(
  vine.object({
    nombre: vine.string().trim().minLength(1).maxLength(200).optional(),
    estado: vine.boolean().optional(),
  })
)
