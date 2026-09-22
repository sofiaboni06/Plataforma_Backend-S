import vine from '@vinejs/vine'

export const createSubcategoriaValidator = vine.compile(
  vine.object({
    idCategoria: vine.number().positive().exists({ table: 'categoria', column: 'id_categoria' }),
    nombre: vine.string().trim().minLength(1).maxLength(150),
    estado: vine.boolean().optional(),
  })
)

export const updateSubcategoriaValidator = vine.compile(
  vine.object({
    idCategoria: vine
      .number()
      .positive()
      .exists({ table: 'categoria', column: 'id_categoria' })
      .optional(),
    nombre: vine.string().trim().minLength(1).maxLength(150).optional(),
    estado: vine.boolean().optional(),
  })
)