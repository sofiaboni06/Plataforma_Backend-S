import vine from '@vinejs/vine'

export const searchAssistantSourceValidator = vine.compile(
  vine.object({
    pregunta: vine.string().trim().minLength(1).maxLength(1000),
  })
)

export const createAssistantSourceValidator = vine.compile(
  vine.object({
    titulo: vine.string().trim().minLength(1).maxLength(200),
    modulo: vine.string().trim().minLength(1).maxLength(120),
    contenido: vine.string().trim().minLength(1).maxLength(5000),
    estado: vine.boolean().optional(),
  })
)

export const updateAssistantSourceValidator = vine.compile(
  vine.object({
    titulo: vine.string().trim().minLength(1).maxLength(200).optional(),
    modulo: vine.string().trim().minLength(1).maxLength(120).optional(),
    contenido: vine.string().trim().minLength(1).maxLength(5000).optional(),
    estado: vine.boolean().optional(),
  })
)
