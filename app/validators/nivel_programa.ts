import vine from '@vinejs/vine'

export const createNivelProgramaValidator = vine.compile(
  vine.object({
    nombre: vine.string().trim().minLength(1).maxLength(100),
  })
)

export const updateNivelProgramaValidator = vine.compile(
  vine.object({
    nombre: vine.string().trim().minLength(1).maxLength(100).optional(),
  })
)
