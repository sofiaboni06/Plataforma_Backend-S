import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { GUIAS_ASISTENTE } from '#data/assistant_guides'
import AssistantSource from '#models/assistant_source'

const AVISO =
  'Si no te aparece el menú, el botón o la pantalla, puede ser por los permisos de tu perfil. Contacta al administrador de SIGMA.'

/**
 * Carga las guías del asistente. Se puede correr otra vez:
 * si el título ya existe, actualiza el texto y la deja encendida.
 */
export default class extends BaseSeeder {
  async run() {
    for (const guia of GUIAS_ASISTENTE) {
      const contenido = guia.contenido.includes(AVISO)
        ? guia.contenido
        : `${guia.contenido}\n\n${AVISO}`

      const existing = await AssistantSource.query().where('titulo', guia.titulo).first()

      if (!existing) {
        await AssistantSource.create({
          titulo: guia.titulo,
          modulo: guia.modulo,
          contenido,
          estado: true,
        })
        continue
      }

      existing.merge({ modulo: guia.modulo, contenido, estado: true })
      await existing.save()
    }
  }
}
