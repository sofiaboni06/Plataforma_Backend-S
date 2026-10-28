import { Exception } from '@adonisjs/core/exceptions'
import db from '@adonisjs/lucid/services/db'
import ProcesoCompra from '#models/proceso_compra'
import ProcesoCompraOrigen from '#models/proceso_compra_origen'
import { assertCan, type AccessScope } from '#services/access_control'
import { rethrowDatabaseError } from '#services/database_error'

export default class ProcesoCompraService {
  async consolidado(scope: AccessScope, vigencia: number) {
    assertCan(scope, 'proceso_compra.ver')

    const rows = await db
      .from('detalle_solicitud_programa as d')
      .join(
        'solicitud_material_programa as s',
        's.id_solicitud_programa',
        'd.id_solicitud_programa'
      )
      .join('lista_maestra_material as l', 'l.id_lista_maestra', 'd.id_lista_maestra')
      .join('programa_formacion as p', 'p.id_programa_formacion', 's.id_programa_formacion')
      .where('s.vigencia', vigencia)
      .whereIn('s.estado', ['aprobada', 'parcial'])
      .whereIn('d.estado', ['aprobado', 'parcial'])
      .select(
        'l.codigo_unspsc as codigoUnspsc',
        'l.producto as producto',
        'l.unidad_medida as unidadMedida',
        'l.caracter as caracter',
        'p.codigo_programa as codigoPrograma',
        'p.nombre_programa as nombrePrograma'
      )
      .sum('d.cantidad_aprobada as cantidadAprobada')
      .groupBy(
        'l.codigo_unspsc',
        'l.producto',
        'l.unidad_medida',
        'l.caracter',
        'p.codigo_programa',
        'p.nombre_programa'
      )
      .orderBy('l.producto', 'asc')

    return rows.map((row) => ({
      codigoUnspsc: row.codigoUnspsc,
      producto: row.producto,
      unidadMedida: row.unidadMedida,
      caracter: row.caracter,
      codigoPrograma: row.codigoPrograma,
      nombrePrograma: row.nombrePrograma,
      cantidadAprobada: Number(row.cantidadAprobada),
    }))
  }

  async generar(
    scope: AccessScope,
    payload: { vigencia: number; codigoProceso: string; descripcion?: string | null }
  ) {
    assertCan(scope, 'proceso_compra.crear')
    const consolidado = await this.consolidado(scope, payload.vigencia)
    if (!consolidado.length) {
      throw new Exception('No hay ítems aprobados para unificar en esa vigencia', {
        status: 422,
        code: 'E_SIN_APROBADOS',
      })
    }

    try {
      const proceso = await ProcesoCompra.create({
        vigencia: payload.vigencia,
        codigoProceso: payload.codigoProceso,
        descripcion: payload.descripcion ?? null,
        usuarioComprasId: scope.idUsuario,
        estado: 'generado',
      })

      const detalles = await db
        .from('detalle_solicitud_programa as d')
        .join(
          'solicitud_material_programa as s',
          's.id_solicitud_programa',
          'd.id_solicitud_programa'
        )
        .leftJoin(
          'proceso_compra_origen as o',
          'o.id_detalle_solicitud',
          'd.id_detalle_solicitud'
        )
        .where('s.vigencia', payload.vigencia)
        .whereIn('s.estado', ['aprobada', 'parcial'])
        .whereIn('d.estado', ['aprobado', 'parcial'])
        .whereNull('o.id_proceso_origen')
        .select('d.id_detalle_solicitud as id')

      if (detalles.length) {
        await ProcesoCompraOrigen.createMany(
          detalles.map((detalle) => ({
            procesoId: proceso.id,
            detalleId: Number(detalle.id),
          }))
        )
      }

      return {
        id: proceso.id,
        vigencia: proceso.vigencia,
        codigoProceso: proceso.codigoProceso,
        descripcion: proceso.descripcion,
        estado: proceso.estado,
        items: consolidado,
      }
    } catch (error) {
      rethrowDatabaseError(error, 'No se pudo generar el proceso de compra')
    }
  }
}
