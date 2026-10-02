import vine from '@vinejs/vine'

const estados = ['prestado', 'devuelto', 'consumido'] as const

export const createPrestamoValidator = vine.compile(
  vine.object({
    idElemento: vine.number().positive(),
    idUsuario: vine.number().positive(),
    idActividad: vine.number().positive(),
    cantidad: vine.number().positive(),
    ficha: vine.string().trim().maxLength(50).optional(),
    observacion: vine.string().trim().optional(),
    estado: vine.enum(estados).optional(),
  }),
)

export const updatePrestamoValidator = vine.compile(
  vine.object({
    idActividad: vine.number().positive().optional(),
    ficha: vine.string().trim().maxLength(50).optional(),
    observacion: vine.string().trim().optional(),
    estado: vine.enum(estados).optional(),
  }),
)

export const updatePrestamoEstadoValidator = vine.compile(
  vine.object({
    estado: vine.enum(estados),
  }),
)