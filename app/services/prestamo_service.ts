import { Exception } from '@adonisjs/core/exceptions'
import db from '@adonisjs/lucid/services/db'
import Prestamo, {
  type EstadoPrestamo,
} from '#models/prestamo'
import Elemento from '#models/elemento'
import User from '#models/usuario'
import Actividad from '#models/actividad'
import {
  assertStandInScope,
  forbidden,
  type AccessScope,
} from '#services/access_control'

export default class PrestamoService {
  async index(scope: AccessScope) {
    const query = Prestamo.query()
      .preload('elemento')
      .preload('usuario')
      .preload('actividad')
      .orderBy('fecha', 'desc')

    if (!scope.isAdmin) {
      query.whereHas('elemento', (elementoQuery) => {
        elementoQuery.whereIn(
          'id_stand',
          db
            .from('stand')
            .select('stand.id_stand')
            .join(
              'sub_bodega',
              'sub_bodega.id_sub_bodega',
              'stand.id_sub_bodega',
            )
            .join(
              'bodega',
              'bodega.id_bodega',
              'sub_bodega.id_bodega',
            )
            .where(
              'bodega.id_cformacion',
              scope.idCformacion,
            )
            .whereIn(
              'sub_bodega.id_bodega',
              scope.bodegaIds,
            ),
        )
      })
    }

    return query
  }

  async show(scope: AccessScope, id: number) {
    const prestamo = await Prestamo.query()
      .where('id_prestamo', id)
      .preload('elemento')
      .preload('usuario')
      .preload('actividad')
      .first()

    if (!prestamo) {
      throw new Exception('El préstamo no existe', {
        status: 404,
        code: 'E_NOT_FOUND',
      })
    }

    await this.assertInScope(scope, prestamo)

    return prestamo
  }

  async store(
    scope: AccessScope,
    payload: {
      idElemento: number
      idUsuario: number
      idActividad: number
      cantidad: number
      ficha?: string
      observacion?: string
      estado?: EstadoPrestamo
    },
  ) {
    const elemento = await Elemento.find(payload.idElemento)

    if (!elemento) {
      throw new Exception(
        'El elemento indicado no existe',
        {
          status: 422,
          code: 'E_ELEMENTO_NOT_FOUND',
        },
      )
    }

    await assertStandInScope(
      scope,
      elemento.idStand,
    )

    if (!elemento.estado) {
      throw new Exception(
        'El elemento está deshabilitado',
        {
          status: 409,
          code: 'E_ELEMENTO_DISABLED',
        },
      )
    }

    if (elemento.cantidad < payload.cantidad) {
      throw new Exception(
        `No hay suficiente cantidad disponible. Stock actual: ${elemento.cantidad}`,
        {
          status: 409,
          code: 'E_STOCK_INSUFFICIENTE',
        },
      )
    }

    const usuario = await User.find(payload.idUsuario)

    if (!usuario) {
      throw new Exception(
        'El usuario indicado no existe',
        {
          status: 422,
          code: 'E_USUARIO_NOT_FOUND',
        },
      )
    }

    if (!usuario.estado) {
      throw new Exception(
        'El usuario está deshabilitado',
        {
          status: 409,
          code: 'E_USUARIO_DISABLED',
        },
      )
    }

    if (
      !scope.isAdmin &&
      usuario.idCformacion !== scope.idCformacion
    ) {
      throw forbidden(
        'El usuario no pertenece a tu centro de formación',
      )
    }

    const actividad = await Actividad.find(
      payload.idActividad,
    )

    if (!actividad) {
      throw new Exception(
        'La actividad indicada no existe',
        {
          status: 422,
          code: 'E_ACTIVIDAD_NOT_FOUND',
        },
      )
    }

    if (!actividad.estado) {
      throw new Exception(
        'La actividad está deshabilitada',
        {
          status: 409,
          code: 'E_ACTIVIDAD_DISABLED',
        },
      )
    }

    const prestamo = await db.transaction(async (trx) => {
      const elementoBloqueado = await Elemento.query({
        client: trx,
      })
        .where('id_elemento', payload.idElemento)
        .forUpdate()
        .firstOrFail()

      if (
        elementoBloqueado.cantidad <
        payload.cantidad
      ) {
        throw new Exception(
          `No hay suficiente cantidad disponible. Stock actual: ${elementoBloqueado.cantidad}`,
          {
            status: 409,
            code: 'E_STOCK_INSUFICIENTE',
          },
        )
      }

      elementoBloqueado.cantidad -=
        payload.cantidad

      await elementoBloqueado.save()

      return Prestamo.create(
        {
          idElemento: payload.idElemento,
          idUsuario: payload.idUsuario,
          idActividad: payload.idActividad,
          cantidad: payload.cantidad,
          ficha: payload.ficha?.trim() || null,
          observacion:
            payload.observacion?.trim() || null,
          estado:
            payload.estado ?? 'prestado',
        },
        { client: trx },
      )
    })

    return this.show(
      scope,
      prestamo.id,
    )
  }

  async update(
    scope: AccessScope,
    id: number,
    payload: {
      idActividad?: number
      ficha?: string
      observacion?: string
      estado?: EstadoPrestamo
    },
  ) {
    const prestamo = await this.show(
      scope,
      id,
    )

    if (
      payload.idActividad !== undefined &&
      payload.idActividad !== prestamo.idActividad
    ) {
      const actividad = await Actividad.find(
        payload.idActividad,
      )

      if (!actividad) {
        throw new Exception(
          'La actividad indicada no existe',
          {
            status: 422,
            code: 'E_ACTIVIDAD_NOT_FOUND',
          },
        )
      }

      if (!actividad.estado) {
        throw new Exception(
          'La actividad está deshabilitada',
          {
            status: 409,
            code: 'E_ACTIVIDAD_DISABLED',
          },
        )
      }
    }

    if (
      payload.estado !== undefined &&
      payload.estado !== prestamo.estado
    ) {
      await this.changeStatus(
        scope,
        id,
        payload.estado,
      )

      return this.show(scope, id)
    }

    prestamo.merge({
      ...(payload.idActividad !== undefined
        ? { idActividad: payload.idActividad }
        : {}),
      ...(payload.ficha !== undefined
        ? {
            ficha:
              payload.ficha.trim() || null,
          }
        : {}),
      ...(payload.observacion !== undefined
        ? {
            observacion:
              payload.observacion.trim() || null,
          }
        : {}),
    })

    await prestamo.save()

    return this.show(scope, id)
  }

  async changeStatus(
    scope: AccessScope,
    id: number,
    estado: EstadoPrestamo,
  ) {
    const prestamo = await this.show(
      scope,
      id,
    )

    if (prestamo.estado === estado) {
      return prestamo
    }

    if (
      prestamo.estado === 'consumido'
    ) {
      throw new Exception(
        'Un préstamo consumido no puede cambiar de estado',
        {
          status: 409,
          code: 'E_PRESTAMO_CERRADO',
        },
      )
    }

    const elemento = await Elemento.findOrFail(
      prestamo.idElemento,
    )

    if (
      prestamo.estado === 'prestado' &&
      estado === 'devuelto'
    ) {
      elemento.cantidad += prestamo.cantidad
    }

    if (
      prestamo.estado === 'devuelto' &&
      estado === 'prestado'
    ) {
      if (
        elemento.cantidad <
        prestamo.cantidad
      ) {
        throw new Exception(
          `No hay suficiente stock para volver a prestar el elemento. Stock actual: ${elemento.cantidad}`,
          {
            status: 409,
            code: 'E_STOCK_INSUFICIENTE',
          },
        )
      }

      elemento.cantidad -= prestamo.cantidad
    }

    prestamo.estado = estado

    await db.transaction(async () => {
      await elemento.save()

      await prestamo.save()
    })

    return this.show(scope, id)
  }

  async registerReturn(
    scope: AccessScope,
    id: number,
  ) {
    return this.changeStatus(
      scope,
      id,
      'devuelto',
    )
  }

  private async assertInScope(
    scope: AccessScope,
    prestamo: Prestamo,
  ) {
    const elemento = prestamo.elemento

    if (!elemento) {
      throw new Exception(
        'El elemento del préstamo no existe',
        {
          status: 422,
          code: 'E_ELEMENTO_NOT_FOUND',
        },
      )
    }

    await assertStandInScope(
      scope,
      elemento.idStand,
    )
  }
}