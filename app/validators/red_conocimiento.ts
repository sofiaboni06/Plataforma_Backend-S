import vine from '@vinejs/vine'

const lineaIds = vine.array(vine.number().positive().withoutDecimals()).distinct().optional()

export const createRedConocimientoValidator = vine.compile(
  vine.object({
    nombre: vine.string().trim().minLength(1).maxLength(150),
    nombreGestor: vine.string().trim().maxLength(150).nullable().optional(),
    telGestor: vine.string().trim().maxLength(30).nullable().optional(),
    mailGestor: vine.string().trim().email().maxLength(150).nullable().optional(),
    nombreAsesor: vine.string().trim().maxLength(150).nullable().optional(),
    telAsesor: vine.string().trim().maxLength(30).nullable().optional(),
    mailAsesor: vine.string().trim().email().maxLength(150).nullable().optional(),
    estado: vine.boolean().optional(),
    lineaIds,
  })
)

export const updateRedConocimientoValidator = vine.compile(
  vine.object({
    nombre: vine.string().trim().minLength(1).maxLength(150).optional(),
    nombreGestor: vine.string().trim().maxLength(150).nullable().optional(),
    telGestor: vine.string().trim().maxLength(30).nullable().optional(),
    mailGestor: vine.string().trim().email().maxLength(150).nullable().optional(),
    nombreAsesor: vine.string().trim().maxLength(150).nullable().optional(),
    telAsesor: vine.string().trim().maxLength(30).nullable().optional(),
    mailAsesor: vine.string().trim().email().maxLength(150).nullable().optional(),
    estado: vine.boolean().optional(),
    lineaIds,
  })
)

export const syncLineasTematicasValidator = vine.compile(
  vine.object({
    lineaIds: vine.array(vine.number().positive().withoutDecimals()).distinct(),
  })
)
