import { BaseSeeder } from '@adonisjs/lucid/seeders'
import db from '@adonisjs/lucid/services/db'
import Modulo from '#models/modulo'
import Perfil from '#models/perfil'
import ProgramaFormacion from '#models/programa_formacion'
import User from '#models/usuario'
import RoleService from '#services/role_service'
import PermissionSeeder from '#database/seeders/permission_seeder'

export const COORDINADOR_PROFILE_NAME = 'Coordinador académico'

export const COORDINADOR_PERMISSIONS = [
  'programa_formacion.ver',
  'ficha.ver',
  'red_conocimiento.ver',
  'linea_tematica.ver',
  'lista_maestra.ver',
  'lista_maestra.crear',
  'lista_maestra.editar',
  'vigencia.ver',
  'vigencia.crear',
  'vigencia.editar',
  'solicitud_programa.ver',
  'solicitud_programa.editar',
] as const

const DEMO_USER = {
  nombres: 'Clara',
  apellidos: 'Coordinadora',
  tipoDocumento: 'CC',
  numeroDocumento: '1001001006',
  email: 'coordinador@correo.com',
  password: '123456',
  idCformacion: 1,
}

export default class extends BaseSeeder {
  async run() {
    await new PermissionSeeder(this.client).run()

    let perfil = await Perfil.query().where('nombre', COORDINADOR_PROFILE_NAME).first()
    const descripcion =
      'Aprueba solicitudes de formación, reparte el presupuesto de la vigencia y arma los lotes'

    if (!perfil) {
      perfil = await Perfil.create({
        nombre: COORDINADOR_PROFILE_NAME,
        descripcion,
        estado: true,
      })
    } else if (perfil.descripcion !== descripcion) {
      perfil.descripcion = descripcion
      await perfil.save()
    }

    const formacion = await Modulo.query().where('nombre', 'Materiales de Formación').firstOrFail()
    const roles = new RoleService()
    await roles.assignModules(perfil.id, [formacion.id])
    await roles.assignPermissions(perfil.id, [...COORDINADOR_PERMISSIONS])

    const user = await User.query().where('email', DEMO_USER.email).first()
    const coordinador =
      user ?? (await User.create({ ...DEMO_USER, idPerfil: perfil.id, estado: true }))
    if (user && user.idPerfil !== perfil.id) {
      user.idPerfil = perfil.id
      await user.save()
    }
    await this.asignarRedes(coordinador)
  }

  /**
   * Cubre la misma red/línea de los programas del instructor demo (o los que
   * tienen ficha en su centro), para que le lleguen esas solicitudes y no las
   * de otra red.
   */
  private async asignarRedes(coordinador: User) {
    const instructor = await User.query().where('email', 'instructor@correo.com').first()
    let programas: ProgramaFormacion[] = []

    const adso = await ProgramaFormacion.query()
      .where('estado_programa', true)
      .where((query) => {
        query.where('codigo', 'DEMO-228118').orWhereILike('nombre_programa', '%ADSO%')
      })
      .first()
    if (adso) programas = [adso]

    if (!programas.length && instructor) {
      await instructor.load('programasFormacion', (query) => query.wherePivot('estado', true))
      programas = instructor.programasFormacion
    }

    if (!programas.length) {
      programas = await ProgramaFormacion.query()
        .where('estado_programa', true)
        .whereHas('fichas', (fichas) => {
          fichas.where('centro_formacion_id', coordinador.idCformacion).where('estado', true)
        })
        .limit(8)
    }

    const vistos = new Set<string>()
    for (const programa of programas) {
      const clave = `${programa.idRedConocimiento}:${programa.idLineaTematica}`
      if (vistos.has(clave)) continue
      vistos.add(clave)

      const existe = await db
        .from('usuario_red_conocimiento')
        .where('id_usuario', coordinador.id)
        .where('id_red_conocimiento', programa.idRedConocimiento)
        .where('id_linea_tematica', programa.idLineaTematica)
        .first()

      if (existe) {
        await db
          .from('usuario_red_conocimiento')
          .where('id_usuario', coordinador.id)
          .where('id_red_conocimiento', programa.idRedConocimiento)
          .where('id_linea_tematica', programa.idLineaTematica)
          .update({ estado: true })
        continue
      }

      try {
        await db.table('usuario_red_conocimiento').insert({
          id_usuario: coordinador.id,
          id_red_conocimiento: programa.idRedConocimiento,
          id_linea_tematica: programa.idLineaTematica,
          estado: true,
        })
      } catch {
        // El dump exige perfil coordinador; si ya está asignado, seguimos.
      }
    }
  }
}
