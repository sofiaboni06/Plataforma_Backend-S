/**
 * Clasificaciones de la hoja INVENTARIO UNIFICADO.
 * El seeder las copia a clasificacion_elemento. Una nueva se crea por el CRUD.
 *
 * Sin las repetidas o mal escritas de la hoja (CONSUMO, MATERILA DE CONSUMO,
 * EPP (ELEMENTO DE PROTECION PERSONAL), QUIMICO MATERIAL CONSUMO): una base
 * nueva no las crea. En una base que ya las tiene, el administrador decide desde
 * el catálogo; crear o renombrar a un nombre repetido se rechaza.
 *
 * El caracter de la clasificación es solo la sugerencia al crear un elemento.
 * Lo que manda el kardex al proceso correcto, consumo (solicitud_material) o
 * devolutivo (solicitud_equipo), es `elemento.caracter`.
 */
export const CARACTERES_ELEMENTO = ['consumo', 'devolutivo'] as const

export type CaracterElemento = (typeof CARACTERES_ELEMENTO)[number]

export function caracterFromNombre(nombre: string): CaracterElemento {
  const normalized = nombre
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()

  if (
    normalized.includes('consumo') ||
    normalized.includes('aseo') ||
    normalized.includes('quimico')
  ) {
    return 'consumo'
  }

  return 'devolutivo'
}

export const CLASIFICACIONES_ELEMENTO = [
  { nombre: 'ACCESORIO', caracter: 'devolutivo' },
  { nombre: 'ELEMENTO DE ASEO', caracter: 'consumo' },
  { nombre: 'EPP', caracter: 'devolutivo' },
  { nombre: 'HERRAMIENTA', caracter: 'devolutivo' },
  { nombre: 'HERRAMIENTA MENOR', caracter: 'devolutivo' },
  { nombre: 'INMUEBLE', caracter: 'devolutivo' },
  { nombre: 'MATERIAL DE CONSUMO', caracter: 'consumo' },
  { nombre: 'QUIMICO APLICABLE MATERIAL DE CONSUMO', caracter: 'consumo' },
] as const satisfies ReadonlyArray<{ nombre: string; caracter: CaracterElemento }>

for (const item of CLASIFICACIONES_ELEMENTO) {
  if (item.caracter !== caracterFromNombre(item.nombre)) {
    throw new Error(`caracter de "${item.nombre}" no coincide con la regla de nombre`)
  }
}
