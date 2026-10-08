import vine from '@vinejs/vine'

const solicitud = {
  codigoSolicitud: vine.string().trim().minLength(1).maxLength(50),
  idObra: vine.number().positive().withoutDecimals(),
  tipo: vine.enum(['consumo', 'devolutivo'] as const),
  ficha: vine.string().trim().maxLength(50).optional(),
  observacion: vine.string().trim().optional(),
  elementos: vine
    .array(
      vine.object({
        idElemento: vine.number().positive().withoutDecimals(),
        cantidad: vine.number().positive().withoutDecimals(),
        observacion: vine.string().trim().optional(),
      })
    )
    .minLength(1)
    .maxLength(100)
    .distinct('idElemento'),
}

export const createSolicitudValidator = vine.compile(vine.object(solicitud))

/**
 * Lo mismo que pide el instructor, más el documento de quien está en el
 * mostrador.
 */
export const registrarEnBodegaValidator = vine.compile(
  vine.object({
    ...solicitud,
    numeroDocumento: vine.string().trim().minLength(1).maxLength(30),
  })
)

export const entregarSolicitudValidator = vine.compile(
  vine.object({
    cantidad: vine.number().positive().withoutDecimals().optional(),
    observacion: vine.string().trim().maxLength(500).optional(),
  })
)
