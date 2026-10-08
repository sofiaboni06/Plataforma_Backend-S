import { Exception } from '@adonisjs/core/exceptions'
import db from '@adonisjs/lucid/services/db'
import transmit from '@adonisjs/transmit/services/main'
import { DateTime } from 'luxon'
import { ADMIN_PROFILE_NAME } from '#services/access_control'
import AlertaService, { type ResultadoAlerta } from '#services/alerta_service'
import { rethrowDatabaseError } from '#services/database_error'
import type Elemento from '#models/elemento'
import Notificacion from '#models/notificacion'
import type { RecursoNotificacion, TipoNotificacion } from '#models/notificacion'
import User from '#models/usuario'
import type { EstadoElementoEquipo } from '#models/solicitud_equipo'
import { notificacionJson } from '#transformers/notificacion_transformer'
import type { PermissionCode } from '#data/permission_catalog'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

type Borrador = {
  idUsuario: number
  tipo: TipoNotificacion
  titulo: string
  mensaje: string
  recurso: RecursoNotificacion | null
  idReferencia: number | null
}

const ESTADO_EQUIPO: Record<EstadoElementoEquipo, string> = {
  bueno: 'bueno',
  danado: 'dañado',
  perdido: 'perdido',
  en_reparacion: 'en reparación',
}

function mensajeEntrega(input: { cantidad: number; pendiente: number; elemento: string }) {
  const resto = input.pendiente > 0 ? ` Quedan ${input.pendiente} pendientes.` : ''
  return `Te entregaron ${input.cantidad} de ${input.elemento}.${resto}`
}

export default class NotificacionService {
  private alertas = new AlertaService()

  async list(idUsuario: number, options: { page: number; perPage: number; leida?: boolean }) {
    const query = Notificacion.query()
      .where('id_usuario', idUsuario)
      .orderBy('fecha', 'desc')
      .orderBy('id_notificacion', 'desc')

    if (options.leida !== undefined) {
      query.where('leida', options.leida)
    }

    return query.paginate(options.page, options.perPage)
  }

  async marcar(idUsuario: number, id: number, leida: boolean) {
    const row = await Notificacion.query()
      .where('id_notificacion', id)
      .where('id_usuario', idUsuario)
      .first()

    if (!row) {
      throw new Exception('La notificación indicada no existe', {
        status: 404,
        code: 'E_NOT_FOUND',
      })
    }

    row.leida = leida

    try {
      await row.save()
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo actualizar la notificación')
    }

    return row
  }

  async marcarTodas(idUsuario: number, leida: boolean) {
    try {
      const total = await Notificacion.query()
        .where('id_usuario', idUsuario)
        .whereNot('leida', leida)
        .update({ leida })

      return Number(total)
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudieron actualizar las notificaciones')
    }
  }

  /**
   * Abre, actualiza o cierra la alerta del elemento. Con transacción propia
   * también deja el aviso en la bandeja y lo empuja. Dentro de una
   * transacción ajena solo escribe y devuelve las filas para emitir después
   * del commit.
   */
  async aplicarStock(elemento: Elemento, avisar: boolean, trx?: TransactionClientContract) {
    if (trx) {
      return this.stockEn(elemento, avisar, trx)
    }

    const local = await db.transaction()

    try {
      const filas = await this.stockEn(elemento, avisar, local)
      await local.commit()
      this.emitir(filas)
      return filas
    } catch (error) {
      await local.rollback()
      throw error
    }
  }

  async pedidoMaterial(
    trx: TransactionClientContract,
    input: {
      idSolicitud: number
      idElemento: number
      idSolicitante: number
      cantidad: number
      elemento: string
      obra: string
    }
  ) {
    return this.paraEncargados(trx, {
      idElemento: input.idElemento,
      permiso: 'solicitud_material.entregar',
      excluir: input.idSolicitante,
      tipo: 'solicitud_material',
      titulo: 'Pedido de material',
      mensaje: `${await this.nombreDe(input.idSolicitante, trx)} pidió ${input.cantidad} de ${input.elemento} para ${input.obra}.`,
      recurso: 'solicitud_material',
      idReferencia: input.idSolicitud,
    })
  }

  async pedidoEquipo(
    trx: TransactionClientContract,
    input: {
      idSolicitud: number
      idElemento: number
      idSolicitante: number
      cantidad: number
      elemento: string
      obra: string
    }
  ) {
    return this.paraEncargados(trx, {
      idElemento: input.idElemento,
      permiso: 'solicitud_equipo.entregar',
      excluir: input.idSolicitante,
      tipo: 'solicitud_equipo',
      titulo: 'Pedido de equipo',
      mensaje: `${await this.nombreDe(input.idSolicitante, trx)} pidió ${input.cantidad} de ${input.elemento} para ${input.obra}.`,
      recurso: 'solicitud_equipo',
      idReferencia: input.idSolicitud,
    })
  }

  /**
   * Una solicitud con varias filas manda un solo aviso por persona y por tipo,
   * con las filas que salen de las bodegas que esa persona atiende.
   */
  async pedidoVarios(
    trx: TransactionClientContract,
    input: {
      codigoSolicitud: string
      idSolicitante: number
      obra: string
      lineas: {
        tipo: 'material' | 'equipo'
        idSolicitud: number
        idElemento: number
        cantidad: number
        elemento: string
      }[]
    }
  ) {
    const grupos = new Map<
      string,
      { idUsuario: number; tipo: 'material' | 'equipo'; lineas: typeof input.lineas }
    >()
    const encargados = new Map<string, number[]>()

    for (const linea of input.lineas) {
      const lugar = await this.lugar(linea.idElemento, trx)

      if (!lugar) {
        continue
      }

      const permiso: PermissionCode =
        linea.tipo === 'material' ? 'solicitud_material.entregar' : 'solicitud_equipo.entregar'
      const clave = `${lugar.idBodega}:${permiso}`
      let ids = encargados.get(clave)

      if (!ids) {
        ids = await this.destinatarios(trx, {
          idCformacion: lugar.idCformacion,
          idBodega: lugar.idBodega,
          permiso,
          excluir: input.idSolicitante,
        })
        encargados.set(clave, ids)
      }

      for (const idUsuario of ids) {
        const grupo = grupos.get(`${idUsuario}:${linea.tipo}`) ?? {
          idUsuario,
          tipo: linea.tipo,
          lineas: [],
        }
        grupo.lineas.push(linea)
        grupos.set(`${idUsuario}:${linea.tipo}`, grupo)
      }
    }

    if (!grupos.size) {
      return []
    }

    const solicitante = await this.nombreDe(input.idSolicitante, trx)

    return this.crear(
      trx,
      [...grupos.values()].map((grupo): Borrador => {
        const material = grupo.tipo === 'material'
        const detalle = grupo.lineas.map((row) => `${row.cantidad} de ${row.elemento}`).join(', ')

        return {
          idUsuario: grupo.idUsuario,
          tipo: material ? 'solicitud_material' : 'solicitud_equipo',
          titulo: `${material ? 'Pedido de material' : 'Pedido de equipo'} ${input.codigoSolicitud}`,
          mensaje: `${solicitante} pidió ${detalle} para ${input.obra}.`,
          recurso: material ? 'solicitud_material' : 'solicitud_equipo',
          idReferencia: grupo.lineas[0].idSolicitud,
        }
      })
    )
  }

  async entregaMaterial(
    trx: TransactionClientContract,
    input: {
      idSolicitud: number
      idDestinatario: number
      idQuienEntrega: number
      cantidad: number
      pendiente: number
      elemento: string
    }
  ) {
    return this.paraUno(trx, input.idDestinatario, input.idQuienEntrega, {
      tipo: 'entrega_material',
      titulo: input.pendiente > 0 ? 'Material entregado en parte' : 'Material entregado',
      mensaje: mensajeEntrega(input),
      recurso: 'solicitud_material',
      idReferencia: input.idSolicitud,
    })
  }

  async entregaEquipo(
    trx: TransactionClientContract,
    input: {
      idSolicitud: number
      idDestinatario: number
      idQuienEntrega: number
      cantidad: number
      pendiente: number
      elemento: string
    }
  ) {
    return this.paraUno(trx, input.idDestinatario, input.idQuienEntrega, {
      tipo: 'entrega_equipo',
      titulo: input.pendiente > 0 ? 'Equipo entregado en parte' : 'Equipo entregado',
      mensaje: mensajeEntrega(input),
      recurso: 'solicitud_equipo',
      idReferencia: input.idSolicitud,
    })
  }

  async devolucionEquipo(
    trx: TransactionClientContract,
    input: {
      idSolicitud: number
      idDestinatario: number
      idQuienRecibe: number
      elemento: string
      lineas: { cantidad: number; estadoElemento: EstadoElementoEquipo }[]
      afuera: number
    }
  ) {
    const total = input.lineas.reduce((suma, linea) => suma + linea.cantidad, 0)
    const detalle = input.lineas
      .map((linea) => `${linea.cantidad} ${ESTADO_EQUIPO[linea.estadoElemento]}`)
      .join(', ')
    const resto = input.afuera > 0 ? ` Quedan ${input.afuera} por devolver.` : ''

    return this.paraUno(trx, input.idDestinatario, input.idQuienRecibe, {
      tipo: 'devolucion_equipo',
      titulo: 'Equipo devuelto',
      mensaje: `Bodega recibió ${total} de ${input.elemento}: ${detalle}.${resto}`,
      recurso: 'solicitud_equipo',
      idReferencia: input.idSolicitud,
    })
  }

  /**
   * El instructor no pidió desde la app: bodega la registró a su nombre en el
   * mostrador y le entregó lo que había. Un solo aviso con lo que se llevó y
   * lo que quedó pendiente.
   */
  async registroEnBodega(
    trx: TransactionClientContract,
    input: {
      codigoSolicitud: string
      tipo: 'material' | 'equipo'
      idDestinatario: number
      idQuienRegistra: number
      obra: string
      lineas: { idSolicitud: number; elemento: string; entregada: number; pendiente: number }[]
    }
  ) {
    const material = input.tipo === 'material'
    const quien = await this.nombreDe(input.idQuienRegistra, trx)
    const entregadas = input.lineas
      .filter((row) => row.entregada > 0)
      .map((row) => `${row.entregada} de ${row.elemento}`)
    const pendientes = input.lineas
      .filter((row) => row.pendiente > 0)
      .map((row) => `${row.pendiente} de ${row.elemento}`)
    const partes = [
      `${quien} registró a tu nombre la solicitud ${input.codigoSolicitud} para ${input.obra}.`,
      entregadas.length
        ? `Te entregaron ${entregadas.join(', ')}.`
        : 'Todavía no había existencia para entregar.',
    ]

    if (pendientes.length) {
      partes.push(`Quedan pendientes ${pendientes.join(', ')}.`)
    }

    return this.paraUno(trx, input.idDestinatario, input.idQuienRegistra, {
      tipo: material ? 'entrega_material' : 'entrega_equipo',
      titulo: `Solicitud ${input.codigoSolicitud} registrada en bodega`,
      mensaje: partes.join(' '),
      recurso: material ? 'solicitud_material' : 'solicitud_equipo',
      idReferencia: input.lineas[0]?.idSolicitud ?? null,
    })
  }

  emitir(filas: Notificacion[]) {
    for (const fila of filas) {
      transmit.broadcast(`notificaciones/${fila.idUsuario}`, notificacionJson(fila))
    }
  }

  private async stockEn(elemento: Elemento, avisar: boolean, trx: TransactionClientContract) {
    const resultado = await this.alertas.sincronizar(elemento, trx)

    if (!avisar || (resultado.evento !== 'abierta' && resultado.evento !== 'empeoro')) {
      return []
    }

    return this.desdeAlerta(trx, elemento, resultado)
  }

  private async desdeAlerta(
    trx: TransactionClientContract,
    elemento: Elemento,
    resultado: ResultadoAlerta
  ) {
    if (!resultado.alerta) {
      return []
    }

    const tipo = resultado.alerta.tipo
    const cantidad = Number(elemento.cantidad)
    const minima = Number(elemento.cantidadMinima)
    const nombre = elemento.nombre

    return this.paraEncargados(trx, {
      idElemento: elemento.id,
      permiso: 'alerta.ver',
      tipo,
      titulo: tipo === 'agotado' ? `${nombre} agotado` : `${nombre} por agotarse`,
      mensaje:
        tipo === 'agotado'
          ? `Ya no queda existencia de ${nombre}.`
          : `Quedan ${cantidad} de ${nombre}. El mínimo es ${minima}.`,
      recurso: 'alerta',
      idReferencia: resultado.alerta.id,
    })
  }

  private async paraUno(
    trx: TransactionClientContract,
    idDestinatario: number,
    excluir: number,
    aviso: Omit<Borrador, 'idUsuario'>
  ) {
    if (idDestinatario === excluir) {
      return []
    }

    const usuario = await User.query({ client: trx })
      .where('id', idDestinatario)
      .where('estado', true)
      .first()

    if (!usuario) {
      return []
    }

    return this.crear(trx, [{ ...aviso, idUsuario: usuario.id }])
  }

  private async paraEncargados(
    trx: TransactionClientContract,
    input: Omit<Borrador, 'idUsuario'> & {
      idElemento: number
      permiso: PermissionCode
      excluir?: number
    }
  ) {
    const lugar = await this.lugar(input.idElemento, trx)

    if (!lugar) {
      return []
    }

    const ids = await this.destinatarios(trx, {
      idCformacion: lugar.idCformacion,
      idBodega: lugar.idBodega,
      permiso: input.permiso,
      excluir: input.excluir,
    })

    return this.crear(
      trx,
      ids.map((idUsuario) => ({
        idUsuario,
        tipo: input.tipo,
        titulo: input.titulo.slice(0, 200),
        mensaje: input.mensaje,
        recurso: input.recurso,
        idReferencia: input.idReferencia,
      }))
    )
  }

  private async crear(trx: TransactionClientContract, borradores: Borrador[]) {
    if (!borradores.length) {
      return []
    }

    const fecha = DateTime.now()

    try {
      return await Notificacion.createMany(
        borradores.map((row) => ({
          ...row,
          titulo: row.titulo.slice(0, 200),
          leida: false,
          fecha,
        })),
        { client: trx }
      )
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo guardar la notificación')
    }
  }

  private async destinatarios(
    trx: TransactionClientContract,
    input: {
      idCformacion: number
      idBodega: number
      permiso: PermissionCode
      excluir?: number
    }
  ) {
    const query = db
      .from('usuario as u')
      .join('perfil as pf', 'pf.id_perfil', 'u.id_perfil')
      .where('u.estado', true)
      .where('pf.estado', true)
      .whereNot('pf.nombre', ADMIN_PROFILE_NAME)
      .where('u.id_cformacion', input.idCformacion)
      .whereExists((permiso) => {
        permiso
          .from('perfil_permiso as pp')
          .join('permiso as p', 'p.codigo', 'pp.codigo')
          .whereRaw('pp.id_perfil = pf.id_perfil')
          .where('pp.estado', true)
          .where('p.estado', true)
          .where('pp.codigo', input.permiso)
      })
      .whereExists((bodega) => {
        bodega
          .from('usuario_bodega as ub')
          .whereRaw('ub.id_usuario = u.id_usuario')
          .where('ub.id_bodega', input.idBodega)
          .where('ub.estado', true)
      })
      .distinct('u.id_usuario')
      .useTransaction(trx)

    if (input.excluir) {
      query.whereNot('u.id_usuario', input.excluir)
    }

    const rows = await query

    return rows.map((row) => Number(row.id_usuario))
  }

  private async lugar(idElemento: number, trx: TransactionClientContract) {
    const row = await db
      .from('elemento')
      .join('stand', 'stand.id_stand', 'elemento.id_stand')
      .join('sub_bodega', 'sub_bodega.id_sub_bodega', 'stand.id_sub_bodega')
      .join('bodega', 'bodega.id_bodega', 'sub_bodega.id_bodega')
      .where('elemento.id_elemento', idElemento)
      .select('bodega.id_bodega as id_bodega', 'bodega.id_cformacion as id_cformacion')
      .useTransaction(trx)
      .first()

    if (!row) {
      return null
    }

    return {
      idBodega: Number(row.id_bodega),
      idCformacion: Number(row.id_cformacion),
    }
  }

  private async nombreDe(idUsuario: number, trx: TransactionClientContract) {
    const usuario = await User.query({ client: trx })
      .where('id', idUsuario)
      .select('nombres', 'apellidos')
      .first()

    if (!usuario) {
      return 'Alguien'
    }

    return `${usuario.nombres} ${usuario.apellidos}`.trim()
  }
}
