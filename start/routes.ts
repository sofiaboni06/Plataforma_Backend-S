import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'

router.get('/', () => {
  return { hello: 'world' }
})

router
  .group(() => {
    router
      .group(() => {
        router.post('signup', [controllers.NewAccount, 'store'])
        router.post('login', [controllers.AccessTokens, 'store'])
      })
      .prefix('auth')
      .as('auth')

    router
      .group(() => {
        router.get('profile', [controllers.Profile, 'show'])
        router.patch('profile', [controllers.Profile, 'update'])
        router.patch('password', [controllers.Profile, 'changePassword'])
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
      })
      .prefix('users')
      .as('users')
      .use(middleware.auth())
      .use(middleware.account())
      .use(middleware.admin())

    router
      .group(() => {
        router.get('/', [controllers.Categorias, 'index'])
        router.post('/', [controllers.Categorias, 'store'])
        router.get(':id', [controllers.Categorias, 'show'])
        router.patch(':id', [controllers.Categorias, 'update'])
      })
      .prefix('categorias')
      .as('categorias')
      .use(middleware.auth())
      .use(middleware.account())

    router
      .group(() => {
        router.get('/', [controllers.Subcategorias, 'index'])
        router.post('/', [controllers.Subcategorias, 'store'])
        router.get(':id', [controllers.Subcategorias, 'show'])
        router.patch(':id', [controllers.Subcategorias, 'update'])
      })
      .prefix('subcategorias')
      .as('subcategorias')
      .use(middleware.auth())
      .use(middleware.account())

    router
      .group(() => {
        router.get('/', [controllers.Elementos, 'index'])
        router.post('/', [controllers.Elementos, 'store'])
        router.get(':id', [controllers.Elementos, 'show'])
        router.patch(':id', [controllers.Elementos, 'update'])
      })
      .prefix('inventario/elementos')
      .as('elementos')
      .use(middleware.auth())
      .use(middleware.account())

    router
      .group(() => {
        router.get('/', [controllers.Bodega, 'index'])
        router.post('/', [controllers.Bodega, 'store'])
        router.get(':id/stands', [controllers.Stand, 'index'])
        router.post(':id/stands', [controllers.Stand, 'store'])
        router.get('stands/:id', [controllers.Stand, 'show'])
        router.patch('stands/:id', [controllers.Stand, 'update'])
        router.delete('stands/:id', [controllers.Stand, 'destroy'])
        router.get(':id', [controllers.Bodega, 'show'])
        router.patch(':id', [controllers.Bodega, 'update'])
        router.delete(':id', [controllers.Bodega, 'destroy'])
      })
      .prefix('bodegas')
      .as('bodegas')
      .use(middleware.auth())
      .use(middleware.account())

    router
      .group(() => {
        router.get('/', [controllers.UnidadesMedida, 'index'])
        router.get(':id', [controllers.UnidadesMedida, 'show'])
      })
      .prefix('unidades-medida')
      .as('unidadesMedida')
      .use(middleware.auth())
      .use(middleware.account())
  })
  .prefix('/api/v1')
