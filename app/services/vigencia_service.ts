import { Exception } from '@adonisjs/core/exceptions'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import Vigencia from '#models/vigencia'
import VigenciaEspecial from '#models/vigencia_especial'
import VigenciaEspecialPrograma from '#models/vigencia_especial_programa'
import { assertCan, type AccessScope } from '#services/access_control'
import { rethrowDatabaseError } from '#services/database_error'
import NotificacionService from '#services/notificacion_service'

type VigenciaPayload = {
  anio: number
  activa?: boolean
  fechaApertura?: DateTime | null
  fechaCierre?: DateTime | null
}

export default class VigenciaService {
  async index(scope: AccessScope) {
    assertCan(scope, 'vigencia.ver')
    return Vigencia.query().orderBy('anio', 'desc')
  }

  async activa(scope: AccessScope) {
    assertCan(scope, 'vigencia.ver')
    return Vigencia.query().where('activa', true).first()
  }

  async store(scope: AccessScope, payload: VigenciaPayload) {
    assertCan(scope, 'vigencia.crear')
    this.assertFechas(payload.fechaApertura ?? null, payload.fechaCierre ?? null)

    try {
      if (payload.activa) {
        await Vigencia.query().update({ activa: false })
      }

      return await Vigencia.create({
        anio: payload.anio,
        activa: payload.activa ?? false,
        fechaApertura: payload.fechaApertura ?? null,
        fechaCierre: payload.fechaCierre ?? null,
      })
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo crear la vigencia')
    }
  }

  async update(scope: AccessScope, anio: number, payload: Omit<VigenciaPayload, 'anio'>) {
    assertCan(scope, 'vigencia.editar')
    const vigencia = await Vigencia.findOrFail(anio)
    const apertura = payload.fechaApertura !== undefined ? payload.fechaApertura : vigencia.fechaApertura
    const cierre = payload.fechaCierre !== undefined ? payload.fechaCierre : vigencia.fechaCierre
    this.assertFechas(apertura, cierre)

    try {
      if (payload.activa === true) {
        await Vigencia.query().whereNot('anio', anio).update({ activa: false })
      }

      vigencia.merge({
        ...(payload.activa !== undefined ? { activa: payload.activa } : {}),
        ...(payload.fechaApertura !== undefined ? { fechaApertura: payload.fechaApertura } : {}),
        ...(payload.fechaCierre !== undefined ? { fechaCierre: payload.fechaCierre } : {}),
      })
      await vigencia.save()
      return vigencia
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo actualizar la vigencia')
    }
  }

  async remove(scope: AccessScope, anio: number) {
    assertCan(scope, 'vigencia.eliminar')
    const vigencia = await Vigencia.findOrFail(anio)
    try {
      await vigencia.delete()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo eliminar la vigencia porque hay solicitudes asociadas')
    }
    return { message: 'Vigencia eliminada' }
  }

  async especiales(scope: AccessScope, anio: number) {
    assertCan(scope, 'vigencia_especial.ver')
    await Vigencia.findOrFail(anio)
    return VigenciaEspecial.query()
      .where('anio', anio)
      .where('idCformacion', scope.idCformacion)
      .preload('programas', (query) => query.preload('programa'))
      .orderBy('id', 'desc')
  }

  async crearEspecial(
    scope: AccessScope,
    anio: number,
    payload: { nombre: string; monto?: number }
  ) {
    assertCan(scope, 'vigencia_especial.editar')
    await Vigencia.findOrFail(anio)
    try {
      const especial = await VigenciaEspecial.create({
        anio,
        idCformacion: scope.idCformacion,
        nombre: payload.nombre,
        monto: payload.monto ?? 0,
        activa: true,
      })
      await new NotificacionService().avisarVigenciaEspecial({
        idCformacion: scope.idCformacion,
        idVigenciaEspecial: especial.id,
        nombre: especial.nombre,
        monto: Number(especial.monto),
      })
      return especial
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo crear la vigencia especial')
    }
  }

  async actualizarEspecial(
    scope: AccessScope,
    anio: number,
    id: number,
    payload: { nombre?: string; monto?: number; activa?: boolean }
  ) {
    assertCan(scope, 'vigencia_especial.editar')
    const especial = await this.especialDelCentro(scope, anio, id)
    const montoAnterior = Number(especial.monto)
    especial.merge({
      ...(payload.nombre !== undefined ? { nombre: payload.nombre } : {}),
      ...(payload.monto !== undefined ? { monto: payload.monto } : {}),
      ...(payload.activa !== undefined ? { activa: payload.activa } : {}),
    })
    try {
      await especial.save()
      if (payload.monto !== undefined && payload.monto !== montoAnterior) {
        await new NotificacionService().avisarVigenciaEspecial({
          idCformacion: scope.idCformacion,
          idVigenciaEspecial: especial.id,
          nombre: especial.nombre,
          monto: Number(especial.monto),
        })
      }
      return especial
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo actualizar la vigencia especial')
    }
  }

  async agregarPrograma(scope: AccessScope, anio: number, id: number, programaId: number) {
    assertCan(scope, 'vigencia_especial.editar')
    const especial = await this.especialDelCentro(scope, anio, id)
    const ocupado = await VigenciaEspecialPrograma.query()
      .where('programaId', programaId)
      .whereIn(
        'vigenciaEspecialId',
        VigenciaEspecial.query()
          .where('anio', anio)
          .where('idCformacion', scope.idCformacion)
          .select('id')
      )
      .first()
    if (ocupado) {
      throw new Exception('Ese programa ya está en una vigencia especial de este año', {
        status: 409,
        code: 'E_CONFLICT',
      })
    }

    try {
      await VigenciaEspecialPrograma.create({
        vigenciaEspecialId: especial.id,
        programaId,
      })
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo agregar el programa a la vigencia especial')
    }

    await especial.load('programas', (query) => query.preload('programa'))
    return especial
  }

  async quitarPrograma(scope: AccessScope, anio: number, id: number, programaId: number) {
    assertCan(scope, 'vigencia_especial.editar')
    await this.especialDelCentro(scope, anio, id)
    const fila = await VigenciaEspecialPrograma.query()
      .where('vigenciaEspecialId', id)
      .where('programaId', programaId)
      .first()
    if (!fila) {
      throw new Exception('El programa no está en esta vigencia especial', {
        status: 404,
        code: 'E_ROW_NOT_FOUND',
      })
    }
    await fila.delete()
    return { message: 'Programa retirado de la vigencia especial' }
  }

  async paraRepartir(scope: AccessScope, anio: number) {
    assertCan(scope, 'solicitud_programa.ver')
    const filas = await db
      .from('vigencia_especial as ve')
      .join('vigencia_especial_asignacion as a', 'a.id_vigencia_especial', 've.id_vigencia_especial')
      .where('ve.anio', anio)
      .where('ve.id_cformacion', scope.idCformacion)
      .where('ve.activa', true)
      .where('a.id_usuario', scope.idUsuario)
      .select('ve.id_vigencia_especial as id', 've.nombre', 've.anio', 'a.monto', 'a.id_asignacion_especial')
    const resultado = []
    for (const fila of filas) {
      resultado.push({
        id: Number(fila.id),
        nombre: fila.nombre as string,
        anio: Number(fila.anio),
        monto: Number(fila.monto),
        areas: await this.areasDe(scope.idUsuario, Number(fila.id_asignacion_especial)),
      })
    }
    return resultado
  }

  async reparto(scope: AccessScope, anio: number, id: number) {
    assertCan(scope, 'vigencia_especial.ver')
    const especial = await this.especialDelCentro(scope, anio, id)
    const coordinadores = await this.coordinadoresDelCentro(scope.idCformacion, especial.id)
    const repartido = coordinadores.reduce((suma, fila) => suma + fila.monto, 0)
    return {
      id: especial.id,
      nombre: especial.nombre,
      monto: Number(especial.monto),
      repartido,
      sinRepartir: Number(especial.monto) - repartido,
      coordinadores,
    }
  }

  async asignarCoordinadorEspecial(
    scope: AccessScope,
    anio: number,
    id: number,
    idUsuario: number,
    monto: number
  ) {
    assertCan(scope, 'vigencia_especial.editar')
    const especial = await this.especialDelCentro(scope, anio, id)
    const coordinador = await db
      .from('usuario as u')
      .join('perfil as pf', 'pf.id_perfil', 'u.id_perfil')
      .where('u.id_usuario', idUsuario)
      .where('u.estado', true)
      .where('u.id_cformacion', scope.idCformacion)
      .where('pf.estado', true)
      .whereRaw(`pf.nombre ILIKE 'coordinador%'`)
      .first()
    if (!coordinador) {
      throw new Exception('Ese coordinador no pertenece a tu centro', {
        status: 422,
        code: 'E_PRESUPUESTO',
      })
    }
    const actual = await db
      .from('vigencia_especial_asignacion')
      .where('id_vigencia_especial', especial.id)
      .where('id_usuario', idUsuario)
      .first()
    const otros = await db
      .from('vigencia_especial_asignacion')
      .where('id_vigencia_especial', especial.id)
      .whereNot('id_usuario', idUsuario)
      .sum({ total: 'monto' })
      .first()
    const queda = Number(especial.monto) - Number(otros?.total ?? 0)
    if (monto > queda) {
      throw new Exception(`Supera lo que queda de la vigencia especial. Quedan ${queda}.`, {
        status: 422,
        code: 'E_PRESUPUESTO',
      })
    }
    try {
      if (monto === 0 && actual) {
        await db.from('vigencia_especial_asignacion').where('id_asignacion_especial', actual.id_asignacion_especial).delete()
      } else if (actual) {
        await db.from('vigencia_especial_asignacion').where('id_asignacion_especial', actual.id_asignacion_especial).update({ monto })
      } else if (monto > 0) {
        await db.table('vigencia_especial_asignacion').insert({
          id_vigencia_especial: especial.id,
          id_usuario: idUsuario,
          monto,
        })
      }
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo repartir la vigencia especial')
    }
    if (monto > 0) {
      await new NotificacionService().avisarVigenciaEspecial({
        idCformacion: scope.idCformacion,
        idVigenciaEspecial: especial.id,
        nombre: especial.nombre,
        monto,
        idUsuario,
      })
    }
    return this.reparto(scope, anio, id)
  }

  async asignarAreaEspecial(scope: AccessScope, anio: number, id: number, redId: number, monto: number) {
    assertCan(scope, 'solicitud_programa.editar')
    await this.especialDelCentro(scope, anio, id)
    const asignacion = await db
      .from('vigencia_especial_asignacion')
      .where('id_vigencia_especial', id)
      .where('id_usuario', scope.idUsuario)
      .first()
    if (!asignacion) {
      throw new Exception('La subdirectora todavía no te asignó monto en esta vigencia especial', {
        status: 422,
        code: 'E_PRESUPUESTO',
      })
    }
    const redes = await this.idsRedes(scope.idUsuario)
    if (!redes.includes(redId)) {
      throw new Exception('Esa área no está en tus redes', { status: 422, code: 'E_PRESUPUESTO' })
    }
    const actual = await db
      .from('vigencia_especial_asignacion_red')
      .where('id_asignacion_especial', asignacion.id_asignacion_especial)
      .where('id_red_conocimiento', redId)
      .first()
    const otros = await db
      .from('vigencia_especial_asignacion_red')
      .where('id_asignacion_especial', asignacion.id_asignacion_especial)
      .whereNot('id_red_conocimiento', redId)
      .sum({ total: 'monto' })
      .first()
    const queda = Number(asignacion.monto) - Number(otros?.total ?? 0)
    if (monto > queda) {
      throw new Exception(`Supera lo que te queda. Quedan ${queda}.`, {
        status: 422,
        code: 'E_PRESUPUESTO',
      })
    }
    try {
      if (monto === 0 && actual) {
        await db.from('vigencia_especial_asignacion_red').where('id_asignacion_especial_red', actual.id_asignacion_especial_red).delete()
      } else if (actual) {
        await db.from('vigencia_especial_asignacion_red').where('id_asignacion_especial_red', actual.id_asignacion_especial_red).update({ monto })
      } else if (monto > 0) {
        await db.table('vigencia_especial_asignacion_red').insert({
          id_asignacion_especial: asignacion.id_asignacion_especial,
          id_red_conocimiento: redId,
          monto,
        })
      }
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo distribuir el área de la vigencia especial')
    }
    const areas = await this.areasDe(scope.idUsuario, Number(asignacion.id_asignacion_especial))
    return { id, monto: Number(asignacion.monto), areas }
  }

  private async coordinadoresDelCentro(idCformacion: number, especialId: number) {
    const usuarios = await db
      .from('usuario as u')
      .join('perfil as pf', 'pf.id_perfil', 'u.id_perfil')
      .where('u.estado', true)
      .where('u.id_cformacion', idCformacion)
      .where('pf.estado', true)
      .whereRaw(`pf.nombre ILIKE 'coordinador%'`)
      .orderBy('u.nombres', 'asc')
      .select('u.id_usuario as id', 'u.nombres', 'u.apellidos')
    const asignaciones = await db
      .from('vigencia_especial_asignacion')
      .where('id_vigencia_especial', especialId)
    const porUsuario = new Map(asignaciones.map((fila) => [Number(fila.id_usuario), Number(fila.monto)]))
    return usuarios.map((usuario) => ({
      id: Number(usuario.id),
      fullName: `${usuario.nombres} ${usuario.apellidos}`.trim(),
      monto: porUsuario.get(Number(usuario.id)) ?? 0,
    }))
  }

  private async areasDe(idUsuario: number, asignacionId: number) {
    const ids = await this.idsRedes(idUsuario)
    const redes = await db
      .from('redes_conocimiento')
      .whereIn('id_red_conocimiento', ids.length ? ids : [0])
      .orderBy('nombre', 'asc')
      .select('id_red_conocimiento as id', 'red_conocimiento as nombre')
    const montos = await db
      .from('vigencia_especial_asignacion_red')
      .where('id_asignacion_especial', asignacionId)
    const porRed = new Map(montos.map((fila) => [Number(fila.id_red_conocimiento), Number(fila.monto)]))
    return redes.map((red) => ({
      id: Number(red.id),
      nombre: red.nombre as string,
      monto: porRed.get(Number(red.id)) ?? 0,
    }))
  }

  private async idsRedes(idUsuario: number) {
    const filas = await db
      .from('usuario_red_conocimiento')
      .where('id_usuario', idUsuario)
      .where('estado', true)
      .distinct('id_red_conocimiento')
    return filas.map((fila) => Number(fila.id_red_conocimiento))
  }

  private async especialDelCentro(scope: AccessScope, anio: number, id: number) {
    const especial = await VigenciaEspecial.query()
      .where('id', id)
      .where('anio', anio)
      .where('idCformacion', scope.idCformacion)
      .first()
    if (!especial) {
      throw new Exception('La vigencia especial no existe en este centro', {
        status: 404,
        code: 'E_ROW_NOT_FOUND',
      })
    }
    return especial
  }

  private assertFechas(apertura: DateTime | null, cierre: DateTime | null) {
    if (apertura && cierre && cierre < apertura) {
      throw new Exception('La fecha de cierre no puede ser anterior a la de apertura', {
        status: 422,
        code: 'E_VALIDATION_ERROR',
      })
    }
  }
}
