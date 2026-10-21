import { Exception } from '@adonisjs/core/exceptions'
import db from '@adonisjs/lucid/services/db'
import NivelPrograma from '#models/nivel_programa'
import ProgramaFormacion from '#models/programa_formacion'
import RedConocimiento from '#models/red_conocimiento'
import { rethrowDatabaseError } from '#services/database_error'

type ProgramaFormacionPayload = {
  idRedConocimiento: number
  idLineaTematica: number
  idNivelPrograma: number
  codigo: string
  nombre: string
  version: string
  duracionTotalHoras?: number | null
  cupoBaseAprendices?: number
  estado?: boolean
}

export default class ProgramaFormacionService {
  async index(
    options: {
      estado?: boolean
      idNivelPrograma?: number
      idCformacion?: number
      search?: string
    } = {}
  ) {
    const query = ProgramaFormacion.query()
      .preload('nivel')
      .preload('redConocimiento')
      .preload('lineaTematica')
      .preload('fichas', (fichas) => {
        fichas.preload('centroFormacion')
      })
      .where('estado_programa', options.estado ?? true)
      .orderBy('nombre_programa', 'asc')

    if (options.idNivelPrograma) {
      query.where('id_nivel_programa', options.idNivelPrograma)
    }

    if (options.idCformacion) {
      query.whereIn(
        'id_programa_formacion',
        db.from('ficha').select('programa_id').where('centro_formacion_id', options.idCformacion)
      )
    }

    if (options.search) {
      query.whereILike('nombre_programa', `%${options.search}%`)
    }

    return query
  }

  async show(id: number) {
    return ProgramaFormacion.query()
      .where('id_programa_formacion', id)
      .preload('nivel')
      .preload('redConocimiento')
      .preload('lineaTematica')
      .preload('fichas', (fichas) => {
        fichas.preload('centroFormacion')
      })
      .firstOrFail()
  }

  async store(payload: ProgramaFormacionPayload) {
    await this.assertRedLinea(payload.idRedConocimiento, payload.idLineaTematica)

    try {
      const programa = await ProgramaFormacion.create({
        idRedConocimiento: payload.idRedConocimiento,
        idLineaTematica: payload.idLineaTematica,
        idNivelPrograma: payload.idNivelPrograma,
        codigo: payload.codigo,
        nombre: payload.nombre,
        version: payload.version,
        duracionTotalHoras: payload.duracionTotalHoras ?? null,
        cupoBaseAprendices: payload.cupoBaseAprendices ?? 30,
        estado: payload.estado ?? true,
      })

      return this.show(programa.id)
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo crear el programa de formación')
    }
  }

  async update(id: number, payload: Partial<ProgramaFormacionPayload>) {
    const programa = await ProgramaFormacion.findOrFail(id)

    const idRedConocimiento = payload.idRedConocimiento ?? programa.idRedConocimiento
    const idLineaTematica = payload.idLineaTematica ?? programa.idLineaTematica

    if (payload.idRedConocimiento !== undefined || payload.idLineaTematica !== undefined) {
      await this.assertRedLinea(idRedConocimiento, idLineaTematica)
    }

    programa.merge({
      ...(payload.idRedConocimiento !== undefined
        ? { idRedConocimiento: payload.idRedConocimiento }
        : {}),
      ...(payload.idLineaTematica !== undefined
        ? { idLineaTematica: payload.idLineaTematica }
        : {}),
      ...(payload.idNivelPrograma !== undefined
        ? { idNivelPrograma: payload.idNivelPrograma }
        : {}),
      ...(payload.codigo !== undefined ? { codigo: payload.codigo } : {}),
      ...(payload.nombre !== undefined ? { nombre: payload.nombre } : {}),
      ...(payload.version !== undefined ? { version: payload.version } : {}),
      ...(payload.duracionTotalHoras !== undefined
        ? { duracionTotalHoras: payload.duracionTotalHoras }
        : {}),
      ...(payload.cupoBaseAprendices !== undefined
        ? { cupoBaseAprendices: payload.cupoBaseAprendices }
        : {}),
      ...(payload.estado !== undefined ? { estado: payload.estado } : {}),
    })

    try {
      await programa.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo actualizar el programa de formación')
    }

    return this.show(id)
  }

  async remove(id: number) {
    const programa = await ProgramaFormacion.findOrFail(id)

    if (programa.estado === false) {
      throw new Exception('El programa de formación ya está deshabilitado', {
        status: 409,
        code: 'E_ALREADY_DISABLED',
      })
    }

    programa.estado = false

    try {
      await programa.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo deshabilitar el programa de formación')
    }

    return { message: 'Programa de formación deshabilitado correctamente' }
  }

  async options() {
    const [niveles, redes] = await Promise.all([
      NivelPrograma.query().orderBy('nivel_programa', 'asc'),
      RedConocimiento.query()
        .where('estado', true)
        .preload('lineasTematicas', (lineas) => {
          lineas.where('estado', true).orderBy('linea_tematica', 'asc')
        })
        .orderBy('red_conocimiento', 'asc'),
    ])

    return {
      niveles: niveles.map((nivel) => ({ id: nivel.id, nombre: nivel.nombre })),
      redes: redes.map((red) => ({
        id: red.id,
        nombre: red.nombre,
        lineas: red.lineasTematicas.map((linea) => ({ id: linea.id, nombre: linea.nombre })),
      })),
    }
  }

  private async assertRedLinea(idRedConocimiento: number, idLineaTematica: number) {
    const pareja = await db
      .from('redes_conocimiento_lineas_tematicas')
      .where('red_conocimiento_id', idRedConocimiento)
      .where('linea_tematica_id', idLineaTematica)
      .first()

    if (!pareja) {
      throw new Exception('La línea temática no pertenece a la red de conocimiento seleccionada', {
        status: 422,
        code: 'E_VALIDATION_ERROR',
      })
    }
  }
}
