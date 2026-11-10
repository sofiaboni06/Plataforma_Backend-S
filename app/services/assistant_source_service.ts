import { Exception } from '@adonisjs/core/exceptions'
import { respuestaDirecta } from '#data/assistant_dialog'
import AssistantSource from '#models/assistant_source'
import type { AccessScope } from '#services/access_control'
import { rethrowDatabaseError } from '#services/database_error'

const PALABRAS_VACIAS = new Set([
  'como',
  'para',
  'donde',
  'desde',
  'hasta',
  'esta',
  'este',
  'esto',
  'porque',
  'cuando',
  'sobre',
  'entre',
  'tiene',
  'hacer',
  'hago',
  'cual',
  'cuales',
  'quiero',
  'puedo',
  'debo',
])

type GuiaPayload = {
  titulo: string
  modulo: string
  contenido: string
  estado?: boolean
}

function normalizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

function palabrasDe(pregunta: string) {
  return normalizar(pregunta)
    .split(/[^a-z0-9]+/)
    .filter((palabra) => palabra.length >= 4 && !PALABRAS_VACIAS.has(palabra))
}

function puntajeDe(guia: AssistantSource, palabras: string[]) {
  const titulo = normalizar(guia.titulo)
  const modulo = normalizar(guia.modulo)
  const contenido = normalizar(guia.contenido)
  let puntos = 0

  for (const palabra of palabras) {
    if (titulo.includes(palabra)) puntos += 5
    if (modulo.includes(palabra)) puntos += 3
    if (contenido.includes(palabra)) puntos += 1
  }

  return puntos
}

export default class AssistantSourceService {
  async index(scope: AccessScope, incluirApagadas = false) {
    if (incluirApagadas && !scope.isAdmin) {
      throw new Exception('Solo un administrador puede ver las guías apagadas', {
        status: 403,
        code: 'E_FORBIDDEN',
      })
    }

    const query = AssistantSource.query().orderBy('id_source', 'asc')
    if (!incluirApagadas) query.where('estado', true)

    return query
  }

  async buscar(pregunta: string) {
    const palabras = palabrasDe(pregunta)
    if (palabras.length === 0) return []

    const guias = await AssistantSource.query().where('estado', true).orderBy('id_source', 'asc')

    return guias
      .map((guia) => ({ guia, puntos: puntajeDe(guia, palabras) }))
      .filter((item) => item.puntos > 0)
      .sort((a, b) => b.puntos - a.puntos || a.guia.id - b.guia.id)
      .map((item) => item.guia)
  }

  async preguntar(pregunta: string, nombres = '') {
    const directa = respuestaDirecta(pregunta, nombres)
    if (directa) {
      return {
        respuesta: directa,
        fuentes: [] as { id: number; titulo: string; modulo: string }[],
      }
    }

    const guias = (await this.buscar(pregunta)).slice(0, 3)

    if (guias.length === 0) {
      return {
        respuesta:
          'Todavía no tengo una guía de ese tema. Si no te aparece una opción en la plataforma, puede ser por los permisos de tu perfil. Contacta al administrador de SIGMA.',
        fuentes: [] as { id: number; titulo: string; modulo: string }[],
      }
    }

    const respuesta = guias
      .map((guia) => `${guia.titulo} (${guia.modulo})\n${guia.contenido}`)
      .join('\n\n')

    return {
      respuesta,
      fuentes: guias.map((guia) => ({
        id: guia.id,
        titulo: guia.titulo,
        modulo: guia.modulo,
      })),
    }
  }

  async store(payload: GuiaPayload) {
    try {
      return await AssistantSource.create({
        titulo: payload.titulo,
        modulo: payload.modulo,
        contenido: payload.contenido,
        estado: payload.estado ?? true,
      })
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo guardar la guía')
    }
  }

  async update(id: number, payload: Partial<GuiaPayload>) {
    const guia = await AssistantSource.findOrFail(id)

    guia.merge({
      ...(payload.titulo !== undefined ? { titulo: payload.titulo } : {}),
      ...(payload.modulo !== undefined ? { modulo: payload.modulo } : {}),
      ...(payload.contenido !== undefined ? { contenido: payload.contenido } : {}),
      ...(payload.estado !== undefined ? { estado: payload.estado } : {}),
    })

    try {
      await guia.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo actualizar la guía')
    }

    return guia
  }
}
