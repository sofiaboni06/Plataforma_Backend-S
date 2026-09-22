import vine from '@vinejs/vine'

export const createElementoValidator = vine.compile(
  vine.object({
    id_subcategoria: vine
      .number()
      .positive()
      .exists({ table: 'subcategoria', column: 'id_subcategoria' }),
    id_stand: vine.number().positive().exists({ table: 'stand', column: 'id_stand' }),
    nombre: vine.string().trim().minLength(1).maxLength(150),
    cantidad: vine.number().min(0),
    estado: vine.boolean(),
    id_unidad_medida: vine
      .number()
      .positive()
      .exists({ table: 'unidad_medida', column: 'id_unidad_medida' }),
    codigo: vine
      .string()
      .trim()
      .minLength(1)
      .maxLength(50)
      .unique({ table: 'elemento', column: 'codigo' }),
    descripcion: vine.string().trim().maxLength(5000).optional(),
    marca: vine.string().trim().maxLength(80).optional(),
    url_fotografia: vine.string().trim().maxLength(500).optional(),
  })
)

export const updateElementoValidator = vine.compile(
  vine.object({
    id_subcategoria: vine
      .number()
      .positive()
      .exists({ table: 'subcategoria', column: 'id_subcategoria' })
      .optional(),
    id_stand: vine.number().positive().exists({ table: 'stand', column: 'id_stand' }).optional(),
    nombre: vine.string().trim().minLength(1).maxLength(150).optional(),
    cantidad: vine.number().min(0).optional(),
    estado: vine.boolean().optional(),
    id_unidad_medida: vine
      .number()
      .positive()
      .exists({ table: 'unidad_medida', column: 'id_unidad_medida' })
      .optional(),
    codigo: vine.string().trim().minLength(1).maxLength(50).optional(),
    descripcion: vine.string().trim().maxLength(5000).optional(),
    marca: vine.string().trim().maxLength(80).nullable().optional(),
    url_fotografia: vine.string().trim().maxLength(500).nullable().optional(),
  })
)
