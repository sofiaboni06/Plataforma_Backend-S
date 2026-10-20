
import vine from '@vinejs/vine'

export const createRedConocimientoValidator = vine.compile(
  vine.object({
    redConocimiento: vine.string().trim().minLength(1).maxLength(150),
    nombreGestor: vine.string().trim().maxLength(150),
    telGestor: vine.string().trim().maxLength(30),
    mailGestor: vine.string().trim().email().maxLength(150),
    nombreAsesor: vine.string().trim().maxLength(150),
    telAsesor: vine.string().trim().maxLength(30),
    mailAsesor: vine.string().trim().email().maxLength(150),
    estado: vine.boolean().optional(),
    lineasTematicas: vine.array(vine.number().positive().withoutDecimals()).optional(),
  })
)

export const updateRedConocimientoValidator = vine.compile(
  vine.object({
    redConocimiento: vine.string().trim().minLength(1).maxLength(150).optional(),
    nombreGestor: vine.string().trim().maxLength(150).optional(),
    telGestor: vine.string().trim().maxLength(30).optional(),
    mailGestor: vine.string().trim().email().maxLength(150).optional(),
    nombreAsesor: vine.string().trim().maxLength(150).optional(),
    telAsesor: vine.string().trim().maxLength(30).optional(),
    mailAsesor: vine.string().trim().email().maxLength(150).optional(),
    estado: vine.boolean().optional(),
    lineasTematicas: vine.array(vine.number().positive().withoutDecimals()).optional(),
  })
)
