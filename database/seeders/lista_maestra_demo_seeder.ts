import { DateTime } from 'luxon'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import db from '@adonisjs/lucid/services/db'
import Ficha from '#models/ficha'
import ListaMaestraMaterial from '#models/lista_maestra_material'
import ProgramaFormacion from '#models/programa_formacion'
import User from '#models/usuario'
import Vigencia from '#models/vigencia'

const INSTRUCTOR_EMAIL = 'instructor@correo.com'

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
  {
    codigoUnspsc: '43211503',
    producto: 'Computador portátil',
    descripcionTecnica: 'Portátil 14 pulgadas, 16 GB RAM',
    unidadMedida: 'Unidad',
    cantidadBase: 15,
    caracter: 'devolutivo' as const,
  },
]

/**
 * Deja lista maestra y ficha en los programas del instructor demo
 * para poder armar un carrito y pedir un producto.
 */
export default class extends BaseSeeder {
  async run() {
    const instructor = await User.query().where('email', INSTRUCTOR_EMAIL).first()
    if (!instructor) return

    const programas = await this.programasDelCentro(instructor.idCformacion)
    if (!programas.length) return

    await this.asignar(instructor.id, programas.map((programa) => programa.id))
    await this.vigenciaActiva()

    for (const programa of programas) {
      await this.asegurarFicha(programa.id, instructor.idCformacion)
      await this.cargarLista(programa.id, instructor.id)
    }
  }

  private async programasDelCentro(idCformacion: number) {
    const conFicha = await ProgramaFormacion.query()
      .where('estado_programa', true)
      .whereHas('fichas', (fichas) => {
        fichas.where('centro_formacion_id', idCformacion).where('estado', true)
      })
      .orderBy('id_programa_formacion', 'asc')
      .limit(8)

    if (conFicha.length) return conFicha

    return ProgramaFormacion.query()
      .where('estado_programa', true)
      .orderBy('id_programa_formacion', 'asc')
      .limit(3)
  }

  private async asignar(usuarioId: number, programaIds: number[]) {
    for (const programaId of programaIds) {
      const existe = await db
        .from('usuario_programa_formacion')
        .where('id_usuario', usuarioId)
        .where('id_programa_formacion', programaId)
        .first()

      if (existe) {
        if (!existe.estado) {
          await db
            .from('usuario_programa_formacion')
            .where('id_usuario', usuarioId)
            .where('id_programa_formacion', programaId)
            .update({ estado: true })
        }
        continue
      }

      await db.table('usuario_programa_formacion').insert({
        id_usuario: usuarioId,
        id_programa_formacion: programaId,
        estado: true,
      })
    }
  }

  private async asegurarFicha(programaId: number, idCformacion: number) {
    const ficha = await Ficha.query()
      .where('programaId', programaId)
      .where('centroFormacionId', idCformacion)
      .where('estado', true)
      .first()

    if (ficha) return ficha

    return Ficha.create({
      programaId,
      centroFormacionId: idCformacion,
      numeroFicha: `DEMO-${programaId}`,
      cupoAprendices: 30,
      estado: true,
      fechaInicio: DateTime.fromISO('2026-01-15'),
      fechaFin: DateTime.fromISO('2027-12-15'),
    })
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
