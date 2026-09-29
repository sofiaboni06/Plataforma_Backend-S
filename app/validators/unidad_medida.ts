import vine from '@vinejs/vine'

const idCformacion = vine
  .number()
  .positive()
  .exists({ table: 'c_formacion', column: 'id_cformacion' })
  .optional()

export const createUnidadMedidaValidator = vine.compile(
  vine.object({
    /**
     * Only honoured for an admin. Any other profile always creates the unit
     * inside their own training center.
     */
    idCformacion,
    nombre: vine.string().trim().minLength(1).maxLength(80),
    abreviatura: vine.string().trim().minLength(1).maxLength(20),
    estado: vine.boolean().optional(),
  })
)

export const updateUnidadMedidaValidator = vine.compile(
  vine.object({
    nombre: vine.string().trim().minLength(1).maxLength(80).optional(),
    abreviatura: vine.string().trim().minLength(1).maxLength(20).optional(),
    estado: vine.boolean().optional(),
  })
)
