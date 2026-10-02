import vine from '@vinejs/vine'

export const createSolicitudEquipoValidator = vine.compile(
  vine.object({
    codigoSolicitud: vine.string().trim().minLength(1).maxLength(50),

    idObra: vine.number().positive(),

    idElemento: vine.number().positive(),

    cantidad: vine.number().positive(),

    ficha: vine.string().trim().maxLength(50).optional(),

    observacion: vine.string().trim().optional(),
  })
)