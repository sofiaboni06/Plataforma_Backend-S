import vine from '@vinejs/vine'

const estadoElemento = () => vine.enum(['bueno', 'danado', 'perdido', 'en_reparacion'] as const)

export const createSolicitudEquipoValidator = vine.compile(
  vine.object({
    codigoSolicitud: vine.string().trim().minLength(1).maxLength(50),
    idObra: vine.number().positive().withoutDecimals(),
    idElemento: vine.number().positive().withoutDecimals(),
    cantidad: vine.number().positive().withoutDecimals(),
    ficha: vine.string().trim().maxLength(50).optional(),
    observacion: vine.string().trim().optional(),
  })
)

/**
 * `{ estadoElemento, cantidad? }` devuelve con un solo estado (sin cantidad,
 * todo lo que está afuera). `detalle` reparte por estado: 5 bueno, 2 dañado.
 */
export const devolverSolicitudEquipoValidator = vine.compile(
  vine.object({
    estadoElemento: estadoElemento().optional().requiredIfMissing(['detalle', 'unidades']),
    cantidad: vine.number().positive().withoutDecimals().optional(),
    detalle: vine
      .array(
        vine.object({
          estadoElemento: estadoElemento(),
          cantidad: vine.number().positive().withoutDecimals(),
          observacion: vine.string().trim().optional(),
        })
      )
      .minLength(1)
      .maxLength(4)
      .distinct('estadoElemento')
      .optional(),
    /**
     * Una entrada por unidad que vuelve, cada una con su novedad y su
     * observación. Se guarda una fila de `devolucion` por unidad.
     */
    unidades: vine
      .array(
        vine.object({
          estadoElemento: estadoElemento(),
          observacion: vine.string().trim().maxLength(500).optional(),
        })
      )
      .minLength(1)
      .maxLength(1000)
      .optional(),
    observacion: vine.string().trim().optional(),
  })
)
