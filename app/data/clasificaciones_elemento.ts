/**
 * Clasificaciones de la hoja INVENTARIO UNIFICADO.
 * El seeder las copia a clasificacion_elemento. Una nueva se crea por el CRUD.
 *
 * caracter manda el kardex al proceso correcto: consumo (solicitud_material)
 * o devolutivo (solicitud_equipo).
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
  { nombre: 'CONSUMO', caracter: 'consumo' },
  { nombre: 'ELEMENTO DE ASEO', caracter: 'consumo' },
  { nombre: 'EPP', caracter: 'devolutivo' },
  { nombre: 'EPP (ELEMENTO DE PROTECION PERSONAL)', caracter: 'devolutivo' },
  { nombre: 'HERRAMIENTA', caracter: 'devolutivo' },
  { nombre: 'HERRAMIENTA MENOR', caracter: 'devolutivo' },
  { nombre: 'INMUEBLE', caracter: 'devolutivo' },
  { nombre: 'MATERIAL DE CONSUMO', caracter: 'consumo' },
  { nombre: 'MATERILA DE CONSUMO', caracter: 'consumo' },
  { nombre: 'QUIMICO APLICABLE MATERIAL DE CONSUMO', caracter: 'consumo' },
  { nombre: 'QUIMICO MATERIAL CONSUMO', caracter: 'consumo' },
] as const satisfies ReadonlyArray<{ nombre: string; caracter: CaracterElemento }>

for (const item of CLASIFICACIONES_ELEMENTO) {
  if (item.caracter !== caracterFromNombre(item.nombre)) {
    throw new Error(`caracter de "${item.nombre}" no coincide con la regla de nombre`)
  }
}
