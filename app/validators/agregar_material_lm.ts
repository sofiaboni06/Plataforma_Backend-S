import vine from '@vinejs/vine'

export const listarAgregarMaterialLmValidator = vine.compile(
  vine.object({
    programaId: vine.number().positive(),
    centroId: vine.number().positive().optional(),
  })
)

export const crearAgregarMaterialLmValidator = vine.compile(
  vine.object({
    programaId: vine.number().positive(),
    centroId: vine.number().positive().nullable().optional(),
    elementoId: vine.number().positive(),
    cantidadBase: vine.number().positive().optional(),
    observaciones: vine.string().trim().maxLength(500).nullable().optional(),
  })
)

export const actualizarAgregarMaterialLmValidator = vine.compile(
  vine.object({
    programaId: vine.number().positive().optional(),
    centroId: vine.number().positive().nullable().optional(),
    elementoId: vine.number().positive().optional(),
    cantidadBase: vine.number().positive().optional(),
    observaciones: vine.string().trim().maxLength(500).nullable().optional(),
    estado: vine.boolean().optional(),
  })
)