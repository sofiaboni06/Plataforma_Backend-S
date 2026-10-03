import vine from '@vinejs/vine'

export const createSolicitudMaterialValidator = vine.compile(
  vine.object({
    codigoSolicitud: vine.string().trim().minLength(1).maxLength(50),
    idObra: vine.number().positive().withoutDecimals(),
    idElemento: vine.number().positive().withoutDecimals(),
    cantidad: vine.number().positive().withoutDecimals(),
    ficha: vine.string().trim().maxLength(50).optional(),
    observacion: vine.string().trim().optional(),
  })
)
