import Jornada from '#models/jornada'

export default class JornadaService {
  async index() {
    return Jornada.query().orderBy('id_jornada', 'asc')
  }
}
