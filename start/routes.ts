import '#config/fotos'
import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'
import AlertasController from '#controllers/alertas_controller'
import EntregasController from '#controllers/entregas_controller'
import NotificacionesController from '#controllers/notificaciones_controller'
import SolicitudEquipoController from '#controllers/solicitud_equipo_controller'
import SolicitudMaterialController from '#controllers/solicitud_material_controller'
import SolicitudesController from '#controllers/solicitudes_controller'
import PasswordRecoveryController from '#controllers/password_recovery_controller'
import transmit from '@adonisjs/transmit/services/main'

router.get('/', () => {
  return { hello: 'world' }
})

transmit.registerRoutes((route) => {
  if (route.getPattern() === '__transmit/events') {
    return
  }

  route.use(middleware.auth())
  route.use(middleware.account())
})

router
  .group(() => {
    router
      .group(() => {
        router.post('signup', [controllers.NewAccount, 'store'])
        router.post('login', [controllers.AccessTokens, 'store'])
        router.post('recover', [PasswordRecoveryController, 'request'])
        router.post('recover/verify', [PasswordRecoveryController, 'verify'])
        router.post('recover/google', [PasswordRecoveryController, 'verifyGoogle'])
        router.post('recover/reset', [PasswordRecoveryController, 'reset'])
      })
      .prefix('auth')
      .as('auth')

    router
      .group(() => {
        router.post('2fa/google/setup', [PasswordRecoveryController, 'setupGoogle'])
        router.post('2fa/google/confirm', [PasswordRecoveryController, 'confirmGoogle'])
        router.delete('2fa/google', [PasswordRecoveryController, 'disableGoogle'])
      })
      .prefix('auth')
      .as('authTwoFactor')
      .use(middleware.auth())
      .use(middleware.account())

    router
      .group(() => {
        router.get('profile', [controllers.Profile, 'show'])
        router.patch('profile', [controllers.Profile, 'update'])
        router.patch('password', [controllers.Profile, 'changePassword'])
        router.get('notifications', [NotificacionesController, 'index'])
        router.patch('notifications', [NotificacionesController, 'updateAll'])
        router.patch('notifications/:id', [NotificacionesController, 'update'])
        router.post('logout', [controllers.AccessTokens, 'destroy'])
      })
      .prefix('account')
      .as('account')
      .use(middleware.auth())
      .use(middleware.account())

    router
      .group(() => {
        router.get('/', [controllers.Modules, 'index'])
        router.get('tree', [controllers.Modules, 'tree'])
        router.get('catalog', [controllers.Modules, 'catalog']).use(middleware.admin())
        router.post('catalog', [controllers.Modules, 'store']).use(middleware.admin())
      })
      .prefix('modules')
      .as('modules')
      .use(middleware.auth())
      .use(middleware.account())

    router
      .group(() => {
        router.get('/', [controllers.Roles, 'index'])
        router.post('/', [controllers.Roles, 'store'])
        router.get(':id', [controllers.Roles, 'show'])
        router.patch(':id', [controllers.Roles, 'update'])
        router.put(':id/modules', [controllers.Roles, 'syncModules'])
        router.put(':id/permissions', [controllers.Roles, 'syncPermissions'])
      })
      .prefix('roles')
      .as('roles')
      .use(middleware.auth())
      .use(middleware.account())
      .use(middleware.admin())

    router
      .group(() => {
        router.get('options', [controllers.Users, 'options'])
        router.get('/', [controllers.Users, 'index'])
        router.post('/', [controllers.Users, 'store'])
        router.get(':id', [controllers.Users, 'show'])
        router.patch(':id', [controllers.Users, 'update'])
        router.put(':id/bodegas', [controllers.Users, 'syncBodegas'])
      })
      .prefix('users')
      .as('users')
      .use(middleware.auth())
      .use(middleware.account())
      .use(middleware.admin())

    router
      .group(() => {
        router.get('/', [controllers.Permissions, 'index'])
      })
      .prefix('permissions')
      .as('permissions')
      .use(middleware.auth())
      .use(middleware.account())
      .use(middleware.admin())

    router
      .group(() => {
        router
          .get('/', [controllers.Categorias, 'index'])
          .use(middleware.permission('categoria.ver'))
        router
          .post('/', [controllers.Categorias, 'store'])
          .use(middleware.permission('categoria.crear'))
        router
          .get(':id', [controllers.Categorias, 'show'])
          .use(middleware.permission('categoria.ver'))
        router
          .patch(':id', [controllers.Categorias, 'update'])
          .use(middleware.permission('categoria.editar'))
        router
          .delete(':id', [controllers.Categorias, 'destroy'])
          .use(middleware.permission('categoria.eliminar'))
      })
      .prefix('categorias')
      .as('categorias')
      .use(middleware.auth())
      .use(middleware.account())

    router
      .group(() => {
        router
          .get('/', [controllers.Subcategorias, 'index'])
          .use(middleware.permission('subcategoria.ver'))
        router
          .post('/', [controllers.Subcategorias, 'store'])
          .use(middleware.permission('subcategoria.crear'))
        router
          .get(':id', [controllers.Subcategorias, 'show'])
          .use(middleware.permission('subcategoria.ver'))
        router
          .patch(':id', [controllers.Subcategorias, 'update'])
          .use(middleware.permission('subcategoria.editar'))
      })
      .prefix('subcategorias')
      .as('subcategorias')
      .use(middleware.auth())
      .use(middleware.account())

    router
      .group(() => {
        router.get('/', [controllers.Elementos, 'index']).use(middleware.permission('elemento.ver'))
        router
          .post('/', [controllers.Elementos, 'store'])
          .use(middleware.permission('elemento.crear'))
        router
          .get(':id', [controllers.Elementos, 'show'])
          .use(middleware.permission('elemento.ver'))
        router
          .get(':id/fotografia', [controllers.Elementos, 'showFoto'])
          .use(middleware.permission('elemento.ver'))
        router
          .post(':id/fotografia', [controllers.Elementos, 'storeFoto'])
          .use(middleware.permission('elemento.editar'))
        router
          .delete(':id/fotografia', [controllers.Elementos, 'destroyFoto'])
          .use(middleware.permission('elemento.editar'))
        router
          .patch(':id', [controllers.Elementos, 'update'])
          .use(middleware.permission('elemento.editar'))
      })
      .prefix('inventario/elementos')
      .as('elementos')
      .use(middleware.auth())
      .use(middleware.account())

    router
      .group(() => {
        router.get('/', [AlertasController, 'index']).use(middleware.permission('alerta.ver'))
      })
      .prefix('inventario/alertas')
      .as('alertas')
      .use(middleware.auth())
      .use(middleware.account())

    router
      .group(() => {
        router.get('/', [controllers.Items, 'index']).use(middleware.permission('item.ver'))
        router.post('/', [controllers.Items, 'store']).use(middleware.permission('item.crear'))
        router.get(':id', [controllers.Items, 'show']).use(middleware.permission('item.ver'))
        router.patch(':id', [controllers.Items, 'update']).use(middleware.permission('item.editar'))
        router
          .delete(':id', [controllers.Items, 'destroy'])
          .use(middleware.permission('item.eliminar'))
      })
      .prefix('inventario/items')
      .as('items')
      .use(middleware.auth())
      .use(middleware.account())

    router
      .group(() => {
        router.get('/', [controllers.Bodega, 'index']).use(middleware.permission('bodega.ver'))
        router.post('/', [controllers.Bodega, 'store']).use(middleware.permission('bodega.crear'))
        router
          .get('sub-bodegas/:id/stands', [controllers.Stand, 'index'])
          .use(middleware.permission('stand.ver'))
        router
          .post('sub-bodegas/:id/stands', [controllers.Stand, 'store'])
          .use(middleware.permission('stand.crear'))
        router
          .get('sub-bodegas/:id', [controllers.SubBodegas, 'show'])
          .use(middleware.permission('bodega.ver'))
        router
          .patch('sub-bodegas/:id', [controllers.SubBodegas, 'update'])
          .use(middleware.permission('bodega.editar'))
        router
          .delete('sub-bodegas/:id', [controllers.SubBodegas, 'destroy'])
          .use(middleware.permission('bodega.eliminar'))
        router
          .get('stands/:id', [controllers.Stand, 'show'])
          .use(middleware.permission('stand.ver'))
        router
          .patch('stands/:id', [controllers.Stand, 'update'])
          .use(middleware.permission('stand.editar'))
        router
          .delete('stands/:id', [controllers.Stand, 'destroy'])
          .use(middleware.permission('stand.eliminar'))
        router
          .get(':id/sub-bodegas', [controllers.SubBodegas, 'index'])
          .use(middleware.permission('bodega.ver'))
        router
          .post(':id/sub-bodegas', [controllers.SubBodegas, 'store'])
          .use(middleware.permission('bodega.crear'))
        router.get(':id', [controllers.Bodega, 'show']).use(middleware.permission('bodega.ver'))
        router
          .patch(':id', [controllers.Bodega, 'update'])
          .use(middleware.permission('bodega.editar'))
        router
          .delete(':id', [controllers.Bodega, 'destroy'])
          .use(middleware.permission('bodega.eliminar'))
      })
      .prefix('bodegas')
      .as('bodegas')
      .use(middleware.auth())
      .use(middleware.account())

    router
      .group(() => {
        router
          .get('/', [controllers.ClasificacionesElemento, 'index'])
          .use(middleware.permission('clasificacion_elemento.ver'))
        router
          .post('/', [controllers.ClasificacionesElemento, 'store'])
          .use(middleware.permission('clasificacion_elemento.crear'))
        router
          .get(':id', [controllers.ClasificacionesElemento, 'show'])
          .use(middleware.permission('clasificacion_elemento.ver'))
        router
          .patch(':id', [controllers.ClasificacionesElemento, 'update'])
          .use(middleware.permission('clasificacion_elemento.editar'))
        router
          .delete(':id', [controllers.ClasificacionesElemento, 'destroy'])
          .use(middleware.permission('clasificacion_elemento.eliminar'))
      })
      .prefix('clasificaciones-elemento')
      .as('clasificacionesElemento')
      .use(middleware.auth())
      .use(middleware.account())

    router
      .group(() => {
        router
          .get('/', [controllers.UsosPresupuestales, 'index'])
          .use(middleware.permission('uso_presupuestal.ver'))
        router
          .post('/', [controllers.UsosPresupuestales, 'store'])
          .use(middleware.permission('uso_presupuestal.crear'))
        router
          .get(':id', [controllers.UsosPresupuestales, 'show'])
          .use(middleware.permission('uso_presupuestal.ver'))
        router
          .patch(':id', [controllers.UsosPresupuestales, 'update'])
          .use(middleware.permission('uso_presupuestal.editar'))
        router
          .delete(':id', [controllers.UsosPresupuestales, 'destroy'])
          .use(middleware.permission('uso_presupuestal.eliminar'))
      })
      .prefix('usos-presupuestales')
      .as('usosPresupuestales')
      .use(middleware.auth())
      .use(middleware.account())

    router
      .group(() => {
        router
          .get('/', [controllers.CodigosEstandar, 'index'])
          .use(middleware.permission('elemento.ver'))
        router
          .post('/', [controllers.CodigosEstandar, 'store'])
          .use(middleware.permission('codigo_estandar.crear'))
        router
          .get(':id', [controllers.CodigosEstandar, 'show'])
          .use(middleware.permission('elemento.ver'))
        router
          .patch(':id', [controllers.CodigosEstandar, 'update'])
          .use(middleware.permission('codigo_estandar.editar'))
        router
          .delete(':id', [controllers.CodigosEstandar, 'destroy'])
          .use(middleware.permission('codigo_estandar.eliminar'))
      })
      .prefix('codigos-estandar')
      .as('codigosEstandar')
      .use(middleware.auth())
      .use(middleware.account())

    router
      .group(() => {
        router
          .get('/', [controllers.UnidadesMedida, 'index'])
          .use(middleware.permission('unidad_medida.ver'))
        router
          .post('/', [controllers.UnidadesMedida, 'store'])
          .use(middleware.permission('unidad_medida.crear'))
        router
          .get(':id', [controllers.UnidadesMedida, 'show'])
          .use(middleware.permission('unidad_medida.ver'))
        router
          .patch(':id', [controllers.UnidadesMedida, 'update'])
          .use(middleware.permission('unidad_medida.editar'))
        router
          .delete(':id', [controllers.UnidadesMedida, 'destroy'])
          .use(middleware.permission('unidad_medida.eliminar'))
      })
      .prefix('unidades-medida')
      .as('unidadesMedida')
      .use(middleware.auth())
      .use(middleware.account())

    router
      .group(() => {
        router.get('/', [controllers.Obras, 'index']).use(middleware.permission('obra.ver'))
        router.post('/', [controllers.Obras, 'store']).use(middleware.permission('obra.crear'))
        router.get(':id', [controllers.Obras, 'show']).use(middleware.permission('obra.ver'))
        router.patch(':id', [controllers.Obras, 'update']).use(middleware.permission('obra.editar'))
        router
          .delete(':id', [controllers.Obras, 'destroy'])
          .use(middleware.permission('obra.eliminar'))
      })
      .prefix('obras')
      .as('obras')
      .use(middleware.auth())
      .use(middleware.account())

    router
      .group(() => {
        router.get('/', [SolicitudesController, 'index'])
        router.post('/', [SolicitudesController, 'store'])
        router.post('bodega', [SolicitudesController, 'registrarEnBodega'])
        router.get('solicitantes/:documento', [SolicitudesController, 'solicitante'])
        router.get(':codigo', [SolicitudesController, 'show'])
      })
      .prefix('solicitudes')
      .as('solicitudes')
      .use(middleware.auth())
      .use(middleware.account())

    router
      .group(() => {
        router.get('/', [EntregasController, 'index'])
      })
      .prefix('entregas')
      .as('entregas')
      .use(middleware.auth())
      .use(middleware.account())

    router
      .group(() => {
        router
          .get('/', [SolicitudEquipoController, 'index'])
          .use(middleware.permission('solicitud_equipo.ver'))
        router
          .post('/', [SolicitudEquipoController, 'store'])
          .use(middleware.permission('solicitud_equipo.crear'))
        router
          .get(':id', [SolicitudEquipoController, 'show'])
          .use(middleware.permission('solicitud_equipo.ver'))
        router
          .patch(':id/entregar', [SolicitudEquipoController, 'entregar'])
          .use(middleware.permission('solicitud_equipo.entregar'))
        router
          .patch(':id/devolver', [SolicitudEquipoController, 'devolver'])
          .use(middleware.permission('solicitud_equipo.devolver'))
      })
      .prefix('solicitudes-equipo')
      .as('solicitudesEquipo')
      .use(middleware.auth())
      .use(middleware.account())

    router
      .group(() => {
        router
          .get('/', [SolicitudMaterialController, 'index'])
          .use(middleware.permission('solicitud_material.ver'))
        router
          .post('/', [SolicitudMaterialController, 'store'])
          .use(middleware.permission('solicitud_material.crear'))
        router
          .get(':id', [SolicitudMaterialController, 'show'])
          .use(middleware.permission('solicitud_material.ver'))
        router
          .patch(':id/entregar', [SolicitudMaterialController, 'entregar'])
          .use(middleware.permission('solicitud_material.entregar'))
      })
      .prefix('solicitudes-material')
      .as('solicitudesMaterial')
      .use(middleware.auth())
      .use(middleware.account())
  })
  .prefix('/api/v1')
