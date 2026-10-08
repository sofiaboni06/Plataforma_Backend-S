import { Exception } from '@adonisjs/core/exceptions'
import { DateTime } from 'luxon'

/**
 * Fechas de calendario (columnas `date`) de las solicitudes. Viajan como texto
 * `YYYY-MM-DD` para no correrse un día por la zona horaria del servidor.
 */
export type FechaDia = string

/** Los días se cuentan en la hora de Colombia, no en la del servidor (puede estar en UTC). */
export const ZONA_PLAZOS = 'America/Bogota'

/**
 * Estado del plazo de una fila de equipo con unidades afuera. `null` cuando no
 * hay nada afuera (pendiente o ya devuelto).
 */
export type EstadoPlazo = 'sin_fecha' | 'al_dia' | 'vence_hoy' | 'vencido'

export function hoy(): FechaDia {
  return DateTime.now().setZone(ZONA_PLAZOS).toISODate()!
}

/** Inicio del día de hoy en Colombia, para comparar con timestamps. */
export function inicioDeHoy() {
  return DateTime.now().setZone(ZONA_PLAZOS).startOf('day')
}

/**
 * `consume` de Lucid para columnas `date`: el driver de Postgres las entrega
 * como Date a la medianoche local; se lee con la hora local y queda el mismo día.
 */
export function fechaDia(value: unknown): FechaDia | null {
  if (value === null || value === undefined) {
    return null
  }

  if (value instanceof Date) {
    const mes = String(value.getMonth() + 1).padStart(2, '0')
    const dia = String(value.getDate()).padStart(2, '0')
    return `${value.getFullYear()}-${mes}-${dia}`
  }

  return String(value).slice(0, 10)
}

/** Valida que sea un día real (`2026-02-30` no pasa). */
export function fechaValida(value: string, campo: string): FechaDia {
  const fecha = DateTime.fromISO(value, { zone: ZONA_PLAZOS })

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !fecha.isValid) {
    throw new Exception(`${campo}: la fecha no es válida`, {
      status: 422,
      code: 'E_FECHA_INVALIDA',
    })
  }

  return value
}

export function noAntesDe(fecha: FechaDia, minimo: FechaDia, mensaje: string) {
  if (fecha < minimo) {
    throw new Exception(mensaje, { status: 422, code: 'E_FECHA_INVALIDA' })
  }
}

export function estadoPlazo(
  limite: FechaDia | null,
  afuera: number,
  dia: FechaDia = hoy()
): EstadoPlazo | null {
  if (afuera <= 0) {
    return null
  }

  if (!limite) {
    return 'sin_fecha'
  }

  if (limite < dia) {
    return 'vencido'
  }

  return limite === dia ? 'vence_hoy' : 'al_dia'
}

/** Días completos entre dos fechas `YYYY-MM-DD` (b - a). */
export function diasEntre(a: FechaDia, b: FechaDia) {
  return Math.round(
    DateTime.fromISO(b, { zone: 'utc' }).diff(DateTime.fromISO(a, { zone: 'utc' }), 'days').days
  )
}

/** 2026-10-05 → 05/10/2026 */
export function fechaCorta(fecha: FechaDia) {
  const [anio, mes, dia] = fecha.split('-')
  return `${dia}/${mes}/${anio}`
}
