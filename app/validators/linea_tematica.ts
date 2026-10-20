
import vine from '@vinejs/vine'

export const createLineaTematicaValidator = vine.compile(
  vine.object({
    lineaTematica: vine.string().trim().minLength(1).maxLength(150),
    descripcionLineaTematica: vine.string().trim().optional(),
    estado: vine.boolean().optional(),
  })
)

export const updateLineaTematicaValidator = vine.compile(
  vine.object({
    lineaTematica: vine.string().trim().minLength(1).maxLength(150).optional(),
    descripcionLineaTematica: vine.string().trim().optional(),
    estado: vine.boolean().optional(),
  })
)
