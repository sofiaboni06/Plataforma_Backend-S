import { Exception } from '@adonisjs/core/exceptions'
import Elemento from '#models/elemento'
import ListaMaestraMaterial from '#models/lista_maestra_material'
import ProgramaFormacion from '#models/programa_formacion'
import SolicitudMaterialFormacion, {
  type EstadoSolicitudMaterialFormacion,
} from '#models/solicitud_material_formacion'
import { rethrowDatabaseError } from '#services/database_error'
import type { AccessScope } from '#services/access_control'

type MaterialFormacionPayload = {
  idPrograma?: number
  idElemento?: number
  cantidadBase?: number
  observaciones?: string | null
  estado?: boolean
}

type SolicitudFormacionPayload = {
  idMaterial: number
  cantidadSolicitada: number
  observaciones?: string
}

/**
 * CRUD de materiales de formación sobre `lista_maestra_material`: qué elemento
 * del inventario usa cada programa y con qué cantidad base. Catálogo de
 * plataforma (no hay centro de formación); la baja es lógica porque las
 * solicitudes por programa referencian la fila con FK RESTRICT.
 */
export default class MaterialFormacionService {
  async index(options: { idPrograma?: number; estado?: boolean } = {}) {
    const query = ListaMaestraMaterial.query()
      .preload('programa')
      .preload('elemento', (elementoQuery) => elementoQuery.preload('unidadMedida'))
      .orderBy('id_lista_maestra', 'desc')

    if (options.idPrograma !== undefined) {
      query.where('id_programa_formacion', options.idPrograma)
    }

    if (options.estado !== undefined) {
      query.where('estado', options.estado)
    }

    return query
  }

  async show(id: number) {
    return this.findRow(id)
  }

  async create(scope: AccessScope, payload: NonNullable<MaterialFormacionPayload>) {
    const idPrograma = payload.idPrograma!
    const idElemento = payload.idElemento!

    await this.assertProgramaEnUso(idPrograma)
    await this.assertElementoEnUso(idElemento)
    await this.assertParLibre(idPrograma, idElemento)

    try {
      const material = await ListaMaestraMaterial.create({
        idProgramaFormacion: idPrograma,
        idElemento,
        cantidadBase: payload.cantidadBase!,
        observaciones: payload.observaciones ?? null,
        idUsuarioRegistro: scope.idUsuario,
        estado: payload.estado ?? true,
      })

      // Se recarga con las relaciones para responder con programa y elemento.
      return await this.findRow(material.id)
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo registrar el material de formación')
    }
  }

  async update(id: number, payload: MaterialFormacionPayload) {
    const material = await this.findRow(id)

    const idPrograma = payload.idPrograma ?? material.idProgramaFormacion
    const idElemento = payload.idElemento ?? material.idElemento

    if (payload.idPrograma !== undefined) {
      await this.assertProgramaEnUso(idPrograma)
    }

    if (payload.idElemento !== undefined) {
      await this.assertElementoEnUso(idElemento)
    }

    if (idPrograma !== material.idProgramaFormacion || idElemento !== material.idElemento) {
      await this.assertParLibre(idPrograma, idElemento, material.id)
    }

    material.merge({
      ...(payload.idPrograma !== undefined && { idProgramaFormacion: payload.idPrograma }),
      ...(payload.idElemento !== undefined && { idElemento: payload.idElemento }),
      ...(payload.cantidadBase !== undefined && { cantidadBase: payload.cantidadBase }),
      ...(payload.observaciones !== undefined && { observaciones: payload.observaciones }),
      ...(payload.estado !== undefined && { estado: payload.estado }),
    })

    try {
      await material.save()

      // Se recarga por si cambió el elemento o el programa de la fila.
      return await this.findRow(material.id)
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo actualizar el material de formación')
    }
  }

  /** Baja lógica: la fila se conserva porque las solicitudes la referencian. */
  async remove(id: number) {
    const material = await this.findRow(id)

    if (!material.estado) {
      throw new Exception('El material de formación ya está inactivo', { status: 409 })
    }

    material.merge({ estado: false })
    await material.save()

    return { message: 'Material de formación inhabilitado correctamente' }
  }

  /** Opciones activas para el selector de programas del formulario. */
  async opcionesProgramas() {
    return ProgramaFormacion.query()
      .where('estado_programa', true)
      .orderBy('nombre_programa', 'asc')
  }

  /**
   * Identificación de elementos para el selector del formulario: catálogo
   * global sin stock ni ubicación, porque los materiales de formación no son
   * inventario y pueden apuntar a elementos de cualquier centro.
   */
  async opcionesElementos() {
    return Elemento.query()
      .preload('unidadMedida')
      .preload('clasificacion')
      .orderBy('nombre', 'asc')
  }

  /**
   * Solicitudes de materiales por programa: cada fila pide un material de la
   * lista maestra y se lista con su programa, su elemento y quién la pidió.
   * Es el flujo propio de formación, ajeno a inventario.
   */
  async solicitudes(
    options: { idPrograma?: number; estado?: EstadoSolicitudMaterialFormacion } = {}
  ) {
    const query = SolicitudMaterialFormacion.query()
      .preload('usuario')
      .preload('material', (materialQuery) =>
        materialQuery
          .preload('programa')
          .preload('elemento', (elementoQuery) =>
            elementoQuery.preload('unidadMedida').preload('clasificacion')
          )
      )
      .orderBy('id_solicitud_formacion', 'desc')

    if (options.idPrograma !== undefined) {
      const idPrograma = options.idPrograma
      query.whereHas('material', (materialQuery) =>
        materialQuery.where('id_programa_formacion', idPrograma)
      )
    }

    if (options.estado !== undefined) {
      query.where('estado', options.estado)
    }

    return query
  }

  /** Registra una solicitud de material contra una fila de la lista maestra. */
  async crearSolicitud(scope: AccessScope, payload: SolicitudFormacionPayload) {
    const material = await ListaMaestraMaterial.query()
      .where('id_lista_maestra', payload.idMaterial)
      .preload('programa')
      .preload('elemento')
      .first()

    if (!material) {
      throw new Exception('El material de formación no existe', { status: 422 })
    }

    if (!material.estado) {
      throw new Exception('El material de formación está inhabilitado y no admite solicitudes', {
        status: 422,
      })
    }

    if (material.programa && !material.programa.estado) {
      throw new Exception('El programa de formación está inactivo y no admite solicitudes', {
        status: 422,
      })
    }

    if (material.elemento && !material.elemento.estado) {
      throw new Exception('El elemento del material está inhabilitado y no puede solicitarse', {
        status: 422,
      })
    }

    try {
      const solicitud = await SolicitudMaterialFormacion.create({
        idListaMaestra: payload.idMaterial,
        idUsuario: scope.idUsuario,
        cantidadSolicitada: payload.cantidadSolicitada,
        observaciones: payload.observaciones ?? null,
        estado: 'pendiente',
      })

      return await this.findSolicitud(solicitud.id)
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo registrar la solicitud de material de formación')
    }
  }

  private async findSolicitud(id: number) {
    return SolicitudMaterialFormacion.query()
      .where('id_solicitud_formacion', id)
      .preload('usuario')
      .preload('material', (materialQuery) =>
        materialQuery
          .preload('programa')
          .preload('elemento', (elementoQuery) =>
            elementoQuery.preload('unidadMedida').preload('clasificacion')
          )
      )
      .firstOrFail()
  }

  private async findRow(id: number) {
    return ListaMaestraMaterial.query()
      .where('id_lista_maestra', id)
      .preload('programa')
      .preload('elemento', (elementoQuery) => elementoQuery.preload('unidadMedida'))
      .firstOrFail()
  }

  private async assertProgramaEnUso(idPrograma: number) {
    const programa = await ProgramaFormacion.find(idPrograma)

    if (!programa) {
      throw new Exception('El programa de formación no existe', { status: 422 })
    }

    if (!programa.estado) {
      throw new Exception('El programa de formación está inactivo y no admite materiales', {
        status: 422,
      })
    }
  }

  private async assertElementoEnUso(idElemento: number) {
    const elemento = await Elemento.find(idElemento)

    if (!elemento) {
      throw new Exception('El elemento no existe', { status: 422 })
    }

    if (!elemento.estado) {
      throw new Exception('El elemento está inactivo y no puede agregarse a un programa', {
        status: 422,
      })
    }
  }

  private async assertParLibre(idPrograma: number, idElemento: number, exceptoId?: number) {
    const query = ListaMaestraMaterial.query()
      .where('id_programa_formacion', idPrograma)
      .where('id_elemento', idElemento)

    if (exceptoId !== undefined) {
      query.whereNot('id_lista_maestra', exceptoId)
    }

    const duplicado = await query.first()

    if (duplicado) {
      throw new Exception('Ese elemento ya está en la lista de materiales del programa', {
        status: 409,
      })
    }
  }
}
