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

export const createVigenciaEspecialValidator = vine.compile(
  vine.object({
    nombre: vine.string().trim().minLength(3).maxLength(120),
    monto: vine.number().min(0).optional(),
  })
)

export const updateVigenciaEspecialValidator = vine.compile(
  vine.object({
    nombre: vine.string().trim().minLength(3).maxLength(120).optional(),
    monto: vine.number().min(0).optional(),
    activa: vine.boolean().optional(),
  })
)

export const programaVigenciaEspecialValidator = vine.compile(
  vine.object({
    programaId: vine
      .number()
      .withoutDecimals()
      .positive()
      .exists({ table: 'programa_formacion', column: 'id_programa_formacion' }),
  })
)

export const repartoVigenciaEspecialValidator = vine.compile(
  vine.object({
    idUsuario: vine.number().withoutDecimals().positive().optional(),
    redId: vine.number().withoutDecimals().positive().optional(),
    monto: vine.number().min(0),
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
