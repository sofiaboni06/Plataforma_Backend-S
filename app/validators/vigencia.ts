import vine from '@vinejs/vine'

export const createVigenciaValidator = vine.compile(
  vine.object({
    anio: vine.number().withoutDecimals().min(2020).max(2100),
    activa: vine.boolean().optional(),
    fechaApertura: vine.date({ formats: ['YYYY-MM-DD', 'iso8601'] }).nullable().optional(),
    fechaCierre: vine.date({ formats: ['YYYY-MM-DD', 'iso8601'] }).nullable().optional(),
    fecha_apertura: vine.date({ formats: ['YYYY-MM-DD', 'iso8601'] }).nullable().optional(),
    fecha_cierre: vine.date({ formats: ['YYYY-MM-DD', 'iso8601'] }).nullable().optional(),
  })
)

export const updateVigenciaValidator = vine.compile(
  vine.object({
    activa: vine.boolean().optional(),
    fechaApertura: vine.date({ formats: ['YYYY-MM-DD', 'iso8601'] }).nullable().optional(),
    fechaCierre: vine.date({ formats: ['YYYY-MM-DD', 'iso8601'] }).nullable().optional(),
    fecha_apertura: vine.date({ formats: ['YYYY-MM-DD', 'iso8601'] }).nullable().optional(),
    fecha_cierre: vine.date({ formats: ['YYYY-MM-DD', 'iso8601'] }).nullable().optional(),
  })
)
