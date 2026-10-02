import vine from '@vinejs/vine'

export const createClasificacionElementoValidator = vine.compile(
  vine.object({
    nombre: vine.string().trim().minLength(1).maxLength(150),
    caracter: vine.enum(['consumo', 'devolutivo']),
    estado: vine.boolean().optional(),
  })
)

export const updateClasificacionElementoValidator = vine.compile(
  vine.object({
    nombre: vine.string().trim().minLength(1).maxLength(150).optional(),
    caracter: vine.enum(['consumo', 'devolutivo']).optional(),
    estado: vine.boolean().optional(),
  })
)
