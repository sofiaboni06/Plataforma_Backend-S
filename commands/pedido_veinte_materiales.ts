import { DateTime } from 'luxon'
import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import db from '@adonisjs/lucid/services/db'

const INSTRUCTOR_EMAIL = 'instructor@correo.com'
const COORDINADOR_EMAIL = 'coordinador@correo.com'
const PROGRAMA_CODIGO = 'DEMO-228118'
const FICHA = 'DEMO-ADSO-20'

const MATERIALES = [
  'Computador portátil 14"',
  'Mouse óptico USB',
  'Teclado USB en español',
  'Monitor LED 24 pulgadas',
  'Videobeam 3500 lúmenes',
  'Extensión eléctrica 5 m',
  'Switch de red 8 puertos',
  'Cable HDMI 2 m',
  'Audífonos con micrófono',
  'Cámara web Full HD',
  'Router WiFi dual band',
  'Impresora láser monocromo',
  'Escáner de documentos',
  'Tablet 10 pulgadas',
  'Parlante Bluetooth de aula',
  'Micrófono de mesa',
  'Puntero láser presentador',
  'Trípode para cámara',
  'UPS 600 VA',
  'Disco duro externo 1 TB',
]

/**
 * Pedido demo del instructor con 20 materiales de formación, listo para
 * que coordinación lo apruebe y se vea el aviso en la campana.
 */
export default class PedidoVeinteMateriales extends BaseCommand {
  static commandName = 'pedidos:veinte-materiales'
  static description = 'Crea y envía un pedido de 20 materiales de formación como instructor'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    const { default: User } = await import('#models/usuario')
    const { default: Ficha } = await import('#models/ficha')
    const { default: ListaMaestraMaterial } = await import('#models/lista_maestra_material')
    const { default: ProgramaFormacion } = await import('#models/programa_formacion')
    const { default: SolicitudMaterialPrograma } = await import('#models/solicitud_material_programa')
    const { default: SolicitudProgramaService } = await import('#services/solicitud_programa_service')
    const { resolveScope } = await import('#services/access_control')

    const instructor = await User.query().where('email', INSTRUCTOR_EMAIL).first()
    const coordinador = await User.query().where('email', COORDINADOR_EMAIL).first()
    if (!instructor || !coordinador) {
      this.logger.error('Faltan el instructor o el coordinador demo')
      this.exitCode = 1
      return
    }

    const programa = await ProgramaFormacion.query().where('codigo', PROGRAMA_CODIGO).first()
    if (!programa) {
      this.logger.error(`No está el programa ${PROGRAMA_CODIGO}. Corre el seeder de Clara.`)
      this.exitCode = 1
      return
    }

    await this.asignar(instructor.id, programa.id)
    await this.asignar(coordinador.id, programa.id)

    let ficha = await Ficha.query().where('numeroFicha', FICHA).first()
    if (!ficha) {
      ficha = await Ficha.create({
        programaId: programa.id,
        centroFormacionId: instructor.idCformacion,
        numeroFicha: FICHA,
        cupoAprendices: 30,
        estado: true,
        fechaInicio: DateTime.fromISO('2026-01-15'),
        fechaFin: DateTime.fromISO('2027-12-15'),
      })
    } else {
      ficha.merge({
        programaId: programa.id,
        centroFormacionId: instructor.idCformacion,
        estado: true,
      })
      await ficha.save()
    }

    const items: Array<{ listaMaestraId: number; cantidadSolicitada: number }> = []
    for (const [index, producto] of MATERIALES.entries()) {
      const codigo = `D20-${String(index + 1).padStart(2, '0')}`
      let material = await ListaMaestraMaterial.query()
        .where('programaId', programa.id)
        .where('codigoUnspsc', codigo)
        .first()

      if (!material) {
        material = await ListaMaestraMaterial.create({
          programaId: programa.id,
          codigoUnspsc: codigo,
          producto,
          descripcionTecnica: `${producto} para el aula de formación`,
          unidadMedida: 'Unidad',
          cantidadBase: 1,
          caracter: 'devolutivo',
          observaciones: 'Pedido demo de 20 materiales',
          usuarioRegistroId: instructor.id,
          estado: true,
        })
      } else {
        material.merge({
          producto,
          caracter: 'devolutivo',
          estado: true,
          valorUnitario: null,
        })
        await material.save()
      }

      items.push({ listaMaestraId: material.id, cantidadSolicitada: 2 })
    }

    const vigente = await SolicitudMaterialPrograma.query()
      .where('instructorId', instructor.id)
      .where('fichaId', ficha.id)
      .whereNot('estado', 'anulada')
      .first()

    const service = new SolicitudProgramaService()
    const instructorScope = await resolveScope(instructor)

    if (vigente) {
      await service.anular(instructorScope, vigente.id)
      this.logger.info(`Se anuló la solicitud ${vigente.id} de la ficha ${FICHA}`)
    }

    const creada = await service.store(instructorScope, {
      programaId: programa.id,
      fichaId: ficha.id,
      observacion: 'Pedido demo de 20 materiales para ver las notificaciones al aprobar',
      items,
    })
    const enviada = await service.enviar(instructorScope, creada.id)

    this.logger.info(
      `Solicitud ${enviada.id} enviada: ${enviada.detalles?.length ?? 0} materiales, ficha ${FICHA}, estado ${enviada.estado}`
    )
  }

  private async asignar(usuarioId: number, programaId: number) {
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
      return
    }

    await db.table('usuario_programa_formacion').insert({
      id_usuario: usuarioId,
      id_programa_formacion: programaId,
      estado: true,
    })
  }
}
