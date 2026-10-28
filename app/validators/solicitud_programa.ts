import vine from '@vinejs/vine'

const itemValidator = vine.object({
  listaMaestraId: vine.number().positive().withoutDecimals(),
  cantidadSolicitada: vine.number().positive(),
})

export const createSolicitudProgramaValidator = vine.compile(
  vine.object({
    programaId: vine
      .number()
      .positive()
      .withoutDecimals()
      .exists({ table: 'programa_formacion', column: 'id_programa_formacion' }),
    fichaId: vine.number().positive().withoutDecimals().exists({ table: 'ficha', column: 'id_ficha' }),
    vigencia: vine.number().withoutDecimals().optional(),
    instructorId: vine.number().positive().withoutDecimals().optional(),
    observacion: vine.string().trim().maxLength(1000).nullable().optional(),
    items: vine.array(itemValidator).minLength(1),
  })
)

export const updateSolicitudProgramaValidator = vine.compile(
  vine.object({
    observacion: vine.string().trim().maxLength(1000).nullable().optional(),
    items: vine.array(itemValidator).minLength(1).optional(),
  })
)

export const decidirSolicitudProgramaValidator = vine.compile(
  vine.object({
    observacionDecision: vine.string().trim().maxLength(1000).nullable().optional(),
    items: vine
      .array(
        vine.object({
          id: vine.number().positive().withoutDecimals(),
          accion: vine.enum(['entregar', 'pendiente', 'rechazar']),
          cantidadAprobada: vine.number().min(0).optional(),
          observacionCoordinador: vine.string().trim().maxLength(500).nullable().optional(),
        })
      )
      .minLength(1),
  })
)

export const createProcesoCompraValidator = vine.compile(
  vine.object({
    vigencia: vine.number().withoutDecimals(),
    codigoProceso: vine.string().trim().minLength(1).maxLength(50),
    descripcion: vine.string().trim().maxLength(500).nullable().optional(),
  })
)
