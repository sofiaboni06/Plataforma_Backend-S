import { BaseSeeder } from '@adonisjs/lucid/seeders'
import db from '@adonisjs/lucid/services/db'
import PresupuestoAsignacion from '#models/presupuesto_asignacion'
import PresupuestoCoordinador from '#models/presupuesto_coordinador'
import User from '#models/usuario'
import Vigencia from '#models/vigencia'
import VigenciaEspecial from '#models/vigencia_especial'

const COORDINADOR_EMAIL = 'coordinador@correo.com'
const MONTO_CENTRO = 80_000_000
const MONTO_COORDINADOR = 25_000_000
const MONTO_ESPECIAL = 5_000_000

/**
 * Deja a Clara con monto de la vigencia y de la vigencia especial.
 * Sin esto el coordinador abre presupuesto y ve $0.
 */
export default class extends BaseSeeder {
  async run() {
    const coordinador = await User.query().where('email', COORDINADOR_EMAIL).first()
    if (!coordinador) return

    const vigencia =
      (await Vigencia.query().where('activa', true).first()) ??
      (await Vigencia.query().orderBy('anio', 'desc').first())
    const anio = vigencia?.anio ?? new Date().getFullYear()
    if (!vigencia) {
      await Vigencia.create({ anio, activa: true, fechaApertura: null, fechaCierre: null })
    }

    await this.asignarPresupuesto(coordinador, anio)
    await this.asignarEspecial(coordinador, anio)
  }

  private async asignarPresupuesto(coordinador: User, anio: number) {
    let presupuesto = await PresupuestoCoordinador.query()
      .where('anio', anio)
      .where('idCformacion', coordinador.idCformacion)
      .first()

    if (!presupuesto) {
      presupuesto = await PresupuestoCoordinador.create({
        anio,
        idCformacion: coordinador.idCformacion,
        monto: MONTO_CENTRO,
      })
    } else if (Number(presupuesto.monto) < MONTO_COORDINADOR) {
      presupuesto.monto = MONTO_CENTRO
      await presupuesto.save()
    }

    const actual = await PresupuestoAsignacion.query()
      .where('presupuestoId', presupuesto.id)
      .where('idUsuario', coordinador.id)
      .first()

    if (actual && Number(actual.monto) > 0) return

    const otras = await PresupuestoAsignacion.query()
      .where('presupuestoId', presupuesto.id)
      .whereNot('idUsuario', coordinador.id)
    const usado = otras.reduce((suma, fila) => suma + Number(fila.monto), 0)
    const falta = MONTO_COORDINADOR
    if (Number(presupuesto.monto) - usado < falta) {
      presupuesto.monto = usado + falta
      await presupuesto.save()
    }

    if (actual) {
      actual.monto = falta
      await actual.save()
      return
    }

    await PresupuestoAsignacion.create({
      presupuestoId: presupuesto.id,
      idUsuario: coordinador.id,
      monto: falta,
    })
  }

  private async asignarEspecial(coordinador: User, anio: number) {
    let especial = await VigenciaEspecial.query()
      .where('anio', anio)
      .where('idCformacion', coordinador.idCformacion)
      .orderBy('id', 'desc')
      .first()

    if (!especial) {
      especial = await VigenciaEspecial.create({
        anio,
        idCformacion: coordinador.idCformacion,
        nombre: 'Programas tardíos',
        monto: MONTO_ESPECIAL,
        activa: true,
      })
    } else if (Number(especial.monto) <= 0) {
      especial.monto = MONTO_ESPECIAL
      especial.activa = true
      await especial.save()
    }

    const actual = await db
      .from('vigencia_especial_asignacion')
      .where('id_vigencia_especial', especial.id)
      .where('id_usuario', coordinador.id)
      .first()

    if (actual && Number(actual.monto) > 0) return

    const otros = await db
      .from('vigencia_especial_asignacion')
      .where('id_vigencia_especial', especial.id)
      .whereNot('id_usuario', coordinador.id)
      .sum({ total: 'monto' })
      .first()
    const queda = Number(especial.monto) - Number(otros?.total ?? 0)

    if (queda <= 0) {
      especial = await VigenciaEspecial.create({
        anio,
        idCformacion: coordinador.idCformacion,
        nombre: 'Programas tardíos',
        monto: MONTO_ESPECIAL,
        activa: true,
      })
    } else if (!especial.activa) {
      especial.activa = true
      await especial.save()
    }

    const monto = Math.min(Number(especial.monto), Math.max(queda > 0 ? queda : Number(especial.monto), 0))
    if (monto <= 0) return

    if (actual && queda > 0) {
      await db
        .from('vigencia_especial_asignacion')
        .where('id_asignacion_especial', actual.id_asignacion_especial)
        .update({ monto })
      return
    }

    await db.table('vigencia_especial_asignacion').insert({
      id_vigencia_especial: especial.id,
      id_usuario: coordinador.id,
      monto,
    })
  }
}
