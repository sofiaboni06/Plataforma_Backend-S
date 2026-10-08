import vine from '@vinejs/vine'
import { CARACTERES_ELEMENTO } from '#data/clasificaciones_elemento'

/**
 * El nombre del elemento es propio: es el que busca el instructor al pedir.
 * El ítem solo agrupa (subcategoría, descripción); no le pone nombre.
 */
const nombreElemento = () => vine.string().trim().minLength(2).maxLength(150)

export const createElementoValidator = vine.compile(
  vine.object({
    nombre: nombreElemento(),
    idItem: vine.number().positive().exists({ table: 'item', column: 'id_item' }),
    idStand: vine.number().positive().exists({ table: 'stand', column: 'id_stand' }),
    cantidad: vine.number().min(10),
    cantidadMinima: vine.number().min(0).optional(),
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
    // Qué es (aseo, EPP, herramienta…) y cómo se pide: los dos son obligatorios.
    idClasificacion: vine
      .number()
      .positive()
      .exists({ table: 'clasificacion_elemento', column: 'id_clasificacion_elemento' }),
    caracter: vine.enum(CARACTERES_ELEMENTO),
    valorUnitarioPromedio: vine.number().min(0).optional(),
    porcentajeAumento: vine.number().min(0).optional(),
    idCodigoEstandar: vine
      .number()
      .positive()
      .exists({ table: 'codigo_estandar', column: 'id_codigo_estandar' })
      .optional(),
    idUsoPresupuestal: vine
      .number()
      .positive()
      .exists({ table: 'uso_presupuestal', column: 'id_uso_presupuestal' })
      .optional(),
  })
)

export const updateElementoValidator = vine.compile(
  vine.object({
    // Opcional para no romper los cambios parciales (stock, foto…); si llega, no puede quedar vacío.
    nombre: nombreElemento().optional(),
    idItem: vine.number().positive().exists({ table: 'item', column: 'id_item' }).optional(),
    idStand: vine.number().positive().exists({ table: 'stand', column: 'id_stand' }).optional(),
    cantidad: vine.number().min(10).optional(),
    cantidadMinima: vine.number().min(0).optional(),
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
    // Se pueden cambiar, no quitar.
    idClasificacion: vine
      .number()
      .positive()
      .exists({ table: 'clasificacion_elemento', column: 'id_clasificacion_elemento' })
      .optional(),
    caracter: vine.enum(CARACTERES_ELEMENTO).optional(),
    valorUnitarioPromedio: vine.number().min(0).nullable().optional(),
    porcentajeAumento: vine.number().min(0).nullable().optional(),
    idCodigoEstandar: vine
      .number()
      .positive()
      .exists({ table: 'codigo_estandar', column: 'id_codigo_estandar' })
      .nullable()
      .optional(),
    idUsoPresupuestal: vine
      .number()
      .positive()
      .exists({ table: 'uso_presupuestal', column: 'id_uso_presupuestal' })
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
