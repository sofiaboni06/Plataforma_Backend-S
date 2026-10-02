import { Exception } from '@adonisjs/core/exceptions'
import Elemento from '#models/elemento'

export default class DisponibilidadService {
  async assertHayStock(idElemento: number, cantidadPedida: number) {
    const elemento = await Elemento.find(idElemento)
    if (!elemento) {
      throw new Exception('El Elemento no existe ', {
        status: 404,
        code: 'E_NOT_FOUND',
      })
    }
    if (cantidadPedida > elemento.cantidad) {
      throw new Exception(`Solo hay disponibilidad de ${elemento.cantidad}`, {
        status: 422,
        code: 'E_SIN_STOCK',
      })
    }
  }
}
