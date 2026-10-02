import vine from '@vinejs/vine'

export const createObraValidator = vine.compile(
  vine.object({
    /**
     * Only honoured for an admin. Any other profile always creates the obra
     * inside their own training center (the one of the logged user, not the
     * one of a bodega).
     */
    idCformacion: vine
      .number()
      .positive()
      .exists({ table: 'c_formacion', column: 'id_cformacion' })
      .optional(),
    nombre: vine.string().trim().minLength(1).maxLength(150),
    lugar: vine.string().trim().maxLength(150).nullable().optional(),
    estado: vine.boolean().optional(),
  })
)

export const updateObraValidator = vine.compile(
  vine.object({
    nombre: vine.string().trim().minLength(1).maxLength(150).optional(),
    lugar: vine.string().trim().maxLength(150).nullable().optional(),
    estado: vine.boolean().optional(),
  })
)
