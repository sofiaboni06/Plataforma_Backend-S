import vine from '@vinejs/vine'

export const createUsoPresupuestalValidator = vine.compile(
  vine.object({
    /**
     * Only honoured for an admin. Any other profile always creates the budget
     * use inside their own training center.
     */
    idCformacion: vine
      .number()
      .positive()
      .exists({ table: 'c_formacion', column: 'id_cformacion' })
      .optional(),
    nombre: vine.string().trim().minLength(1).maxLength(200),
    estado: vine.boolean().optional(),
  })
)

export const updateUsoPresupuestalValidator = vine.compile(
  vine.object({
    nombre: vine.string().trim().minLength(1).maxLength(200).optional(),
    estado: vine.boolean().optional(),
  })
)
