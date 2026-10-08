import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

/**
 * Avisos diarios de préstamos de equipo vencidos. Programarlo una vez al día,
 * por ejemplo a las 7:00 (ver la nota en el reporte o en el README):
 *
 *   node ace solicitudes:avisar-plazos
 *   node ace solicitudes:avisar-plazos --dia=2026-10-08
 */
export default class AvisarPlazos extends BaseCommand {
  static commandName = 'solicitudes:avisar-plazos'
  static description =
    'Avisa al instructor y a bodega los préstamos de equipo que vencen hoy o ya vencieron'

  static options: CommandOptions = {
    startApp: true,
  }

  @flags.string({ description: 'Día a revisar (YYYY-MM-DD). Por defecto, hoy en Colombia' })
  declare dia?: string

  async run() {
    const { default: PrestamoService } = await import('#services/prestamo_service')
    const resultado = await new PrestamoService().avisarVencidos(this.dia)

    this.logger.info(
      `Día ${resultado.dia}: ${resultado.pedidos} pedidos con plazo vencido o que vence hoy; ${resultado.avisos} avisos nuevos.`
    )
  }
}
