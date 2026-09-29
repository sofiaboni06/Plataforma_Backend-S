import vine from '@vinejs/vine'

export const createItemValidator = vine.compile(
  vine.object({
    idSubcategoria: vine
      .number()
      .positive()
      .exists({ table: 'subcategoria', column: 'id_subcategoria' }),
    nombre: vine.string().trim().minLength(1).maxLength(150),
    descripcion: vine.string().trim().maxLength(5000).optional(),
    estado: vine.boolean().optional(),
  })
)

export const updateItemValidator = vine.compile(
  vine.object({
    idSubcategoria: vine
      .number()
      .positive()
      .exists({ table: 'subcategoria', column: 'id_subcategoria' })
      .optional(),
    nombre: vine.string().trim().minLength(1).maxLength(150).optional(),
    descripcion: vine.string().trim().maxLength(5000).nullable().optional(),
    estado: vine.boolean().optional(),
  })
)
