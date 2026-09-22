import vine from '@vinejs/vine'

export const createCategoriaValidator = vine.compile(
  vine.object({
    idCformacion: vine
      .number()
      .positive()
      .exists({ table: 'c_formacion', column: 'id_cformacion' }),
    nombre: vine.string().trim().minLength(1).maxLength(150),
    estado: vine.boolean().optional(),
  })
)

export const updateCategoriaValidator = vine.compile(
  vine.object({
    idCformacion: vine
      .number()
      .positive()
      .exists({ table: 'c_formacion', column: 'id_cformacion' })
      .optional(),
    nombre: vine.string().trim().minLength(1).maxLength(150).optional(),
    estado: vine.boolean().optional(),
  })
)