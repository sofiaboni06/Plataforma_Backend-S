import vine from '@vinejs/vine'

/** Día de calendario `YYYY-MM-DD`; el servicio revisa que el orden tenga sentido. */
const dia = () =>
  vine
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/)

export const createFichaValidator = vine.compile(
  vine.object({
    idPrograma: vine
      .number()
      .positive()
      .withoutDecimals()
      .exists({ table: 'programa_formacion', column: 'id_programa_formacion' }),
    idJornada: vine
      .number()
      .positive()
      .withoutDecimals()
      .exists({ table: 'jornada', column: 'id_jornada' })
      .nullable()
      .optional(),
    idCformacion: vine
      .number()
      .positive()
      .withoutDecimals()
      .exists({ table: 'c_formacion', column: 'id_cformacion' })
      .optional(),
    numeroFicha: vine.string().trim().minLength(1).maxLength(30),
    fechaInicio: dia().nullable().optional(),
    fechaFin: dia().nullable().optional(),
    cupoAprendices: vine.number().positive().withoutDecimals().optional(),
    estado: vine.boolean().optional(),
  })
)

export const updateFichaValidator = vine.compile(
  vine.object({
    idPrograma: vine
      .number()
      .positive()
      .withoutDecimals()
      .exists({ table: 'programa_formacion', column: 'id_programa_formacion' })
      .optional(),
    idJornada: vine
      .number()
      .positive()
      .withoutDecimals()
      .exists({ table: 'jornada', column: 'id_jornada' })
      .nullable()
      .optional(),
    idCformacion: vine
      .number()
      .positive()
      .withoutDecimals()
      .exists({ table: 'c_formacion', column: 'id_cformacion' })
      .optional(),
    numeroFicha: vine.string().trim().minLength(1).maxLength(30).optional(),
    fechaInicio: dia().nullable().optional(),
    fechaFin: dia().nullable().optional(),
    cupoAprendices: vine.number().positive().withoutDecimals().optional(),
    estado: vine.boolean().optional(),
  })
)
