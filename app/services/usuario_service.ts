import { Exception } from '@adonisjs/core/exceptions'
import db from '@adonisjs/lucid/services/db'
import Bodega from '#models/bodega'
import Perfil from '#models/perfil'
import ProgramaFormacion from '#models/programa_formacion'
import TrainingCenter from '#models/training_center'
import User from '#models/usuario'
import { rethrowDatabaseError } from '#services/database_error'

type CreateUserPayload = {
  nombres: string
  apellidos: string
  tipoDocumento: string
  numeroDocumento: string
  email: string
  password: string
  idPerfil: number
  idCformacion: number
  bodegaIds?: number[]
  programaIds?: number[]
}

type UpdateUserPayload = {
  nombres?: string
  apellidos?: string
  tipoDocumento?: string
  numeroDocumento?: string
  email?: string
  password?: string
  idPerfil?: number
  idCformacion?: number
  active?: boolean
}

export default class UsuarioService {
  async list() {
    return User.query()
      .preload('perfil')
      .preload('trainingCenter', (query) => {
        query.preload('regional')
      })
      .preload('bodegas', (query) => {
        query.wherePivot('estado', true).orderBy('id_bodega', 'asc')
      })
      .orderBy('id_usuario', 'asc')
  }

  async show(id: number) {
    const user = await User.query()
      .where('id', id)
      .preload('perfil')
      .preload('trainingCenter', (query) => {
        query.preload('regional')
      })
      .preload('bodegas', (query) => {
        query.wherePivot('estado', true).orderBy('id_bodega', 'asc')
      })
      .first()

    if (!user) {
      throw new Exception('El usuario no existe', { status: 404, code: 'E_NOT_FOUND' })
    }

    return user
  }

  async options() {
    const [roles, centers, bodegas] = await Promise.all([
      Perfil.query().where('estado', true).orderBy('nombre', 'asc'),
      TrainingCenter.query().preload('regional').orderBy('nombre', 'asc'),
      Bodega.query().where('estado', true).orderBy('nombre', 'asc'),
    ])

    return {
      roles: roles.map((role) => ({
        id: role.id,
        name: role.nombre,
      })),
      centers: centers.map((center) => ({
        id: center.id,
        name: center.nombre,
        regional: center.regional?.nombre ?? '',
      })),
      bodegas: bodegas.map((bodega) => ({
        id: bodega.id,
        name: bodega.nombre,
        trainingCenterId: bodega.idCformacion,
      })),
    }
  }

  async create(payload: CreateUserPayload) {
    const role = await this.assertActiveRole(payload.idPerfil)
    await this.assertCenter(payload.idCformacion)

    const bodegaIds = [...new Set(payload.bodegaIds ?? [])]
    const programaIds = [...new Set(payload.programaIds ?? [])]
    await this.assertBodegasInCenter(payload.idCformacion, bodegaIds)
    await this.assertProgramas(programaIds)
    await this.assertProgramasInCenter(payload.idCformacion, programaIds)

    if (programaIds.length) {
      this.assertInstructorPerfil(role)
    }

    const user = await User.create({
      nombres: payload.nombres,
      apellidos: payload.apellidos,
      tipoDocumento: payload.tipoDocumento,
      numeroDocumento: payload.numeroDocumento,
      email: payload.email,
      password: payload.password,
      idPerfil: payload.idPerfil,
      idCformacion: payload.idCformacion,
      estado: true,
    })

    if (bodegaIds.length) {
      await this.syncBodegaPivot(user, bodegaIds)
    }

    if (programaIds.length) {
      await this.syncProgramaPivot(user, programaIds)
    }

    return this.show(user.id)
  }

  async update(id: number, payload: UpdateUserPayload, actorId: number) {
    const user = await User.find(id)
    if (!user) {
      throw new Exception('El usuario no existe', { status: 404, code: 'E_NOT_FOUND' })
    }

    if (id === actorId && payload.active === false) {
      throw new Exception('No puedes desactivar tu propia cuenta', {
        status: 422,
        code: 'E_VALIDATION_ERROR',
      })
    }

    if (payload.email && payload.email !== user.email) {
      const taken = await User.query().where('email', payload.email).whereNot('id', id).first()
      if (taken) {
        throw new Exception('El correo ya está en uso', {
          status: 422,
          code: 'E_VALIDATION_ERROR',
        })
      }
    }

    if (payload.numeroDocumento && payload.numeroDocumento !== user.numeroDocumento) {
      const taken = await User.query()
        .where('numeroDocumento', payload.numeroDocumento)
        .whereNot('id', id)
        .first()
      if (taken) {
        throw new Exception('El documento ya está en uso', {
          status: 422,
          code: 'E_VALIDATION_ERROR',
        })
      }
    }

    let nextRole: Perfil | null = null
    if (payload.idPerfil !== undefined) {
      nextRole = await this.assertActiveRole(payload.idPerfil)
    }

    if (payload.idCformacion !== undefined) {
      await this.assertCenter(payload.idCformacion)
    }

    const centerChanged =
      payload.idCformacion !== undefined && payload.idCformacion !== user.idCformacion

    user.merge({
      ...(payload.nombres !== undefined ? { nombres: payload.nombres } : {}),
      ...(payload.apellidos !== undefined ? { apellidos: payload.apellidos } : {}),
      ...(payload.tipoDocumento !== undefined ? { tipoDocumento: payload.tipoDocumento } : {}),
      ...(payload.numeroDocumento !== undefined
        ? { numeroDocumento: payload.numeroDocumento }
        : {}),
      ...(payload.email !== undefined ? { email: payload.email } : {}),
      ...(payload.idPerfil !== undefined ? { idPerfil: payload.idPerfil } : {}),
      ...(payload.idCformacion !== undefined ? { idCformacion: payload.idCformacion } : {}),
      ...(payload.active !== undefined ? { estado: payload.active } : {}),
    })

    if (payload.password) {
      user.password = payload.password
    }

    await user.save()

    if (centerChanged) {
      await this.dropBodegasOutsideCenter(user)
      await this.dropProgramasOutsideCenter(user)
    }

    if (nextRole && !this.isInstructorPerfil(nextRole)) {
      await user.related('programasFormacion').detach()
    }

    return this.show(user.id)
  }

  async syncBodegas(id: number, bodegaIds: number[]) {
    const user = await User.find(id)
    if (!user) {
      throw new Exception('El usuario no existe', { status: 404, code: 'E_NOT_FOUND' })
    }

    const uniqueIds = [...new Set(bodegaIds)]
    await this.assertBodegasInCenter(user.idCformacion, uniqueIds)
    await this.syncBodegaPivot(user, uniqueIds)

    return this.show(user.id)
  }

  async programas(id: number) {
    const user = await User.query()
      .where('id', id)
      .preload('programasFormacion', (query) => {
        query
          .wherePivot('estado', true)
          .preload('nivel')
          .preload('redConocimiento')
          .preload('lineaTematica')
          .orderBy('nombre_programa', 'asc')
      })
      .first()

    if (!user) {
      throw new Exception('El usuario no existe', { status: 404, code: 'E_NOT_FOUND' })
    }

    return user.programasFormacion
  }

  async syncProgramas(id: number, programIds: number[]) {
    const user = await User.query().where('id', id).preload('perfil').first()
    if (!user) {
      throw new Exception('El usuario no existe', { status: 404, code: 'E_NOT_FOUND' })
    }

    this.assertInstructorPerfil(user.perfil)

    const uniqueIds = [...new Set(programIds)]
    await this.assertProgramas(uniqueIds)
    await this.assertProgramasInCenter(user.idCformacion, uniqueIds)
    await this.syncProgramaPivot(user, uniqueIds)

    return this.programas(user.id)
  }

  async usuariosDelPrograma(id: number) {
    const programa = await ProgramaFormacion.query()
      .where('id', id)
      .preload('usuarios', (query) => {
        query
          .wherePivot('estado', true)
          .preload('perfil')
          .preload('trainingCenter', (center) => center.preload('regional'))
          .orderBy('nombres', 'asc')
      })
      .first()

    if (!programa) {
      throw new Exception('El programa de formación no existe', {
        status: 404,
        code: 'E_NOT_FOUND',
      })
    }

    return programa.usuarios
  }

  private async syncBodegaPivot(user: User, bodegaIds: number[]) {
    const pivot = Object.fromEntries(bodegaIds.map((bodegaId) => [bodegaId, { estado: true }]))
    await user.related('bodegas').sync(pivot)
  }

  private async syncProgramaPivot(user: User, programIds: number[]) {
    const pivot = Object.fromEntries(programIds.map((programId) => [programId, { estado: true }]))

    try {
      await user.related('programasFormacion').sync(pivot)
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudieron asignar los programas de formación')
    }
  }

  private async assertProgramas(programIds: number[]) {
    if (!programIds.length) {
      return
    }

    const programs = await ProgramaFormacion.query()
      .whereIn('id', programIds)
      .where('estado_programa', true)

    const found = new Set(programs.map((program) => program.id))
    const unknown = programIds.filter((programId) => !found.has(programId))

    if (unknown.length) {
      throw new Exception(`Estos programas no existen o están inactivos: ${unknown.join(', ')}`, {
        status: 422,
        code: 'E_VALIDATION_ERROR',
      })
    }
  }

  /**
   * A user may only be assigned bodegas of their own training center, which is
   * what keeps the inventory data isolated per center.
   */
  private async assertBodegasInCenter(idCformacion: number, bodegaIds: number[]) {
    if (!bodegaIds.length) {
      return
    }

    const bodegas = await Bodega.query().whereIn('id', bodegaIds)

    if (bodegas.length !== bodegaIds.length) {
      throw new Exception('Hay una bodega que no existe', {
        status: 422,
        code: 'E_VALIDATION_ERROR',
      })
    }

    const outside = bodegas.filter((bodega) => bodega.idCformacion !== idCformacion)

    if (outside.length) {
      throw new Exception(
        `Estas bodegas no pertenecen al centro de formación del usuario: ${outside
          .map((bodega) => bodega.nombre)
          .join(', ')}`,
        { status: 422, code: 'E_VALIDATION_ERROR' }
      )
    }
  }

  private async dropBodegasOutsideCenter(user: User) {
    const assigned = await user
      .related('bodegas')
      .query()
      .select('bodega.id_bodega', 'bodega.id_cformacion')
    const outside = assigned
      .filter((bodega) => bodega.idCformacion !== user.idCformacion)
      .map((bodega) => bodega.id)

    if (outside.length) {
      await user.related('bodegas').detach(outside)
    }
  }

  /**
   * Un instructor solo puede dictar programas que su centro tenga asociados.
   */
  private async assertProgramasInCenter(idCformacion: number, programaIds: number[]) {
    if (!programaIds.length) {
      return
    }

    const offered = await db
      .from('programa_formacion_centro')
      .where('id_cformacion', idCformacion)
      .whereIn('id_programa_formacion', programaIds)
      .select('id_programa_formacion')

    const offeredIds = new Set(offered.map((row) => Number(row.id_programa_formacion)))
    const outside = programaIds.filter((programaId) => !offeredIds.has(programaId))

    if (outside.length) {
      throw new Exception(
        `Estos programas no están disponibles en el centro de formación del instructor: ${outside.join(', ')}`,
        { status: 422, code: 'E_VALIDATION_ERROR' }
      )
    }
  }

  private async dropProgramasOutsideCenter(user: User) {
    const assigned = await user
      .related('programasFormacion')
      .query()
      .select('programa_formacion.id_programa_formacion')

    if (!assigned.length) {
      return
    }

    const offered = await db
      .from('programa_formacion_centro')
      .where('id_cformacion', user.idCformacion)
      .whereIn(
        'id_programa_formacion',
        assigned.map((programa) => programa.id)
      )
      .select('id_programa_formacion')
    const offeredIds = new Set(offered.map((row) => Number(row.id_programa_formacion)))
    const outside = assigned
      .filter((programa) => !offeredIds.has(programa.id))
      .map((programa) => programa.id)

    if (outside.length) {
      await user.related('programasFormacion').detach(outside)
    }
  }

  private isInstructorPerfil(perfil: Perfil | null | undefined) {
    return Boolean(perfil && /^instructor/i.test(perfil.nombre))
  }

  private assertInstructorPerfil(perfil: Perfil | null | undefined) {
    if (!this.isInstructorPerfil(perfil)) {
      throw new Exception('Solo se pueden asignar programas a usuarios con perfil Instructor', {
        status: 422,
        code: 'E_VALIDATION_ERROR',
      })
    }
  }

  private async assertActiveRole(idPerfil: number) {
    const role = await Perfil.find(idPerfil)
    if (!role || !role.estado) {
      throw new Exception('El perfil no existe o está inactivo', {
        status: 422,
        code: 'E_VALIDATION_ERROR',
      })
    }

    return role
  }

  private async assertCenter(idCformacion: number) {
    const center = await TrainingCenter.find(idCformacion)
    if (!center) {
      throw new Exception('El centro de formación no existe', {
        status: 422,
        code: 'E_VALIDATION_ERROR',
      })
    }
  }
}
