import vine from '@vinejs/vine'

export const createProgramaFormacionValidator = vine.compile(
  vine.object({
    idRedConocimiento: vine
      .number()
      .positive()
      .withoutDecimals()
      .exists({ table: 'redes_conocimiento', column: 'id_red_conocimiento' }),
    idLineaTematica: vine
      .number()
      .positive()
      .withoutDecimals()
      .exists({ table: 'lineas_tematicas', column: 'id_linea_tematica' }),
    idNivelPrograma: vine
      .number()
      .positive()
      .withoutDecimals()
      .exists({ table: 'nivel_programa', column: 'id_nivel_programa' }),
    codigo: vine.string().trim().minLength(1).maxLength(30),
    nombre: vine.string().trim().minLength(1).maxLength(200),
    version: vine.string().trim().minLength(1).maxLength(20),
    duracionTotalHoras: vine.number().positive().withoutDecimals().nullable().optional(),
    cupoBaseAprendices: vine.number().positive().withoutDecimals().optional(),
    centroIds: vine
      .array(
        vine
          .number()
          .positive()
          .withoutDecimals()
          .exists({ table: 'c_formacion', column: 'id_cformacion' })
      )
      .minLength(1)
      .distinct(),
    estado: vine.boolean().optional(),
  })
)

export const updateProgramaFormacionValidator = vine.compile(
  vine.object({
    idRedConocimiento: vine
      .number()
      .positive()
      .withoutDecimals()
      .exists({ table: 'redes_conocimiento', column: 'id_red_conocimiento' })
      .optional(),
    idLineaTematica: vine
      .number()
      .positive()
      .withoutDecimals()
      .exists({ table: 'lineas_tematicas', column: 'id_linea_tematica' })
      .optional(),
    idNivelPrograma: vine
      .number()
      .positive()
      .withoutDecimals()
      .exists({ table: 'nivel_programa', column: 'id_nivel_programa' })
      .optional(),
    codigo: vine.string().trim().minLength(1).maxLength(30).optional(),
    nombre: vine.string().trim().minLength(1).maxLength(200).optional(),
    version: vine.string().trim().minLength(1).maxLength(20).optional(),
    duracionTotalHoras: vine.number().positive().withoutDecimals().nullable().optional(),
    cupoBaseAprendices: vine.number().positive().withoutDecimals().optional(),
    centroIds: vine
      .array(
        vine
          .number()
          .positive()
          .withoutDecimals()
          .exists({ table: 'c_formacion', column: 'id_cformacion' })
      )
      .minLength(1)
      .distinct()
      .optional(),
    estado: vine.boolean().optional(),
  })
)
