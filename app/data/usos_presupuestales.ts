/**
 * Usos presupuestales de la hoja FICHAS TECNICAS. No es el código UNSPSC:
 * es la partida de la que sale la plata. El seeder los copia a uso_presupuestal.
 * Una nueva se crea por el CRUD.
 */
export const USOS_PRESUPUESTALES = [
  { nombre: 'MINERALES; ELECTRICIDAD, GAS Y AGUA' },
  { nombre: 'Componentes y Suministros de Manufactura' },
  { nombre: 'OTROS BIENES TRANSPORTABLES (EXCEPTO PRODUCTOS METÁLICOS, MAQUINARIA Y EQUIPO)' },
  {
    nombre: 'Componentes y Suministros para Estructuras, Edificación, Construcción y Obras Civiles',
  },
  { nombre: 'PRODUCTOS METÁLICOS, MAQUINARIA Y EQUIPO' },
  { nombre: 'Herramientas y Maquinaria General' },
  { nombre: 'Material Químico incluyendo Bioquímicos y Materiales de Gas' },
  { nombre: 'Material Mineral, Textil y  Vegetal y Animal No Comestible' },
  { nombre: 'Equipos y Suministros de Laboratorio, de Medición, de Observación y de Pruebas' },
  { nombre: 'Componentes y Equipos para Distribución y Sistemas de Acondicionamiento' },
  { nombre: 'Maquinaria y Accesorios para Manufactura y Procesamiento Industrial' },
  {
    nombre: 'Equipos y Suministros de Defensa, Orden Publico, Proteccion, Vigilancia y Seguridad',
  },
  { nombre: 'Materiales de Resina, Colofonia, Caucho, Espuma, Película y Elastómericos' },
  { nombre: 'Equipos de Limpieza y Suministros' },
  { nombre: 'Seguridad y control público' },
] as const
