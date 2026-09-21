import vine from '@vinejs/vine'

export const createElementoValidator = vine.compile(
  vine.object({
    id_subcategoria: vine.number(),
    id_stand: vine.number(),
    nombre: vine.string().trim().minLength(1).maxLength(150),
    cantidad: vine.number().min(0),
    estado: vine.boolean(),
    id_unidad_medida: vine.number(),
    codigo: vine.string().trim().minLength(1).maxLength(100),
    descripcion: vine.string().trim().maxLength(500),
  })
)

export const updateElementoValidator = vine.compile(
  vine.object({
    id_subcategoria: vine.number().optional(),
    id_stand: vine.number().optional(),
    nombre: vine.string().trim().minLength(1).maxLength(150).optional(),
    cantidad: vine.number().min(0).optional(),
    estado: vine.boolean().optional(),
    id_unidad_medida: vine.number().optional(),
    codigo: vine.string().trim().minLength(1).maxLength(100).optional(),
    descripcion: vine.string().trim().maxLength(500).optional(),
  })
)
