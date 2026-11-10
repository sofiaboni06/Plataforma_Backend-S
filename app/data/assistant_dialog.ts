import {
  TEXTO_EQUIPO,
  TEXTO_NOTIFICACIONES,
  TEXTO_PERFILES,
  TEXTO_TECNOLOGIA,
} from '#data/assistant_guides'

const RECHAZO =
  'No tengo permiso para darte ese tipo de respuesta. No listo inventario, categorías, elementos, existencias, usuarios, documentos ni montos. Eso lo ves tú, en la pantalla que te corresponda, según los módulos y permisos de tu perfil. Si la opción no te aparece, contacta al administrador de SIGMA. Si quieres, te explico cómo se usa el módulo, sin mostrarte los datos.'

function normalizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function primerNombre(nombres: string) {
  return nombres.trim().split(/\s+/)[0] ?? ''
}

function saludoBreve(nombres: string) {
  const nombre = primerNombre(nombres)
  return nombre ? `Hola ${nombre}.` : 'Hola.'
}

function saludo(nombres: string) {
  return `${saludoBreve(nombres)} Soy el asistente de SIGMA. Dime en qué te ayudo: un módulo, una solicitud, la formación, las notificaciones o el equipo que creó la plataforma. El inventario y las categorías los consultas en las pantallas de tu perfil.`
}

function comoEstas(nombres: string) {
  return `${saludoBreve(nombres)} Muy bien, gracias. ¿Y tú? Cuando quieras, te ayudo con lo que necesites de SIGMA.`
}

function esComoEstas(texto: string) {
  return /^(?:(?:hola|holi|hey|buenas|buenos dias|buenas tardes|buenas noches|buen dia|saludos|que tal|quiubo)\s+)?(?:como estas|como esta|como te va|como te encuentras|como vas|como has estado|que mas|todo bien)(?:\s+(?:sigma|asistente|bot|chat))?$/.test(
    texto
  )
}

function esSaludoPuro(texto: string) {
  return /^(hola|holi|hey|hi|hello|buenas|buenos dias|buenas tardes|buenas noches|buen dia|saludos|que tal|quiubo)( sigma| asistente| bot| chat)?$/.test(
    texto
  )
}

function abreConSaludo(texto: string) {
  return /^(hola|holi|hey|buenas|buenos dias|buenas tardes|buenas noches|buen dia|saludos|que tal|que mas)\b/.test(
    texto
  )
}

function pideDatosSensibles(texto: string) {
  if (
    /\b(contrasena de|clave de|password de|token de|secreto de)\b/.test(texto) &&
    !/\b(recuper|olvide|olvid|cambiar|cambio)\b/.test(texto)
  ) {
    return true
  }

  const pideLista =
    /\b(lista|listado|listar|listame|cuales hay|cuales son|que hay|que tiene|cuanto hay|cuantos hay|cuantas hay|cuanto stock|existencias|muestrame|ensename|datos del|datos de|inventario completo|stock de|dame los|dame las|dame el|dame la|dame todo)\b/.test(
      texto
    )
  const tema =
    /\b(inventario|categoria|categorias|subcategoria|elemento|elementos|item|items|bodega|stock|usuario|usuarios|presupuesto|monto|existencia)\b/.test(
      texto
    )
  const esManual =
    /\b(como|donde|para que|que es|funcion|paso|pasos|sirve|puedo|debo|crea|crear|registro|solicito|pedir|solicitar)\b/.test(
      texto
    )

  if (pideLista && tema && !esManual) return true

  return (
    /\b(que categorias|cuales categorias|categorias existen|categorias hay|elementos hay|que elementos|usuarios hay|quienes son los usuarios|que usuarios)\b/.test(
      texto
    ) && !esManual
  )
}

function preguntaPorCreadores(texto: string) {
  if (/\bquien(es)? te\b/.test(texto)) return true
  if (/\b(equipo de desarrollo|equipo sigma|fabrica de software|personas detras)\b/.test(texto)) {
    return true
  }

  const entidad =
    /\b(categoria|categorias|elemento|elementos|item|items|bodega|solicitud|usuario|usuarios|perfil|programa|ficha|vigencia|obra|inventario)\b/.test(
      texto
    )
  const plataforma = /\b(sigma|plataforma|asistente|chatbot|chat|bot|sistema)\b/.test(texto)
  if (entidad && !plataforma) return false
  if (/\b(solicit|pido|pedir|presto|prestam|devolv|devolutiv)\b/.test(texto)) return false

  return (
    /\b(creador|creadores|crearon|creaste|desarrolladores|autores)\b/.test(texto) ||
    (/\b(quien|quienes)\b/.test(texto) &&
      /\b(creo|hizo|desarrollo|programo|diseno|construyo)\b/.test(texto)) ||
    (/\bequipo\b/.test(texto) && /\b(quien|quienes|creo|hizo|desarrollo|detras)\b/.test(texto))
  )
}

function preguntaPorNotificaciones(texto: string) {
  return /\b(notificacion|notificaciones|campana)\b/.test(texto)
}

function preguntaPorPerfiles(texto: string) {
  const rol =
    /\b(administrador|bodega|instructor|coordinador|subdirector|subdirectora|compras|almacenista|perfil|perfiles|rol|roles)\b/.test(
      texto
    )
  const queHace =
    /\b(que hace|que puede|que ven|que ve|para que sirve|cual es el rol|cuales son los roles|diferencia|funciones de|permisos de)\b/.test(
      texto
    )
  return rol && queHace
}

function preguntaTecnica(texto: string) {
  return /\b(con que esta|con que fue|con que la|tecnolog|hecha en|hecho en|hecha con|esta hecha|esta hecho|framework|adonis|react|postgresql|lenguaje|stack)\b/.test(
    texto
  )
}

/**
 * Respuesta fija cuando la pregunta es un saludo, pide datos del centro,
 * pregunta por el equipo o por un tema que no debe depender de una guía vieja.
 * Devuelve null para seguir con la búsqueda de guías.
 */
export function respuestaDirecta(pregunta: string, nombres = ''): string | null {
  const texto = normalizar(pregunta)
  if (!texto) return null

  const cabeza = abreConSaludo(texto) && !esSaludoPuro(texto) ? `${saludoBreve(nombres)} ` : ''

  if (esComoEstas(texto)) return comoEstas(nombres)
  if (esSaludoPuro(texto)) return saludo(nombres)
  if (pideDatosSensibles(texto)) return `${cabeza}${RECHAZO}`
  if (preguntaPorCreadores(texto)) return `${cabeza}${TEXTO_EQUIPO}`
  if (preguntaPorNotificaciones(texto)) return `${cabeza}${TEXTO_NOTIFICACIONES}`
  if (preguntaPorPerfiles(texto)) return `${cabeza}${TEXTO_PERFILES}`
  if (preguntaTecnica(texto)) return `${cabeza}${TEXTO_TECNOLOGIA}`

  return null
}
