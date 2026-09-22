import UnidadMedida from '#models/unidad_medida'

export default class UnidadMedidaService {
  async index() {
    return UnidadMedida.query().orderBy('nombre', 'asc')
  }

  async show(id: number) {
    return UnidadMedida.findOrFail(id)
  }
}
