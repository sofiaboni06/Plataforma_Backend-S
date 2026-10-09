import vine from '@vinejs/vine'

/** Día de calendario `YYYY-MM-DD`; el servicio revisa que exista y el orden. */
const dia = () =>
  vine
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/)

const solicitud = {
  codigoSolicitud: vine.string().trim().minLength(1).maxLength(50),
  idObra: vine.number().positive().withoutDecimals(),
  tipo: vine.enum(['consumo', 'devolutivo'] as const),
  ficha: vine.string().trim().maxLength(50).optional(),
  observacion: vine.string().trim().optional(),
  /** Solo equipo: inicio del préstamo. En consumo el servicio la ignora. */
  fechaInicio: dia().optional(),
  /** Solo equipo: hasta cuándo lo pide. En consumo el servicio la ignora. */
  fechaDevolucionPropuesta: dia().optional(),
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
    /** Solo equipo: bodega confirma o ajusta el plazo al entregar. */
    fechaDevolucionLimite: dia().optional(),
  })
)

/** Bodega corre el plazo de devolución de un pedido de equipo. */
export const plazoSolicitudValidator = vine.compile(
  vine.object({
    fechaDevolucionLimite: dia(),
  })
)
