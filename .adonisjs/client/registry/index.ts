/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'auth.new_account.store': {
    methods: ["POST"],
    pattern: '/api/v1/auth/signup',
    tokens: [{"old":"/api/v1/auth/signup","type":0,"val":"api","end":""},{"old":"/api/v1/auth/signup","type":0,"val":"v1","end":""},{"old":"/api/v1/auth/signup","type":0,"val":"auth","end":""},{"old":"/api/v1/auth/signup","type":0,"val":"signup","end":""}],
    types: placeholder as Registry['auth.new_account.store']['types'],
  },
  'auth.access_tokens.store': {
    methods: ["POST"],
    pattern: '/api/v1/auth/login',
    tokens: [{"old":"/api/v1/auth/login","type":0,"val":"api","end":""},{"old":"/api/v1/auth/login","type":0,"val":"v1","end":""},{"old":"/api/v1/auth/login","type":0,"val":"auth","end":""},{"old":"/api/v1/auth/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['auth.access_tokens.store']['types'],
  },
  'account.profile.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/account/profile',
    tokens: [{"old":"/api/v1/account/profile","type":0,"val":"api","end":""},{"old":"/api/v1/account/profile","type":0,"val":"v1","end":""},{"old":"/api/v1/account/profile","type":0,"val":"account","end":""},{"old":"/api/v1/account/profile","type":0,"val":"profile","end":""}],
    types: placeholder as Registry['account.profile.show']['types'],
  },
  'account.profile.update': {
    methods: ["PATCH"],
    pattern: '/api/v1/account/profile',
    tokens: [{"old":"/api/v1/account/profile","type":0,"val":"api","end":""},{"old":"/api/v1/account/profile","type":0,"val":"v1","end":""},{"old":"/api/v1/account/profile","type":0,"val":"account","end":""},{"old":"/api/v1/account/profile","type":0,"val":"profile","end":""}],
    types: placeholder as Registry['account.profile.update']['types'],
  },
  'account.profile.change_password': {
    methods: ["PATCH"],
    pattern: '/api/v1/account/password',
    tokens: [{"old":"/api/v1/account/password","type":0,"val":"api","end":""},{"old":"/api/v1/account/password","type":0,"val":"v1","end":""},{"old":"/api/v1/account/password","type":0,"val":"account","end":""},{"old":"/api/v1/account/password","type":0,"val":"password","end":""}],
    types: placeholder as Registry['account.profile.change_password']['types'],
  },
  'account.access_tokens.destroy': {
    methods: ["POST"],
    pattern: '/api/v1/account/logout',
    tokens: [{"old":"/api/v1/account/logout","type":0,"val":"api","end":""},{"old":"/api/v1/account/logout","type":0,"val":"v1","end":""},{"old":"/api/v1/account/logout","type":0,"val":"account","end":""},{"old":"/api/v1/account/logout","type":0,"val":"logout","end":""}],
    types: placeholder as Registry['account.access_tokens.destroy']['types'],
  },
  'modules.modules.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/modules',
    tokens: [{"old":"/api/v1/modules","type":0,"val":"api","end":""},{"old":"/api/v1/modules","type":0,"val":"v1","end":""},{"old":"/api/v1/modules","type":0,"val":"modules","end":""}],
    types: placeholder as Registry['modules.modules.index']['types'],
  },
  'modules.modules.tree': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/modules/tree',
    tokens: [{"old":"/api/v1/modules/tree","type":0,"val":"api","end":""},{"old":"/api/v1/modules/tree","type":0,"val":"v1","end":""},{"old":"/api/v1/modules/tree","type":0,"val":"modules","end":""},{"old":"/api/v1/modules/tree","type":0,"val":"tree","end":""}],
    types: placeholder as Registry['modules.modules.tree']['types'],
  },
  'modules.modules.catalog': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/modules/catalog',
    tokens: [{"old":"/api/v1/modules/catalog","type":0,"val":"api","end":""},{"old":"/api/v1/modules/catalog","type":0,"val":"v1","end":""},{"old":"/api/v1/modules/catalog","type":0,"val":"modules","end":""},{"old":"/api/v1/modules/catalog","type":0,"val":"catalog","end":""}],
    types: placeholder as Registry['modules.modules.catalog']['types'],
  },
  'modules.modules.store': {
    methods: ["POST"],
    pattern: '/api/v1/modules/catalog',
    tokens: [{"old":"/api/v1/modules/catalog","type":0,"val":"api","end":""},{"old":"/api/v1/modules/catalog","type":0,"val":"v1","end":""},{"old":"/api/v1/modules/catalog","type":0,"val":"modules","end":""},{"old":"/api/v1/modules/catalog","type":0,"val":"catalog","end":""}],
    types: placeholder as Registry['modules.modules.store']['types'],
  },
  'roles.roles.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/roles',
    tokens: [{"old":"/api/v1/roles","type":0,"val":"api","end":""},{"old":"/api/v1/roles","type":0,"val":"v1","end":""},{"old":"/api/v1/roles","type":0,"val":"roles","end":""}],
    types: placeholder as Registry['roles.roles.index']['types'],
  },
  'roles.roles.store': {
    methods: ["POST"],
    pattern: '/api/v1/roles',
    tokens: [{"old":"/api/v1/roles","type":0,"val":"api","end":""},{"old":"/api/v1/roles","type":0,"val":"v1","end":""},{"old":"/api/v1/roles","type":0,"val":"roles","end":""}],
    types: placeholder as Registry['roles.roles.store']['types'],
  },
  'roles.roles.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/roles/:id',
    tokens: [{"old":"/api/v1/roles/:id","type":0,"val":"api","end":""},{"old":"/api/v1/roles/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/roles/:id","type":0,"val":"roles","end":""},{"old":"/api/v1/roles/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['roles.roles.show']['types'],
  },
  'roles.roles.update': {
    methods: ["PATCH"],
    pattern: '/api/v1/roles/:id',
    tokens: [{"old":"/api/v1/roles/:id","type":0,"val":"api","end":""},{"old":"/api/v1/roles/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/roles/:id","type":0,"val":"roles","end":""},{"old":"/api/v1/roles/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['roles.roles.update']['types'],
  },
  'roles.roles.sync_modules': {
    methods: ["PUT"],
    pattern: '/api/v1/roles/:id/modules',
    tokens: [{"old":"/api/v1/roles/:id/modules","type":0,"val":"api","end":""},{"old":"/api/v1/roles/:id/modules","type":0,"val":"v1","end":""},{"old":"/api/v1/roles/:id/modules","type":0,"val":"roles","end":""},{"old":"/api/v1/roles/:id/modules","type":1,"val":"id","end":""},{"old":"/api/v1/roles/:id/modules","type":0,"val":"modules","end":""}],
    types: placeholder as Registry['roles.roles.sync_modules']['types'],
  },
  'users.users.options': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/users/options',
    tokens: [{"old":"/api/v1/users/options","type":0,"val":"api","end":""},{"old":"/api/v1/users/options","type":0,"val":"v1","end":""},{"old":"/api/v1/users/options","type":0,"val":"users","end":""},{"old":"/api/v1/users/options","type":0,"val":"options","end":""}],
    types: placeholder as Registry['users.users.options']['types'],
  },
  'users.users.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/users',
    tokens: [{"old":"/api/v1/users","type":0,"val":"api","end":""},{"old":"/api/v1/users","type":0,"val":"v1","end":""},{"old":"/api/v1/users","type":0,"val":"users","end":""}],
    types: placeholder as Registry['users.users.index']['types'],
  },
  'users.users.store': {
    methods: ["POST"],
    pattern: '/api/v1/users',
    tokens: [{"old":"/api/v1/users","type":0,"val":"api","end":""},{"old":"/api/v1/users","type":0,"val":"v1","end":""},{"old":"/api/v1/users","type":0,"val":"users","end":""}],
    types: placeholder as Registry['users.users.store']['types'],
  },
  'users.users.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/users/:id',
    tokens: [{"old":"/api/v1/users/:id","type":0,"val":"api","end":""},{"old":"/api/v1/users/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/users/:id","type":0,"val":"users","end":""},{"old":"/api/v1/users/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['users.users.show']['types'],
  },
  'users.users.update': {
    methods: ["PATCH"],
    pattern: '/api/v1/users/:id',
    tokens: [{"old":"/api/v1/users/:id","type":0,"val":"api","end":""},{"old":"/api/v1/users/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/users/:id","type":0,"val":"users","end":""},{"old":"/api/v1/users/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['users.users.update']['types'],
  },
  'categorias.categorias.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/categorias',
    tokens: [{"old":"/api/v1/categorias","type":0,"val":"api","end":""},{"old":"/api/v1/categorias","type":0,"val":"v1","end":""},{"old":"/api/v1/categorias","type":0,"val":"categorias","end":""}],
    types: placeholder as Registry['categorias.categorias.index']['types'],
  },
  'categorias.categorias.store': {
    methods: ["POST"],
    pattern: '/api/v1/categorias',
    tokens: [{"old":"/api/v1/categorias","type":0,"val":"api","end":""},{"old":"/api/v1/categorias","type":0,"val":"v1","end":""},{"old":"/api/v1/categorias","type":0,"val":"categorias","end":""}],
    types: placeholder as Registry['categorias.categorias.store']['types'],
  },
  'categorias.categorias.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/categorias/:id',
    tokens: [{"old":"/api/v1/categorias/:id","type":0,"val":"api","end":""},{"old":"/api/v1/categorias/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/categorias/:id","type":0,"val":"categorias","end":""},{"old":"/api/v1/categorias/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['categorias.categorias.show']['types'],
  },
  'categorias.categorias.update': {
    methods: ["PATCH"],
    pattern: '/api/v1/categorias/:id',
    tokens: [{"old":"/api/v1/categorias/:id","type":0,"val":"api","end":""},{"old":"/api/v1/categorias/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/categorias/:id","type":0,"val":"categorias","end":""},{"old":"/api/v1/categorias/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['categorias.categorias.update']['types'],
  },
  'subcategorias.subcategorias.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/subcategorias',
    tokens: [{"old":"/api/v1/subcategorias","type":0,"val":"api","end":""},{"old":"/api/v1/subcategorias","type":0,"val":"v1","end":""},{"old":"/api/v1/subcategorias","type":0,"val":"subcategorias","end":""}],
    types: placeholder as Registry['subcategorias.subcategorias.index']['types'],
  },
  'subcategorias.subcategorias.store': {
    methods: ["POST"],
    pattern: '/api/v1/subcategorias',
    tokens: [{"old":"/api/v1/subcategorias","type":0,"val":"api","end":""},{"old":"/api/v1/subcategorias","type":0,"val":"v1","end":""},{"old":"/api/v1/subcategorias","type":0,"val":"subcategorias","end":""}],
    types: placeholder as Registry['subcategorias.subcategorias.store']['types'],
  },
  'subcategorias.subcategorias.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/subcategorias/:id',
    tokens: [{"old":"/api/v1/subcategorias/:id","type":0,"val":"api","end":""},{"old":"/api/v1/subcategorias/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/subcategorias/:id","type":0,"val":"subcategorias","end":""},{"old":"/api/v1/subcategorias/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['subcategorias.subcategorias.show']['types'],
  },
  'subcategorias.subcategorias.update': {
    methods: ["PATCH"],
    pattern: '/api/v1/subcategorias/:id',
    tokens: [{"old":"/api/v1/subcategorias/:id","type":0,"val":"api","end":""},{"old":"/api/v1/subcategorias/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/subcategorias/:id","type":0,"val":"subcategorias","end":""},{"old":"/api/v1/subcategorias/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['subcategorias.subcategorias.update']['types'],
  },
  'bodegas.bodega.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/bodegas',
    tokens: [{"old":"/api/v1/bodegas","type":0,"val":"api","end":""},{"old":"/api/v1/bodegas","type":0,"val":"v1","end":""},{"old":"/api/v1/bodegas","type":0,"val":"bodegas","end":""}],
    types: placeholder as Registry['bodegas.bodega.index']['types'],
  },
  'bodegas.bodega.store': {
    methods: ["POST"],
    pattern: '/api/v1/bodegas',
    tokens: [{"old":"/api/v1/bodegas","type":0,"val":"api","end":""},{"old":"/api/v1/bodegas","type":0,"val":"v1","end":""},{"old":"/api/v1/bodegas","type":0,"val":"bodegas","end":""}],
    types: placeholder as Registry['bodegas.bodega.store']['types'],
  },
  'bodegas.bodega.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/bodegas/:id',
    tokens: [{"old":"/api/v1/bodegas/:id","type":0,"val":"api","end":""},{"old":"/api/v1/bodegas/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/bodegas/:id","type":0,"val":"bodegas","end":""},{"old":"/api/v1/bodegas/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['bodegas.bodega.show']['types'],
  },
  'bodegas.bodega.update': {
    methods: ["PATCH"],
    pattern: '/api/v1/bodegas/:id',
    tokens: [{"old":"/api/v1/bodegas/:id","type":0,"val":"api","end":""},{"old":"/api/v1/bodegas/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/bodegas/:id","type":0,"val":"bodegas","end":""},{"old":"/api/v1/bodegas/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['bodegas.bodega.update']['types'],
  },
  'bodegas.bodega.destroy': {
    methods: ["DELETE"],
    pattern: '/api/v1/bodegas/:id',
    tokens: [{"old":"/api/v1/bodegas/:id","type":0,"val":"api","end":""},{"old":"/api/v1/bodegas/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/bodegas/:id","type":0,"val":"bodegas","end":""},{"old":"/api/v1/bodegas/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['bodegas.bodega.destroy']['types'],
  },
  'bodegas.stand.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/bodegas/:id_bodega/stands',
    tokens: [{"old":"/api/v1/bodegas/:id_bodega/stands","type":0,"val":"api","end":""},{"old":"/api/v1/bodegas/:id_bodega/stands","type":0,"val":"v1","end":""},{"old":"/api/v1/bodegas/:id_bodega/stands","type":0,"val":"bodegas","end":""},{"old":"/api/v1/bodegas/:id_bodega/stands","type":1,"val":"id_bodega","end":""},{"old":"/api/v1/bodegas/:id_bodega/stands","type":0,"val":"stands","end":""}],
    types: placeholder as Registry['bodegas.stand.index']['types'],
  },
  'bodegas.stand.store': {
    methods: ["POST"],
    pattern: '/api/v1/bodegas/:id_bodega/stands',
    tokens: [{"old":"/api/v1/bodegas/:id_bodega/stands","type":0,"val":"api","end":""},{"old":"/api/v1/bodegas/:id_bodega/stands","type":0,"val":"v1","end":""},{"old":"/api/v1/bodegas/:id_bodega/stands","type":0,"val":"bodegas","end":""},{"old":"/api/v1/bodegas/:id_bodega/stands","type":1,"val":"id_bodega","end":""},{"old":"/api/v1/bodegas/:id_bodega/stands","type":0,"val":"stands","end":""}],
    types: placeholder as Registry['bodegas.stand.store']['types'],
  },
  'bodegas.stand.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/bodegas/stands/:id',
    tokens: [{"old":"/api/v1/bodegas/stands/:id","type":0,"val":"api","end":""},{"old":"/api/v1/bodegas/stands/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/bodegas/stands/:id","type":0,"val":"bodegas","end":""},{"old":"/api/v1/bodegas/stands/:id","type":0,"val":"stands","end":""},{"old":"/api/v1/bodegas/stands/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['bodegas.stand.show']['types'],
  },
  'bodegas.stand.update': {
    methods: ["PATCH"],
    pattern: '/api/v1/bodegas/stands/:id',
    tokens: [{"old":"/api/v1/bodegas/stands/:id","type":0,"val":"api","end":""},{"old":"/api/v1/bodegas/stands/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/bodegas/stands/:id","type":0,"val":"bodegas","end":""},{"old":"/api/v1/bodegas/stands/:id","type":0,"val":"stands","end":""},{"old":"/api/v1/bodegas/stands/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['bodegas.stand.update']['types'],
  },
  'bodegas.stand.destroy': {
    methods: ["DELETE"],
    pattern: '/api/v1/bodegas/stands/:id',
    tokens: [{"old":"/api/v1/bodegas/stands/:id","type":0,"val":"api","end":""},{"old":"/api/v1/bodegas/stands/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/bodegas/stands/:id","type":0,"val":"bodegas","end":""},{"old":"/api/v1/bodegas/stands/:id","type":0,"val":"stands","end":""},{"old":"/api/v1/bodegas/stands/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['bodegas.stand.destroy']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
