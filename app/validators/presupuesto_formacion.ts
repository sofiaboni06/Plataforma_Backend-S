import vine from '@vinejs/vine'

export const montoPresupuestoValidator = vine.compile(
  vine.object({
    anio: vine.number().positive().withoutDecimals(),
    monto: vine.number().min(0),
  })
)

export const repartoPresupuestoValidator = vine.compile(
  vine.object({
    anio: vine.number().positive().withoutDecimals(),
    fichas: vine.array(
      vine.object({
        fichaId: vine.number().positive().withoutDecimals(),
        monto: vine.number().min(0),
      })
    ),
  })
)

export const lotePresupuestoValidator = vine.compile(
  vine.object({
    anio: vine.number().positive().withoutDecimals(),
    nombre: vine.string().trim().minLength(1).maxLength(80),
  })
)
