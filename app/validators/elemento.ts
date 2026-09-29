import vine from '@vinejs/vine'

export const createElementoValidator = vine.compile(
  vine.object({
    idItem: vine.number().positive().exists({ table: 'item', column: 'id_item' }),
    idStand: vine.number().positive().exists({ table: 'stand', column: 'id_stand' }),
    cantidad: vine.number().min(10),
    gramaje: vine.number().min(0).optional(),
    estado: vine.boolean(),
    idUnidadMedida: vine
      .number()
      .positive()
      .exists({ table: 'unidad_medida', column: 'id_unidad_medida' }),
    codigo: vine
      .string()
      .trim()
      .minLength(1)
      .maxLength(50)
      .unique({ table: 'elemento', column: 'codigo' }),
    descripcion: vine.string().trim().maxLength(5000).optional(),
    marca: vine.string().trim().maxLength(80).optional(),
    color: vine.string().trim().maxLength(80).optional(),
    idClasificacion: vine
      .number()
      .positive()
      .exists({ table: 'clasificacion_elemento', column: 'id_clasificacion_elemento' })
      .optional(),
    valorUnitarioPromedio: vine.number().min(0).optional(),
    porcentajeAumento: vine.number().min(0).optional(),
    idCodigoEstandar: vine
      .number()
      .positive()
      .exists({ table: 'codigo_estandar', column: 'id_codigo_estandar' })
      .optional(),
  })
)

export const updateElementoValidator = vine.compile(
  vine.object({
    idItem: vine.number().positive().exists({ table: 'item', column: 'id_item' }).optional(),
    idStand: vine.number().positive().exists({ table: 'stand', column: 'id_stand' }).optional(),
    cantidad: vine.number().min(10).optional(),
    gramaje: vine.number().min(0).nullable().optional(),
    estado: vine.boolean().optional(),
    idUnidadMedida: vine
      .number()
      .positive()
      .exists({ table: 'unidad_medida', column: 'id_unidad_medida' })
      .optional(),
    codigo: vine.string().trim().minLength(1).maxLength(50).optional(),
    descripcion: vine.string().trim().maxLength(5000).optional(),
    marca: vine.string().trim().maxLength(80).nullable().optional(),
    color: vine.string().trim().maxLength(80).nullable().optional(),
    idClasificacion: vine
      .number()
      .positive()
      .exists({ table: 'clasificacion_elemento', column: 'id_clasificacion_elemento' })
      .nullable()
      .optional(),
    valorUnitarioPromedio: vine.number().min(0).nullable().optional(),
    porcentajeAumento: vine.number().min(0).nullable().optional(),
    idCodigoEstandar: vine
      .number()
      .positive()
      .exists({ table: 'codigo_estandar', column: 'id_codigo_estandar' })
      .nullable()
      .optional(),
  })
)

export const fotoElementoValidator = vine.compile(
  vine.object({
    fotografia: vine.file({
      size: '8mb',
      extnames: ['jpg', 'jpeg', 'png', 'webp'],
    }),
  })
)
