import vine from '@vinejs/vine'

export const listListaMaestraValidator = vine.compile(
  vine.object({
    programaId: vine
      .number()
      .positive()
      .withoutDecimals()
      .exists({ table: 'programa_formacion', column: 'id_programa_formacion' }),
  })
)

export const createListaMaestraValidator = vine.compile(
  vine.object({
    programaId: vine
      .number()
      .positive()
      .withoutDecimals()
      .exists({ table: 'programa_formacion', column: 'id_programa_formacion' }),
    codigoUnspsc: vine.string().trim().minLength(1).maxLength(20),
    producto: vine.string().trim().minLength(1).maxLength(200),
    descripcionTecnica: vine.string().trim().maxLength(2000).nullable().optional(),
    unidadMedida: vine.string().trim().maxLength(50).nullable().optional(),
    cantidadBase: vine.number().positive(),
    caracter: vine.enum(['consumo', 'devolutivo', 'software']).nullable().optional(),
    observaciones: vine.string().trim().maxLength(1000).nullable().optional(),
  })
)

export const updateListaMaestraValidator = vine.compile(
  vine.object({
    codigoUnspsc: vine.string().trim().minLength(1).maxLength(20).optional(),
    producto: vine.string().trim().minLength(1).maxLength(200).optional(),
    descripcionTecnica: vine.string().trim().maxLength(2000).nullable().optional(),
    unidadMedida: vine.string().trim().maxLength(50).nullable().optional(),
    cantidadBase: vine.number().positive().optional(),
    caracter: vine.enum(['consumo', 'devolutivo', 'software']).nullable().optional(),
    observaciones: vine.string().trim().maxLength(1000).nullable().optional(),
    estado: vine.boolean().optional(),
  })
)

export const importListaMaestraValidator = vine.compile(
  vine.object({
    programaId: vine
      .number()
      .positive()
      .withoutDecimals()
      .exists({ table: 'programa_formacion', column: 'id_programa_formacion' }),
    archivo: vine.file({
      size: '15mb',
      extnames: ['xlsx', 'xls'],
    }),
  })
)
