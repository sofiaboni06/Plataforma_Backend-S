import db from '@adonisjs/lucid/services/db'
import SolicitudEquipo from '#models/solicitud_equipo'
import NotificacionService from '#services/notificacion_service'
import { fechaValida, hoy, type FechaDia } from '#services/plazo'

/**
 * Plazos de los préstamos de equipo. Lo corre a diario el comando
 * `node ace solicitudes:avisar-plazos` (programado con cron o con el
 * Programador de tareas de Windows).
 */
export default class PrestamoService {
  private notificaciones = new NotificacionService()

  /**
   * Busca las filas de equipo con unidades afuera cuyo plazo es hoy o ya pasó
   * y manda un aviso por pedido (código) al instructor y a bodega. Repetirlo el
   * mismo día no duplica avisos.
   */
  async avisarVencidos(dia: FechaDia = hoy(), opciones: { emitir?: boolean } = {}) {
    const fecha = fechaValida(dia, 'El día a revisar')
    const filas = await SolicitudEquipo.query()
      .whereColumn('cantidad_entregada', '>', 'cantidad_devuelta')
      .whereNotNull('fecha_devolucion_limite')
      .where('fecha_devolucion_limite', '<=', fecha)
      .preload('elemento')
      .preload('obra')
      .orderBy('id_solicitud_equipo', 'asc')

    // Un pedido es el código dentro del centro, de una persona.
    const pedidos = new Map<string, SolicitudEquipo[]>()

    for (const row of filas) {
      const clave = `${row.obra?.idCformacion ?? 0}:${row.codigoSolicitud}:${row.idUsuario}`
      pedidos.set(clave, [...(pedidos.get(clave) ?? []), row])
    }

    const trx = await db.transaction()
    const avisos: Awaited<ReturnType<NotificacionService['vencimientoEquipo']>> = []

    try {
      for (const grupo of pedidos.values()) {
        // El más apretado manda; lo normal es que todo el pedido tenga el mismo.
        const limite = grupo.map((row) => row.fechaDevolucionLimite!).sort()[0]

        avisos.push(
          ...(await this.notificaciones.vencimientoEquipo(trx, {
            codigoSolicitud: grupo[0].codigoSolicitud,
            idSolicitante: grupo[0].idUsuario,
            limite,
            dia: fecha,
            lineas: grupo.map((row) => ({
              idSolicitud: row.id,
              idElemento: row.idElemento,
              elemento: row.elemento?.nombre ?? 'equipo',
              afuera: row.cantidadEntregada - row.cantidadDevuelta,
            })),
          }))
        )
      }

      await trx.commit()
    } catch (error) {
      await trx.rollback()
      throw error
    }

    if (opciones.emitir) {
      this.notificaciones.emitir(avisos)
    }

    return { dia: fecha, pedidos: pedidos.size, avisos: avisos.length }
  }
}
