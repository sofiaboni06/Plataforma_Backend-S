import vine from '@vinejs/vine'

export const createCodigoEstandarValidator = vine.compile(
  vine.object({
    /**
     * Only honoured for an admin. Any other profile always creates the UNSPSC
     * code inside their own training center.
     */
    idCformacion: vine
      .number()
      .positive()
      .exists({ table: 'c_formacion', column: 'id_cformacion' })
      .optional(),
    codigo: vine.string().trim().minLength(1).maxLength(20),
    nombre: vine.string().trim().minLength(1).maxLength(200),
  })
)

export const updateCodigoEstandarValidator = vine.compile(
  vine.object({
    codigo: vine.string().trim().minLength(1).maxLength(20).optional(),
    nombre: vine.string().trim().minLength(1).maxLength(200).optional(),
  })
)
