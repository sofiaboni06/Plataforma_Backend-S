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
import type { SolicitudPendiente } from '#services/disponibilidad_service'
import { notificacionJson } from '#transformers/notificacion_transformer'
import { diasEntre, fechaCorta, inicioDeHoy, type FechaDia } from '#services/plazo'
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

type AvisoEntrega = {
  idSolicitud: number
  codigoSolicitud?: string | null
  idDestinatario: number
  idQuienEntrega: number
  /** Lo que salió en esta entrega. */
  cantidad: number
  /** Lo que sigue faltando después de esta entrega. */
  pendiente: number
  /** Lo que ya se había entregado antes. Mayor que cero: bodega completa una parcial. */
  entregadaAntes?: number
  elemento: string
}

function mensajeEntrega(input: { cantidad: number; pendiente: number; elemento: string }) {
  const resto = input.pendiente > 0 ? ` Quedan ${input.pendiente} pendientes.` : ''
  return `Te entregaron ${input.cantidad} de ${input.elemento}.${resto}`
}

/**
 * La solicitud ya era `parcial`: lo que sale ahora es lo que había quedado
 * pendiente. El aviso dice que la solicitud se actualizó y cuánto falta.
 */
function mensajeActualizacion(input: AvisoEntrega) {
  const deSolicitud = input.codigoSolicitud ? ` de tu solicitud ${input.codigoSolicitud}` : ''

  if (input.pendiente <= 0) {
    return input.cantidad === 1
      ? `Se entregó el elemento pendiente de ${input.elemento}${deSolicitud}.`
      : `Se entregaron los ${input.cantidad} elementos pendientes de ${input.elemento}${deSolicitud}.`
  }

  const verbo = input.cantidad === 1 ? 'Se entregó' : 'Se entregaron'
  const resto =
    input.pendiente === 1 ? 'Queda 1 pendiente.' : `Quedan ${input.pendiente} pendientes.`

  return `${verbo} ${input.cantidad} de los ${input.cantidad + input.pendiente} pendientes de ${input.elemento}${deSolicitud}. ${resto}`
}

export function solicitudes(total: number) {
  return total === 1 ? '1 solicitud' : `${total} solicitudes`
}

function elementos(total: number) {
  return total === 1 ? '1 elemento' : `${total} elementos`
}

/** "a", "a y b", "a, b y c". */
function enLista(partes: string[]) {
  return partes.length > 1
    ? `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}`
    : (partes[0] ?? '')
}

function avisoEntrega(
  input: AvisoEntrega,
  tipo: 'material' | 'equipo'
): Omit<Borrador, 'idUsuario'> {
  const material = tipo === 'material'
  const actualizacion = (input.entregadaAntes ?? 0) > 0
  const nombre = material ? 'Material' : 'Equipo'

  return {
    tipo: material ? 'entrega_material' : 'entrega_equipo',
    titulo: actualizacion
      ? 'Solicitud actualizada'
      : input.pendiente > 0
        ? `${nombre} entregado en parte`
        : `${nombre} entregado`,
    mensaje: actualizacion ? mensajeActualizacion(input) : mensajeEntrega(input),
    recurso: material ? 'solicitud_material' : 'solicitud_equipo',
    idReferencia: input.idSolicitud,
  }
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
   * con las filas que salen de las bodegas que esa persona atiende:
   * "Nueva solicitud SOL-1 de Ana Pérez: 3 elementos".
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
        const detalle = enLista(grupo.lineas.map((row) => `${row.cantidad} de ${row.elemento}`))

        return {
          idUsuario: grupo.idUsuario,
          tipo: material ? 'solicitud_material' : 'solicitud_equipo',
          titulo: `Nueva solicitud ${input.codigoSolicitud} de ${solicitante}: ${elementos(grupo.lineas.length)}`,
          mensaje: `${material ? 'Material de consumo' : 'Equipo devolutivo'} para ${input.obra}: ${detalle}.`,
          recurso: material ? 'solicitud_material' : 'solicitud_equipo',
          idReferencia: grupo.lineas[0].idSolicitud,
        }
      })
    )
  }

  /**
   * Primera entrega: "Material entregado" o "entregado en parte". Si la fila ya
   * era `parcial`, el aviso es "Solicitud actualizada" con lo que faltaba.
   */
  async entregaMaterial(trx: TransactionClientContract, input: AvisoEntrega) {
    return this.paraUno(
      trx,
      input.idDestinatario,
      input.idQuienEntrega,
      avisoEntrega(input, 'material')
    )
  }

  async entregaEquipo(trx: TransactionClientContract, input: AvisoEntrega) {
    return this.paraUno(
      trx,
      input.idDestinatario,
      input.idQuienEntrega,
      avisoEntrega(input, 'equipo')
    )
  }

  /**
   * Bodega entregó varias filas de una misma solicitud en un solo paso: un
   * aviso con todo lo que salió y lo que sigue pendiente, no uno por fila. Si
   * alguna ya era parcial, el título es "Solicitud actualizada".
   */
  async entregaVarias(
    trx: TransactionClientContract,
    input: {
      codigoSolicitud: string
      tipo: 'material' | 'equipo'
      idDestinatario: number
      idQuienEntrega: number
      entregadas: {
        idSolicitud: number
        elemento: string
        cantidad: number
        entregadaAntes: number
      }[]
      pendientes: { elemento: string; pendiente: number }[]
    }
  ) {
    const material = input.tipo === 'material'
    const nombre = material ? 'Material' : 'Equipo'
    const actualizacion = input.entregadas.some((row) => row.entregadaAntes > 0)
    const salio = enLista(input.entregadas.map((row) => `${row.cantidad} de ${row.elemento}`))
    const falta = enLista(input.pendientes.map((row) => `${row.pendiente} de ${row.elemento}`))

    return this.paraUno(trx, input.idDestinatario, input.idQuienEntrega, {
      tipo: material ? 'entrega_material' : 'entrega_equipo',
      titulo: actualizacion
        ? 'Solicitud actualizada'
        : input.pendientes.length
          ? `${nombre} entregado en parte`
          : `${nombre} entregado`,
      mensaje: `Te entregaron ${salio} de tu solicitud ${input.codigoSolicitud}.${
        falta ? ` Quedan pendientes ${falta}.` : ''
      }`,
      recurso: material ? 'solicitud_material' : 'solicitud_equipo',
      idReferencia: input.entregadas[0]?.idSolicitud ?? null,
    })
  }

  async devolucionEquipo(
    trx: TransactionClientContract,
    input: {
      idSolicitud: number
      idDestinatario: number
      idQuienRecibe: number
      idElemento?: number
      elemento: string
      lineas: { cantidad: number; estadoElemento: EstadoElementoEquipo; observacion?: string }[]
      /** La devolución vino unidad por unidad: el aviso las lista todas. */
      porUnidad?: boolean
      /** Número (dentro de la solicitud) de la primera unidad que volvió. */
      primeraUnidad?: number
      afuera: number
    }
  ) {
    const total = input.lineas.reduce((suma, linea) => suma + linea.cantidad, 0)
    const conteo = new Map<EstadoElementoEquipo, number>()
    for (const linea of input.lineas) {
      conteo.set(linea.estadoElemento, (conteo.get(linea.estadoElemento) ?? 0) + linea.cantidad)
    }
    const detalle = [...conteo]
      .map(([estado, cantidad]) => `${cantidad} ${ESTADO_EQUIPO[estado]}`)
      .join(', ')
    const resto = input.afuera > 0 ? ` Quedan ${input.afuera} por devolver.` : ''
    const desde = input.primeraUnidad ?? 1
    const unidades = input.porUnidad
      ? `\n${input.lineas
          .map((linea, i) => {
            const nota = linea.observacion?.trim()
            return `Unidad ${desde + i}: ${ESTADO_EQUIPO[linea.estadoElemento]}${nota ? ` — ${nota}` : ''}`
          })
          .join('\n')}`
      : ''
    const mensaje = `Bodega recibió ${total} de ${input.elemento}: ${detalle}.${resto}${unidades}`
    const conNovedad = input.lineas.some((linea) => linea.estadoElemento !== 'bueno')

    const avisos = await this.paraUno(trx, input.idDestinatario, input.idQuienRecibe, {
      tipo: 'devolucion_equipo',
      titulo: conNovedad ? 'Equipo devuelto con novedad' : 'Equipo devuelto',
      mensaje,
      recurso: 'solicitud_equipo',
      idReferencia: input.idSolicitud,
    })

    // Con dañados o perdidos, el resto de bodega también se entera: un solo
    // aviso por persona con la novedad de cada unidad.
    if (!conNovedad || input.idElemento === undefined) {
      return avisos
    }

    return [
      ...avisos,
      ...(await this.paraEncargados(trx, {
        idElemento: input.idElemento,
        permiso: 'solicitud_equipo.devolver',
        excluir: input.idQuienRecibe,
        tipo: 'devolucion_equipo',
        titulo: `Novedad en devolución de ${input.elemento}`,
        mensaje,
        recurso: 'solicitud_equipo',
        idReferencia: input.idSolicitud,
      })),
    ]
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

  /**
   * Bodega subió la existencia de un elemento que tiene solicitudes esperando
   * unidades: porque agregó stock (`ingreso`) o porque volvió equipo en buen
   * estado (`devolucion`). Un solo aviso por entrada (por tipo, si hubiera de
   * los dos) con el resumen, no uno por fila. La entrega sigue siendo manual.
   */
  async stockParaPendientes(
    trx: TransactionClientContract,
    input: {
      idElemento: number
      elemento: string
      idQuienAgrega: number
      agregadas: number
      cantidad: number
      filas: SolicitudPendiente[]
      origen?: 'ingreso' | 'devolucion'
    }
  ) {
    const avisos: Notificacion[] = []
    const quien = await this.nombreDe(input.idQuienAgrega, trx)
    const unidades = `${input.agregadas} ${input.agregadas === 1 ? 'unidad' : 'unidades'} de ${input.elemento}`
    const devolucion = input.origen === 'devolucion'

    for (const tipo of ['material', 'equipo'] as const) {
      const filas = input.filas.filter((row) => row.tipo === tipo)

      if (!filas.length) {
        continue
      }

      const material = tipo === 'material'
      const detalle = filas
        .slice(0, 3)
        .map(
          (row) =>
            `${row.codigoSolicitud} (${row.solicitante}, ${row.pendiente} ${row.pendiente === 1 ? 'pendiente' : 'pendientes'})`
        )
        .join(', ')
      const mas = filas.length > 3 ? ` y ${filas.length - 3} más` : ''

      avisos.push(
        ...(await this.paraEncargados(trx, {
          idElemento: input.idElemento,
          permiso: material ? 'solicitud_material.entregar' : 'solicitud_equipo.entregar',
          tipo: material ? 'solicitud_material' : 'solicitud_equipo',
          titulo: devolucion
            ? `Volvieron unidades de ${input.elemento} para solicitudes pendientes`
            : `Nuevas unidades de ${input.elemento} para solicitudes pendientes`,
          mensaje: devolucion
            ? `${quien} recibió ${unidades} en buen estado (ahora hay ${input.cantidad}) y hay solicitudes pendientes. Tienes ${solicitudes(filas.length)} por actualizar y entregar: ${detalle}${mas}.`
            : `${quien} agregó ${unidades} (ahora hay ${input.cantidad}) y tiene solicitudes pendientes. Tienes ${solicitudes(filas.length)} por actualizar y entregar: ${detalle}${mas}.`,
          recurso: material ? 'solicitud_material' : 'solicitud_equipo',
          idReferencia: filas[0].id,
        }))
      )
    }

    return avisos
  }

  /**
   * Préstamo de equipo que vence hoy o ya venció y sigue con unidades afuera.
   * Avisa al instructor y a quien recibe devoluciones en esas bodegas. Se
   * puede correr varias veces al día: a cada persona le llega uno por pedido
   * por día (mismo título, misma fila de referencia, desde la medianoche).
   * Reusa el tipo `devolucion_equipo`: no hace falta tocar la tabla.
   */
  async vencimientoEquipo(
    trx: TransactionClientContract,
    input: {
      codigoSolicitud: string
      idSolicitante: number
      limite: FechaDia
      dia: FechaDia
      lineas: { idSolicitud: number; idElemento: number; elemento: string; afuera: number }[]
    }
  ) {
    if (!input.lineas.length) {
      return []
    }

    const solicitante = await this.nombreDe(input.idSolicitante, trx)
    const detalle = enLista(input.lineas.map((row) => `${row.afuera} de ${row.elemento}`))
    const atraso = diasEntre(input.limite, input.dia)
    const venceHoy = atraso <= 0
    const plazo = venceHoy
      ? `Hoy (${fechaCorta(input.limite)}) es el último día para devolverlo.`
      : `Debía volver el ${fechaCorta(input.limite)}: lleva ${atraso === 1 ? '1 día' : `${atraso} días`} de atraso.`
    const titulo = venceHoy
      ? `Hoy vence la devolución de ${input.codigoSolicitud}`
      : `Devolución vencida: ${input.codigoSolicitud}`
    const idReferencia = input.lineas[0].idSolicitud
    const borradores: Borrador[] = []

    const instructor = await User.query({ client: trx })
      .where('id', input.idSolicitante)
      .where('estado', true)
      .first()

    if (instructor) {
      borradores.push({
        idUsuario: instructor.id,
        tipo: 'devolucion_equipo',
        titulo,
        mensaje: `Tienes afuera ${detalle}. ${plazo} Llévalo a bodega.`,
        recurso: 'solicitud_equipo',
        idReferencia,
      })
    }

    const bodega = new Set<number>()

    for (const linea of input.lineas) {
      const lugar = await this.lugar(linea.idElemento, trx)

      if (!lugar) {
        continue
      }

      const ids = await this.destinatarios(trx, {
        idCformacion: lugar.idCformacion,
        idBodega: lugar.idBodega,
        permiso: 'solicitud_equipo.devolver',
        excluir: input.idSolicitante,
      })
      ids.forEach((id) => bodega.add(id))
    }

    for (const idUsuario of bodega) {
      borradores.push({
        idUsuario,
        tipo: 'devolucion_equipo',
        titulo: `${titulo} de ${solicitante}`,
        mensaje: `${solicitante} tiene afuera ${detalle}. ${plazo}`,
        recurso: 'solicitud_equipo',
        idReferencia,
      })
    }

    const nuevos: Borrador[] = []
    const desde = inicioDeHoy()

    for (const borrador of borradores) {
      const repetido = await Notificacion.query({ client: trx })
        .where('id_usuario', borrador.idUsuario)
        .where('tipo', borrador.tipo)
        .where('id_referencia', idReferencia)
        .where('titulo', borrador.titulo.slice(0, 200))
        .where('fecha', '>=', desde.toJSDate())
        .first()

      if (!repetido) {
        nuevos.push(borrador)
      }
    }

    return this.crear(trx, nuevos)
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
