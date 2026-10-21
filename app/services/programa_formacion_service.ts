import { Exception } from '@adonisjs/core/exceptions'
import db from '@adonisjs/lucid/services/db'
import NivelPrograma from '#models/nivel_programa'
import ProgramaFormacion from '#models/programa_formacion'
import RedConocimiento from '#models/red_conocimiento'
import TrainingCenter from '#models/training_center'
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
  centroIds?: number[]
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
      .preload('centros', (centros) => {
        centros.orderBy('c_formacion.nombre', 'asc')
      })
      .where('estado_programa', options.estado ?? true)
      .orderBy('nombre_programa', 'asc')

    if (options.idNivelPrograma) {
      query.where('id_nivel_programa', options.idNivelPrograma)
    }

    if (options.idCformacion) {
      query.whereIn(
        'id_programa_formacion',
        db
          .from('programa_formacion_centro')
          .select('id_programa_formacion')
          .where('id_cformacion', options.idCformacion)
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
      .preload('centros', (centros) => {
        centros.orderBy('c_formacion.nombre', 'asc')
      })
      .firstOrFail()
  }

  async store(payload: ProgramaFormacionPayload) {
    await this.assertRedLinea(payload.idRedConocimiento, payload.idLineaTematica)
    const centroIds = await this.assertCentros(payload.centroIds ?? [])

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

      await this.syncCentros(programa.id, centroIds)

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

    const centroIds =
      payload.centroIds !== undefined ? await this.assertCentros(payload.centroIds) : undefined

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

      if (centroIds !== undefined) {
        await this.syncCentros(id, centroIds)
        await this.dropAssignmentsOutsideCentros(id, centroIds)
      }
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo actualizar el programa de formación')
    }

    return this.show(id)
  }

  async ensureCentro(programaId: number, idCformacion: number) {
    await db.rawQuery(
      `INSERT INTO programa_formacion_centro (id_programa_formacion, id_cformacion)
       VALUES (?, ?)
       ON CONFLICT DO NOTHING`,
      [programaId, idCformacion]
    )
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
    const [niveles, redes, centros] = await Promise.all([
      NivelPrograma.query().orderBy('nivel_programa', 'asc'),
      RedConocimiento.query()
        .where('estado', true)
        .preload('lineasTematicas', (lineas) => {
          lineas.where('estado', true).orderBy('linea_tematica', 'asc')
        })
        .orderBy('red_conocimiento', 'asc'),
      TrainingCenter.query().preload('regional').orderBy('nombre', 'asc'),
    ])

    return {
      niveles: niveles.map((nivel) => ({ id: nivel.id, nombre: nivel.nombre })),
      redes: redes.map((red) => ({
        id: red.id,
        nombre: red.nombre,
        lineas: red.lineasTematicas.map((linea) => ({ id: linea.id, nombre: linea.nombre })),
      })),
      centros: centros.map((centro) => ({
        id: centro.id,
        nombre: centro.nombre,
        regional: centro.regional?.nombre ?? '',
      })),
    }
  }

  private async assertCentros(centroIds: number[]) {
    const uniqueIds = [...new Set(centroIds)]

    if (!uniqueIds.length) {
      throw new Exception('Seleccione al menos un centro de formación para el programa', {
        status: 422,
        code: 'E_VALIDATION_ERROR',
      })
    }

    const centros = await TrainingCenter.query().whereIn('id', uniqueIds)

    if (centros.length !== uniqueIds.length) {
      throw new Exception('Hay un centro de formación que no existe', {
        status: 422,
        code: 'E_VALIDATION_ERROR',
      })
    }

    return uniqueIds
  }

  private async syncCentros(programaId: number, centroIds: number[]) {
    const programa = await ProgramaFormacion.findOrFail(programaId)
    const pivot = Object.fromEntries(centroIds.map((centroId) => [centroId, {}]))

    await programa.related('centros').sync(pivot)
  }

  private async dropAssignmentsOutsideCentros(programaId: number, centroIds: number[]) {
    const stale = await db
      .from('usuario_programa_formacion as upf')
      .join('usuario as u', 'u.id_usuario', 'upf.id_usuario')
      .where('upf.id_programa_formacion', programaId)
      .whereNotIn('u.id_cformacion', centroIds)
      .select('upf.id_usuario')

    if (!stale.length) {
      return
    }

    await db
      .from('usuario_programa_formacion')
      .where('id_programa_formacion', programaId)
      .whereIn(
        'id_usuario',
        stale.map((row) => Number(row.id_usuario))
      )
      .delete()
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
