import vine from '@vinejs/vine'

/**
 * Un material de formación asigna un elemento del inventario a un programa,
 * con la cantidad base de referencia. El elemento debe existir y estar activo
 * (lo comprueba el servicio para dar un mensaje claro); la pareja
 * programa+elemento no se repite.
 */
export const createMaterialFormacionValidator = vine.compile(
  vine.object({
    idPrograma: vine
      .number()
      .positive()
      .exists({ table: 'programa_formacion', column: 'id_programa_formacion' }),
    idElemento: vine.number().positive().exists({ table: 'elemento', column: 'id_elemento' }),
    cantidadBase: vine.number().min(1),
    observaciones: vine.string().trim().maxLength(1000).optional(),
    estado: vine.boolean().optional(),
  })
)

/**
 * Una solicitud apunta a una fila de la lista maestra (material de un
 * programa): el material debe existir y el servicio comprueba además que ni
 * el material ni el programa estén dados de baja.
 */
export const createSolicitudMaterialFormacionValidator = vine.compile(
  vine.object({
    idMaterial: vine
      .number()
      .positive()
      .exists({ table: 'lista_maestra_material', column: 'id_lista_maestra' }),
    cantidadSolicitada: vine.number().min(1),
    observaciones: vine.string().trim().maxLength(1000).optional(),
  })
)

export const updateMaterialFormacionValidator = vine.compile(
  vine.object({
    // Se pueden cambiar, no quitar.
    idPrograma: vine
      .number()
      .positive()
      .exists({ table: 'programa_formacion', column: 'id_programa_formacion' })
      .optional(),
    idElemento: vine
      .number()
      .positive()
      .exists({ table: 'elemento', column: 'id_elemento' })
      .optional(),
    cantidadBase: vine.number().min(1).optional(),
    observaciones: vine.string().trim().maxLength(1000).nullable().optional(),
    estado: vine.boolean().optional(),
  })
)
