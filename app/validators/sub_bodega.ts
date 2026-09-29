import vine from '@vinejs/vine'

export const createSubBodegaValidator = vine.create({
  nombre: vine
    .string()
    .trim()
    .minLength(1)
    .maxLength(150),

  estado: vine.boolean().optional(),
})

export const updateSubBodegaValidator = vine.create({
  idBodega: vine
    .number()
    .positive()
    .exists({
      table: 'bodega',
      column: 'id_bodega',
    })
    .optional(),

  nombre: vine
    .string()
    .trim()
    .minLength(1)
    .maxLength(150)
    .optional(),

  estado: vine.boolean().optional(),
})