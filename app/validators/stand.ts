import vine from '@vinejs/vine'

export const createStandValidator = vine.create({
  nombre: vine
    .string()
    .trim()
    .minLength(1)
    .maxLength(150),

  estado: vine
    .boolean()
    .optional(),
})

export const updateStandValidator = vine.create({
  nombre: vine
    .string()
    .trim()
    .minLength(1)
    .maxLength(150)
    .optional(),

  estado: vine
    .boolean()
    .optional(),
})