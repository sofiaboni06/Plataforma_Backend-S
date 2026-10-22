import vine from '@vinejs/vine'

export const createVigenciaValidator = vine.create({
  anio: vine.number(),
  activa: vine.boolean(),
  fecha_apertura: vine.string(),
  fecha_cierre: vine.string(),
})

export const updateVigenciaValidator = vine.create({
  anio: vine.number(),
  activa: vine.boolean(),
  fecha_apertura: vine.string(),
  fecha_cierre: vine.string(),
})