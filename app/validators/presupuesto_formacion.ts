import vine from '@vinejs/vine'

export const montoPresupuestoValidator = vine.compile(
  vine.object({
    anio: vine.number().positive().withoutDecimals(),
    monto: vine.number().min(0),
  })
)

export const asignacionCoordinadorValidator = vine.compile(
  vine.object({
    anio: vine.number().positive().withoutDecimals(),
    idUsuario: vine.number().positive().withoutDecimals(),
    monto: vine.number().min(0),
  })
)

export const asignacionAreaValidator = vine.compile(
  vine.object({
    anio: vine.number().positive().withoutDecimals(),
    redId: vine.number().positive().withoutDecimals(),
    monto: vine.number().min(0),
  })
)

export const lotePresupuestoValidator = vine.compile(
  vine.object({
    anio: vine.number().positive().withoutDecimals(),
    nombre: vine.string().trim().minLength(1).maxLength(80),
  })
)
