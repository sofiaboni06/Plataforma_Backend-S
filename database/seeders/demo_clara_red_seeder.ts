import { DateTime } from 'luxon'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import db from '@adonisjs/lucid/services/db'
import Ficha from '#models/ficha'
import LineaTematica from '#models/linea_tematica'
import ListaMaestraMaterial from '#models/lista_maestra_material'
import NivelPrograma from '#models/nivel_programa'
import ProgramaFormacion from '#models/programa_formacion'
import RedConocimiento from '#models/red_conocimiento'
import SolicitudHistorial from '#models/solicitud_historial'
import SolicitudMaterialPrograma from '#models/solicitud_material_programa'
import DetalleSolicitudPrograma from '#models/detalle_solicitud_programa'
import User from '#models/usuario'
import Vigencia from '#models/vigencia'
import NotificacionService from '#services/notificacion_service'
import UsuarioService from '#services/usuario_service'

const INSTRUCTOR_EMAIL = 'instructor@correo.com'
const COORDINADOR_EMAIL = 'coordinador@correo.com'

const MATERIALES = [
  {
    codigoUnspsc: '44111905',
    producto: 'Tablero acrílico de borrado en seco',
    descripcionTecnica: 'Tablero 120 x 60 cm, marco de aluminio',
    unidadMedida: 'Unidad',
    cantidadBase: 2,
    caracter: 'devolutivo' as const,
  },
  {
    codigoUnspsc: '44121701',
    producto: 'Marcadores para tablero',
    descripcionTecnica: 'Caja de 12 marcadores surtidos',
    unidadMedida: 'Caja',
    cantidadBase: 4,
    caracter: 'consumo' as const,
  },
  {
    codigoUnspsc: '14111514',
    producto: 'Resma de papel tamaño carta',
    descripcionTecnica: '75 g, 500 hojas',
    unidadMedida: 'Resma',
    cantidadBase: 10,
    caracter: 'consumo' as const,
  },
]

/**
 * Deja el árbol que debe ver el product owner:
 * Red Informática → Línea Software → ADSO (solicitudes de Clara)
 * Red Deportes → Línea Recreación (existe, pero Clara no la cubre)
 */
export default class extends BaseSeeder {
  async run() {
    const instructor = await User.query().where('email', INSTRUCTOR_EMAIL).first()
    const coordinador = await User.query().where('email', COORDINADOR_EMAIL).first()
    if (!instructor || !coordinador) return

    await this.vigenciaActiva()
    const nivel = await this.nivel()

    const software = await this.rama({
      red: 'Informática',
      linea: 'Software',
      codigo: 'DEMO-228118',
      nombre: 'Análisis y Desarrollo de Software (ADSO)',
      nivelId: nivel.id,
      centroId: instructor.idCformacion,
    })

    const deportes = await this.rama({
      red: 'Deportes',
      linea: 'Recreación',
      codigo: 'DEMO-626101',
      nombre: 'Entrenamiento deportivo',
      nivelId: nivel.id,
      centroId: instructor.idCformacion,
    })

    await this.asignarUsuario(instructor.id, [software.programa.id, deportes.programa.id])
    await new UsuarioService().syncProgramas(coordinador.id, [software.programa.id])

    const fichaAdso1 = await this.ficha(software.programa.id, instructor.idCformacion, 'DEMO-ADSO-1')
    const fichaAdso2 = await this.ficha(software.programa.id, instructor.idCformacion, 'DEMO-ADSO-2')
    const fichaDep = await this.ficha(deportes.programa.id, instructor.idCformacion, 'DEMO-DEP-1')

    await this.cargarLista(software.programa.id, instructor.id)
    await this.cargarLista(deportes.programa.id, instructor.id)

    const materialesAdso = await ListaMaestraMaterial.query()
      .where('programaId', software.programa.id)
      .where('estado', true)
      .orderBy('id', 'asc')

    const materialesDep = await ListaMaestraMaterial.query()
      .where('programaId', deportes.programa.id)
      .where('estado', true)
      .orderBy('id', 'asc')

    await this.enviarPedido({
      instructor,
      programa: software.programa,
      ficha: fichaAdso1,
      items: materialesAdso.slice(0, 2).map((material) => ({
        listaMaestraId: material.id,
        cantidadSolicitada: material.cantidadBase,
      })),
    })

    await this.enviarPedido({
      instructor,
      programa: software.programa,
      ficha: fichaAdso2,
      items: materialesAdso.slice(2, 3).map((material) => ({
        listaMaestraId: material.id,
        cantidadSolicitada: material.cantidadBase,
      })),
    })

    await this.enviarPedido({
      instructor,
      programa: deportes.programa,
      ficha: fichaDep,
      items: materialesDep.slice(0, 1).map((material) => ({
        listaMaestraId: material.id,
        cantidadSolicitada: material.cantidadBase,
      })),
    })

    await this.limpiarAvisosAjenos(coordinador.id)
  }

  private async limpiarAvisosAjenos(coordinadorId: number) {
    const adsoIds = await db
      .from('solicitud_material_programa as s')
      .join('programa_formacion as pf', 'pf.id_programa_formacion', 's.id_programa_formacion')
      .where('pf.codigo_programa', 'DEMO-228118')
      .select('s.id_solicitud_programa')

    const ids = adsoIds.map((row) => Number(row.id_solicitud_programa))
    if (!ids.length) return

    await db
      .from('notificacion')
      .where('id_usuario', coordinadorId)
      .where('recurso', 'solicitud_programa')
      .whereNotIn('id_referencia', ids)
      .delete()
  }

  private async rama(input: {
    red: string
    linea: string
    codigo: string
    nombre: string
    nivelId: number
    centroId: number
  }) {
    const linea = await this.linea(input.linea)
    const red = await this.red(input.red, linea.id)
    const programa = await this.programa({
      idRedConocimiento: red.id,
      idLineaTematica: linea.id,
      idNivelPrograma: input.nivelId,
      codigo: input.codigo,
      nombre: input.nombre,
    })
    await this.ficha(programa.id, input.centroId, `DEMO-${input.codigo}`)
    return { red, linea, programa }
  }

  private async red(nombre: string, lineaId: number) {
    let red = await RedConocimiento.query().whereILike('red_conocimiento', nombre).first()
    if (!red) {
      red = await RedConocimiento.create({ nombre, estado: true })
    } else if (!red.estado) {
      red.estado = true
      await red.save()
    }

    const pivot = await db
      .from('redes_conocimiento_lineas_tematicas')
      .where('red_conocimiento_id', red.id)
      .where('linea_tematica_id', lineaId)
      .first()
    if (!pivot) {
      await red.related('lineasTematicas').attach([lineaId])
    }
    return red
  }

  private async linea(nombre: string) {
    let linea = await LineaTematica.query().whereILike('linea_tematica', nombre).first()
    if (!linea) {
      linea = await LineaTematica.create({ nombre, estado: true })
      return linea
    }
    if (!linea.estado) {
      linea.estado = true
      await linea.save()
    }
    return linea
  }

  private async nivel() {
    const existente = await NivelPrograma.query().orderBy('id', 'asc').first()
    if (existente) return existente
    return NivelPrograma.create({ nombre: 'Tecnólogo' })
  }

  private async programa(input: {
    idRedConocimiento: number
    idLineaTematica: number
    idNivelPrograma: number
    codigo: string
    nombre: string
  }) {
    let programa = await ProgramaFormacion.query().where('codigo', input.codigo).first()
    if (!programa) {
      programa = await ProgramaFormacion.create({
        ...input,
        version: '1',
        cupoBaseAprendices: 30,
        estado: true,
      })
      return programa
    }

    programa.merge({
      idRedConocimiento: input.idRedConocimiento,
      idLineaTematica: input.idLineaTematica,
      nombre: input.nombre,
      estado: true,
    })
    await programa.save()
    return programa
  }

  private async ficha(programaId: number, centroId: number, numeroFicha: string) {
    const existente = await Ficha.query().where('numeroFicha', numeroFicha).first()
    if (existente) {
      existente.programaId = programaId
      existente.centroFormacionId = centroId
      existente.estado = true
      await existente.save()
      return existente
    }

    return Ficha.create({
      programaId,
      centroFormacionId: centroId,
      numeroFicha,
      cupoAprendices: 30,
      estado: true,
      fechaInicio: DateTime.fromISO('2026-01-15'),
      fechaFin: DateTime.fromISO('2027-12-15'),
    })
  }

  private async asignarUsuario(usuarioId: number, programaIds: number[]) {
    for (const programaId of programaIds) {
      const existe = await db
        .from('usuario_programa_formacion')
        .where('id_usuario', usuarioId)
        .where('id_programa_formacion', programaId)
        .first()

      if (existe) {
        await db
          .from('usuario_programa_formacion')
          .where('id_usuario', usuarioId)
          .where('id_programa_formacion', programaId)
          .update({ estado: true })
        continue
      }

      await db.table('usuario_programa_formacion').insert({
        id_usuario: usuarioId,
        id_programa_formacion: programaId,
        estado: true,
      })
    }
  }

  private async cargarLista(programaId: number, usuarioId: number) {
    for (const material of MATERIALES) {
      const existing = await ListaMaestraMaterial.query()
        .where('programaId', programaId)
        .where('codigoUnspsc', material.codigoUnspsc)
        .first()

      if (existing) {
        existing.merge({
          producto: material.producto,
          descripcionTecnica: material.descripcionTecnica,
          unidadMedida: material.unidadMedida,
          cantidadBase: material.cantidadBase,
          caracter: material.caracter,
          estado: true,
        })
        await existing.save()
        continue
      }

      await ListaMaestraMaterial.create({
        programaId,
        ...material,
        observaciones: 'Carga demo para solicitudes de formación',
        usuarioRegistroId: usuarioId,
        estado: true,
      })
    }
  }

  private async enviarPedido(input: {
    instructor: User
    programa: ProgramaFormacion
    ficha: Ficha
    items: Array<{ listaMaestraId: number; cantidadSolicitada: number }>
  }) {
    if (!input.items.length) return

    let solicitud = await SolicitudMaterialPrograma.query()
      .where('instructorId', input.instructor.id)
      .where('fichaId', input.ficha.id)
      .where('vigencia', 2026)
      .whereNot('estado', 'anulada')
      .first()

    if (!solicitud) {
      solicitud = await SolicitudMaterialPrograma.create({
        instructorId: input.instructor.id,
        programaId: input.programa.id,
        fichaId: input.ficha.id,
        vigencia: 2026,
        estado: 'borrador',
        observacion: `Pedido demo ${input.programa.nombre}`,
      })
      await this.ponerItems(solicitud, input.items)
      await SolicitudHistorial.create({
        solicitudId: solicitud.id,
        estadoAnterior: null,
        estadoNuevo: 'borrador',
        usuarioId: input.instructor.id,
        comentario: null,
      })
    }

    if (solicitud.estado === 'borrador') {
      solicitud.estado = 'enviada'
      solicitud.fechaEnvio = DateTime.now()
      await solicitud.save()
      await SolicitudHistorial.create({
        solicitudId: solicitud.id,
        estadoAnterior: 'borrador',
        estadoNuevo: 'enviada',
        usuarioId: input.instructor.id,
        comentario: null,
      })
    }

    await this.avisar(solicitud.id, input)
  }

  private async ponerItems(
    solicitud: SolicitudMaterialPrograma,
    items: Array<{ listaMaestraId: number; cantidadSolicitada: number }>
  ) {
    await DetalleSolicitudPrograma.query().where('solicitudId', solicitud.id).delete()
    for (const item of items) {
      const material = await ListaMaestraMaterial.findOrFail(item.listaMaestraId)
      await DetalleSolicitudPrograma.create({
        solicitudId: solicitud.id,
        programaId: solicitud.programaId,
        listaMaestraId: material.id,
        cantidadMaestraReferencia: material.cantidadBase,
        cantidadSolicitada: item.cantidadSolicitada,
        estado: 'pendiente',
      })
    }
  }

  private async avisar(
    solicitudId: number,
    input: {
      instructor: User
      programa: ProgramaFormacion
      ficha: Ficha
      items: Array<{ listaMaestraId: number; cantidadSolicitada: number }>
    }
  ) {
    await input.programa.load('redConocimiento')
    await input.programa.load('lineaTematica')

    const ya = await db
      .from('notificacion')
      .where('id_usuario', (await User.query().where('email', COORDINADOR_EMAIL).first())?.id ?? 0)
      .where('id_referencia', solicitudId)
      .where('recurso', 'solicitud_programa')
      .first()
    if (ya) return

    const materiales = await ListaMaestraMaterial.query().whereIn(
      'id',
      input.items.map((item) => item.listaMaestraId)
    )
    const porId = new Map(materiales.map((material) => [material.id, material]))

    const trx = await db.transaction()
    try {
      const avisos = await new NotificacionService().pedidoFormacion(trx, {
        solicitudId,
        instructorId: input.instructor.id,
        programaId: input.programa.id,
        programa: input.programa.nombre,
        ficha: input.ficha.numeroFicha,
        red: input.programa.redConocimiento?.nombre ?? null,
        linea: input.programa.lineaTematica?.nombre ?? null,
        items: input.items.map((item) => ({
          producto: porId.get(item.listaMaestraId)?.producto ?? `material ${item.listaMaestraId}`,
          cantidad: item.cantidadSolicitada,
        })),
      })
      await trx.commit()
      new NotificacionService().emitir(avisos)
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  private async vigenciaActiva() {
    await Vigencia.query().where('activa', true).whereNot('anio', 2026).update({ activa: false })
    const vigencia = await Vigencia.find(2026)
    if (vigencia) {
      vigencia.activa = true
      vigencia.fechaApertura = DateTime.fromISO('2026-01-01')
      vigencia.fechaCierre = DateTime.fromISO('2026-12-31')
      await vigencia.save()
      return
    }
    await Vigencia.create({
      anio: 2026,
      activa: true,
      fechaApertura: DateTime.fromISO('2026-01-01'),
      fechaCierre: DateTime.fromISO('2026-12-31'),
    })
  }
}
