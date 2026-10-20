
import { Exception } from '@adonisjs/core/exceptions'
import LineaTematica from '#models/linea_tematica'
import {
  assertPlatformCatalog,
  type AccessScope,
} from '#services/access_control'
import { rethrowDatabaseError } from '#services/database_error'

type LineaTematicaPayload = {
  lineaTematica: string
  descripcionLineaTematica?: string | null
  estado?: boolean
}

export default class LineaTematicaService {
  destroy(_arg0: number) {
      throw new Error('Method not implemented.')
  }
  async index(
    _scope: AccessScope,
    options: { estado?: boolean } = {}
  ) {
    return LineaTematica.query()
      .where('estado', options.estado ?? true)
      .orderBy('linea_tematica', 'asc')
  }

  async show(_scope: AccessScope, id: number) {
    return LineaTematica.query()
      .where('id_linea_tematica', id)
      .preload('redesConocimiento')
      .firstOrFail()
  }

  async store(scope: AccessScope, payload: LineaTematicaPayload) {
    assertPlatformCatalog(scope)

    try {
      return await LineaTematica.create({
        lineaTematica: payload.lineaTematica,
        descripcionLineaTematica: payload.descripcionLineaTematica ?? null,
        estado: payload.estado ?? true,
      })
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo crear la línea temática')
    }
  }

  async update(
    scope: AccessScope,
    id: number,
    payload: Partial<LineaTematicaPayload>
  ) {
    assertPlatformCatalog(scope)

    const linea = await LineaTematica.findOrFail(id)

    linea.merge({
      ...(payload.lineaTematica !== undefined
        ? { lineaTematica: payload.lineaTematica }
        : {}),
      ...(payload.descripcionLineaTematica !== undefined
        ? { descripcionLineaTematica: payload.descripcionLineaTematica }
        : {}),
      ...(payload.estado !== undefined ? { estado: payload.estado } : {}),
    })

    try {
      await linea.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo actualizar la línea temática')
    }

    return this.show(scope, id)
  }

  async remove(scope: AccessScope, id: number) {
    assertPlatformCatalog(scope)

    const linea = await LineaTematica.findOrFail(id)

    if (!linea.estado) {
      throw new Exception('La línea temática ya está deshabilitada', {
        status: 409,
        code: 'E_ALREADY_DISABLED',
      })
    }

    linea.estado = false

    try {
      await linea.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo deshabilitar la línea temática')
    }

    return { message: 'Línea temática deshabilitada correctamente' }
  }
}
