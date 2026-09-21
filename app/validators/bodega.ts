import vine from '@vinejs/vine'

export const createBodegaValidator = vine.create({
  nombre: vine.string().trim().minLength(1).maxLength(150),
  idCformacion: vine
    .number()
    .positive()
    .exists({ table: 'c_formacion', column: 'id_cformacion' })
    .optional(),
  estado: vine.boolean().optional(),
})

export const updateBodegaValidator = vine.create({
  nombre: vine.string().trim().minLength(1).maxLength(150).optional(),
  idCformacion: vine
    .number()
    .positive()
    .exists({ table: 'c_formacion', column: 'id_cformacion' })
    .optional(),
  estado: vine.boolean().optional(),
})

export const createStandValidator = vine.create({
  nombre: vine.string().trim().minLength(1).maxLength(150),
  estado: vine.boolean().optional(),
})

export const updateStandValidator = vine.create({
  nombre: vine.string().trim().minLength(1).maxLength(150).optional(),
  estado: vine.boolean().optional(),
})
