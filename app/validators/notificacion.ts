import vine from '@vinejs/vine'

export const updateNotificacionValidator = vine.compile(
  vine.object({
    leida: vine.boolean(),
  })
)
