import NivelPrograma from '#models/nivel_programa'
import { rethrowDatabaseError } from '#services/database_error'

type NivelProgramaPayload = {
  nombre: string
}

export default class NivelProgramaService {
  async index(options: { search?: string } = {}) {
    const query = NivelPrograma.query().orderBy('nivel_programa', 'asc')

    if (options.search) {
      query.whereILike('nivel_programa', `%${options.search}%`)
    }

    return query
  }

  async show(id: number) {
    return NivelPrograma.findOrFail(id)
  }

  async store(payload: NivelProgramaPayload) {
    try {
      return await NivelPrograma.create({ nombre: payload.nombre })
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo crear el nivel de programa')
    }
  }

  async update(id: number, payload: Partial<NivelProgramaPayload>) {
    const nivel = await this.show(id)

    nivel.merge({
      ...(payload.nombre !== undefined ? { nombre: payload.nombre } : {}),
    })

    try {
      await nivel.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo actualizar el nivel de programa')
    }

    return nivel
  }

  /**
   * `nivel_programa` has no `estado`: it is a short catalog. A hard delete is
   * safe until a program references it; then the database answers 409.
   */
  async remove(id: number) {
    const nivel = await this.show(id)

    try {
      await nivel.delete()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo eliminar el nivel de programa')
    }

    return { message: 'Nivel de programa eliminado correctamente' }
  }
}
