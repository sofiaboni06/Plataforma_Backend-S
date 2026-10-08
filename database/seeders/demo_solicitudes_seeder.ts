import logger from '@adonisjs/core/services/logger'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Bodega from '#models/bodega'
import Categoria from '#models/categoria'
import ClasificacionElemento from '#models/clasificacion_elemento'
import Elemento from '#models/elemento'
import Item from '#models/item'
import Obra from '#models/obra'
import Stand from '#models/stand'
import SubBodega from '#models/sub_bodega'
import Subcategoria from '#models/subcategoria'
import UnidadMedida from '#models/unidad_medida'
import User from '#models/usuario'
import NotificacionService from '#services/notificacion_service'
import ClasificacionElementoSeeder from '#database/seeders/clasificacion_elemento_seeder'

const BODEGA_USER_EMAIL = 'adminbodega@correo.com'
const SUB_BODEGA = 'Demo solicitudes'
const STAND_EQUIPOS = 'Estante herramientas'
const STAND_MATERIALES = 'Estante materiales'

const OBRAS = [
  { nombre: 'Remodelación aula 204', lugar: 'Bloque B, segundo piso' },
  { nombre: 'Mantenimiento cafetería', lugar: 'Bloque A' },
]

const UNIDADES = [
  { nombre: 'Unidad', abreviatura: 'und' },
  { nombre: 'Galon', abreviatura: 'gal' },
  { nombre: '1/4 galon', abreviatura: '1/4 gal' },
  { nombre: 'Kilogramo', abreviatura: 'kg' },
  { nombre: 'Bulto', abreviatura: 'bto' },
] as const

type Abreviatura = (typeof UNIDADES)[number]['abreviatura']

type Producto = {
  codigo: string
  nombre: string
  categoria: string
  subcategoria: string
  clasificacion: string
  unidad: Abreviatura
  cantidad: number
  cantidadMinima: number
  marca?: string
  descripcion?: string
}

/*
 * Devolutivo: sale de bodega y vuelve. Va por solicitud de equipo.
 */
const EQUIPOS: Producto[] = [
  {
    codigo: 'DEMO-EQ-TAL',
    nombre: 'Taladro percutor 1/2"',
    categoria: 'Herramientas',
    subcategoria: 'Eléctricas',
    clasificacion: 'HERRAMIENTA',
    unidad: 'und',
    cantidad: 6,
    cantidadMinima: 2,
    marca: 'DeWalt',
    descripcion: '750 W, velocidad variable, con maletín.',
  },
  {
    codigo: 'DEMO-EQ-PUL',
    nombre: 'Pulidora 4 1/2"',
    categoria: 'Herramientas',
    subcategoria: 'Eléctricas',
    clasificacion: 'HERRAMIENTA',
    unidad: 'und',
    cantidad: 5,
    cantidadMinima: 2,
    marca: 'Bosch',
    descripcion: '850 W, con guarda y mango lateral.',
  },
  {
    codigo: 'DEMO-EQ-SIE',
    nombre: 'Sierra circular 7 1/4"',
    categoria: 'Herramientas',
    subcategoria: 'Eléctricas',
    clasificacion: 'HERRAMIENTA',
    unidad: 'und',
    cantidad: 3,
    cantidadMinima: 1,
    marca: 'Makita',
  },
  {
    codigo: 'DEMO-EQ-ROT',
    nombre: 'Rotomartillo SDS Plus',
    categoria: 'Herramientas',
    subcategoria: 'Eléctricas',
    clasificacion: 'HERRAMIENTA',
    unidad: 'und',
    cantidad: 4,
    cantidadMinima: 1,
    marca: 'Bosch',
  },
  {
    codigo: 'DEMO-EQ-ATO',
    nombre: 'Atornillador inalámbrico 20 V',
    categoria: 'Herramientas',
    subcategoria: 'Eléctricas',
    clasificacion: 'HERRAMIENTA',
    unidad: 'und',
    cantidad: 6,
    cantidadMinima: 2,
    marca: 'DeWalt',
    descripcion: 'Incluye dos baterías y cargador.',
  },
  {
    codigo: 'DEMO-EQ-MAR',
    nombre: 'Martillo de uña 16 oz',
    categoria: 'Herramientas',
    subcategoria: 'Manuales',
    clasificacion: 'HERRAMIENTA MENOR',
    unidad: 'und',
    cantidad: 12,
    cantidadMinima: 3,
    marca: 'Stanley',
  },
  {
    codigo: 'DEMO-EQ-NIV',
    nombre: 'Nivel de burbuja 24"',
    categoria: 'Herramientas',
    subcategoria: 'Manuales',
    clasificacion: 'HERRAMIENTA MENOR',
    unidad: 'und',
    cantidad: 8,
    cantidadMinima: 2,
    marca: 'Stanley',
  },
  {
    codigo: 'DEMO-EQ-ESC',
    nombre: 'Escalera de tijera 6 pasos',
    categoria: 'Herramientas',
    subcategoria: 'Manuales',
    clasificacion: 'HERRAMIENTA MENOR',
    unidad: 'und',
    cantidad: 3,
    cantidadMinima: 1,
    descripcion: 'Aluminio, carga máxima 102 kg.',
  },
]

/*
 * Consumo: se gasta en la obra. Va por solicitud de material y no vuelve.
 */
const MATERIALES: Producto[] = [
  {
    codigo: 'DEMO-MAT-VIN',
    nombre: 'Pintura vinilo tipo 1 blanco',
    categoria: 'Construcción',
    subcategoria: 'Pinturas',
    clasificacion: 'MATERIAL DE CONSUMO',
    unidad: 'gal',
    cantidad: 30,
    cantidadMinima: 5,
    marca: 'Pintuco',
  },
  {
    codigo: 'DEMO-MAT-ESM',
    nombre: 'Esmalte sintético negro',
    categoria: 'Construcción',
    subcategoria: 'Pinturas',
    clasificacion: 'MATERIAL DE CONSUMO',
    unidad: '1/4 gal',
    cantidad: 24,
    cantidadMinima: 4,
    marca: 'Pintuco',
  },
  {
    codigo: 'DEMO-MAT-THI',
    nombre: 'Thinner corriente',
    categoria: 'Construcción',
    subcategoria: 'Pinturas',
    clasificacion: 'MATERIAL DE CONSUMO',
    unidad: 'gal',
    cantidad: 15,
    cantidadMinima: 3,
  },
  {
    codigo: 'DEMO-MAT-ROD',
    nombre: 'Rodillo de felpa 9"',
    categoria: 'Construcción',
    subcategoria: 'Pinturas',
    clasificacion: 'MATERIAL DE CONSUMO',
    unidad: 'und',
    cantidad: 20,
    cantidadMinima: 5,
  },
  {
    codigo: 'DEMO-MAT-CEM',
    nombre: 'Cemento gris 50 kg',
    categoria: 'Construcción',
    subcategoria: 'Obra gris',
    clasificacion: 'MATERIAL DE CONSUMO',
    unidad: 'bto',
    cantidad: 40,
    cantidadMinima: 10,
    marca: 'Argos',
  },
  {
    codigo: 'DEMO-MAT-PUN',
    nombre: 'Puntilla con cabeza 2"',
    categoria: 'Construcción',
    subcategoria: 'Obra gris',
    clasificacion: 'MATERIAL DE CONSUMO',
    unidad: 'kg',
    cantidad: 25,
    cantidadMinima: 5,
  },
  {
    codigo: 'DEMO-MAT-LIJ',
    nombre: 'Lija de agua #120',
    categoria: 'Construcción',
    subcategoria: 'Pinturas',
    clasificacion: 'MATERIAL DE CONSUMO',
    unidad: 'und',
    cantidad: 100,
    cantidadMinima: 20,
  },
  {
    codigo: 'DEMO-MAT-DIS',
    nombre: 'Disco de corte metal 4 1/2"',
    categoria: 'Construcción',
    subcategoria: 'Obra gris',
    clasificacion: 'MATERIAL DE CONSUMO',
    unidad: 'und',
    cantidad: 12,
    cantidadMinima: 10,
    descripcion: 'Arranca cerca del mínimo para ver la alerta después de una entrega.',
  },
]

/**
 * Datos para que el equipo y el product owner prueben las dos solicitudes:
 * herramientas devolutivas (taladro, pulidora…) y materiales de consumo
 * (pintura, cemento…), en la bodega de Admin bodega y con obras activas.
 *
 * Safe to run again: lo que ya existe se deja como está, incluido el stock que
 * hayan movido las pruebas.
 */
export default class extends BaseSeeder {
  static environment = ['development', 'test']

  async run() {
    await new ClasificacionElementoSeeder(this.client).run()

    const bodega = await this.bodega()
    if (!bodega) {
      logger.warn('No hay una bodega activa para Admin bodega; corre admin_bodega_seeder primero.')
      return
    }

    await this.obras(bodega.idCformacion)

    const subBodega = await this.subBodega(bodega.id)
    const standEquipos = await this.stand(subBodega.id, STAND_EQUIPOS)
    const standMateriales = await this.stand(subBodega.id, STAND_MATERIALES)
    const unidades = await this.unidades()

    for (const producto of EQUIPOS) {
      await this.elemento(producto, standEquipos.id, bodega.idCformacion, unidades)
    }

    for (const producto of MATERIALES) {
      await this.elemento(producto, standMateriales.id, bodega.idCformacion, unidades)
    }
  }

  private async bodega() {
    const user = await User.query().where('email', BODEGA_USER_EMAIL).first()

    if (user) {
      const assigned = await user
        .related('bodegas')
        .query()
        .where('bodega.estado', true)
        .orderBy('bodega.id_bodega', 'asc')
        .first()

      if (assigned) return assigned
    }

    return Bodega.query().where('estado', true).orderBy('id_bodega', 'asc').first()
  }

  private async obras(idCformacion: number) {
    for (const obra of OBRAS) {
      await Obra.firstOrCreate(
        { idCformacion, nombre: obra.nombre },
        { idCformacion, nombre: obra.nombre, lugar: obra.lugar, estado: true }
      )
    }
  }

  private subBodega(idBodega: number) {
    return SubBodega.firstOrCreate(
      { idBodega, nombre: SUB_BODEGA },
      { idBodega, nombre: SUB_BODEGA, estado: true }
    )
  }

  private stand(idSubBodega: number, nombre: string) {
    return Stand.firstOrCreate({ idSubBodega, nombre }, { idSubBodega, nombre, estado: true })
  }

  private async unidades() {
    const ids = new Map<Abreviatura, number>()

    for (const unidad of UNIDADES) {
      const existing = await UnidadMedida.query()
        .whereRaw('lower(abreviatura) = lower(?)', [unidad.abreviatura])
        .first()

      const row = existing ?? (await UnidadMedida.create({ ...unidad, estado: true }))
      ids.set(unidad.abreviatura, row.id)
    }

    return ids
  }

  private async subcategoria(categoriaNombre: string, nombre: string) {
    const categoria =
      (await Categoria.query().whereRaw('lower(nombre) = lower(?)', [categoriaNombre]).first()) ??
      (await Categoria.create({ nombre: categoriaNombre, estado: true }))

    const existing = await Subcategoria.query()
      .where('id_categoria', categoria.id)
      .whereRaw('lower(nombre) = lower(?)', [nombre])
      .first()

    return existing ?? Subcategoria.create({ idCategoria: categoria.id, nombre, estado: true })
  }

  private async elemento(
    producto: Producto,
    idStand: number,
    idCformacion: number,
    unidades: Map<Abreviatura, number>
  ) {
    const existing = await Elemento.query()
      .where('id_stand', idStand)
      .where('codigo', producto.codigo)
      .first()

    if (existing) return

    const subcategoria = await this.subcategoria(producto.categoria, producto.subcategoria)
    const clasificacion = await ClasificacionElemento.query()
      .whereRaw('lower(nombre) = lower(?)', [producto.clasificacion])
      .firstOrFail()

    const item = await Item.firstOrCreate(
      { idSubcategoria: subcategoria.id, nombre: producto.nombre, estado: true },
      {
        idSubcategoria: subcategoria.id,
        idCformacion,
        nombre: producto.nombre,
        descripcion: producto.descripcion ?? null,
        estado: true,
      }
    )

    const elemento = await Elemento.create({
      idItem: item.id,
      idSubcategoria: subcategoria.id,
      idStand,
      nombre: producto.nombre,
      cantidad: producto.cantidad,
      cantidadMinima: producto.cantidadMinima,
      estado: true,
      idUnidadMedida: unidades.get(producto.unidad)!,
      codigo: producto.codigo,
      descripcionTecnica: producto.descripcion ?? null,
      marca: producto.marca ?? null,
      color: null,
      gramaje: null,
      idClasificacion: clasificacion.id,
      valorUnitarioPromedio: null,
      porcentajeAumento: null,
      idCodigoEstandar: null,
      idUsoPresupuestal: null,
      urlFotografia: null,
    })

    await new NotificacionService().aplicarStock(elemento, false)
  }
}
