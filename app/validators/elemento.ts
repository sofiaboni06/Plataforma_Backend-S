import vine from '@vinejs/vine'

export const createElementoValidator = vine.compile(
  vine.object({
    idSubcategoria: vine
      .number()
      .positive()
      .exists({ table: 'subcategoria', column: 'id_subcategoria' }),
    idStand: vine.number().positive().exists({ table: 'stand', column: 'id_stand' }),
    nombre: vine.string().trim().minLength(1).maxLength(150),
    cantidad: vine.number().min(0),
    estado: vine.boolean(),
    idUnidadMedida: vine
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
    urlFotografia: vine.string().trim().maxLength(500).optional(),
  })
)

export const updateElementoValidator = vine.compile(
  vine.object({
    idSubcategoria: vine
      .number()
      .positive()
      .exists({ table: 'subcategoria', column: 'id_subcategoria' })
      .optional(),
    idStand: vine.number().positive().exists({ table: 'stand', column: 'id_stand' }).optional(),
    nombre: vine.string().trim().minLength(1).maxLength(150).optional(),
    cantidad: vine.number().min(0).optional(),
    estado: vine.boolean().optional(),
    idUnidadMedida: vine
      .number()
      .positive()
      .exists({ table: 'unidad_medida', column: 'id_unidad_medida' })
      .optional(),
    codigo: vine.string().trim().minLength(1).maxLength(50).optional(),
    descripcion: vine.string().trim().maxLength(5000).optional(),
    marca: vine.string().trim().maxLength(80).nullable().optional(),
    urlFotografia: vine.string().trim().maxLength(500).nullable().optional(),
  })
)
