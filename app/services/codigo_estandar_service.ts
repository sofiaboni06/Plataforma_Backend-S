import CodigoEstandar from '#models/codigo_estandar'

export default class CodigoEstandarService {
  async index() {
    return CodigoEstandar.query().orderBy('codigo', 'asc')
  }

  async show(id: number) {
    return CodigoEstandar.findOrFail(id)
  }
}
