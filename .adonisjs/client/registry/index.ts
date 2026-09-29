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
  'roles.roles.sync_permissions': {
    methods: ["PUT"],
    pattern: '/api/v1/roles/:id/permissions',
    tokens: [{"old":"/api/v1/roles/:id/permissions","type":0,"val":"api","end":""},{"old":"/api/v1/roles/:id/permissions","type":0,"val":"v1","end":""},{"old":"/api/v1/roles/:id/permissions","type":0,"val":"roles","end":""},{"old":"/api/v1/roles/:id/permissions","type":1,"val":"id","end":""},{"old":"/api/v1/roles/:id/permissions","type":0,"val":"permissions","end":""}],
    types: placeholder as Registry['roles.roles.sync_permissions']['types'],
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
  'users.users.sync_bodegas': {
    methods: ["PUT"],
    pattern: '/api/v1/users/:id/bodegas',
    tokens: [{"old":"/api/v1/users/:id/bodegas","type":0,"val":"api","end":""},{"old":"/api/v1/users/:id/bodegas","type":0,"val":"v1","end":""},{"old":"/api/v1/users/:id/bodegas","type":0,"val":"users","end":""},{"old":"/api/v1/users/:id/bodegas","type":1,"val":"id","end":""},{"old":"/api/v1/users/:id/bodegas","type":0,"val":"bodegas","end":""}],
    types: placeholder as Registry['users.users.sync_bodegas']['types'],
  },
  'permissions.permissions.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/permissions',
    tokens: [{"old":"/api/v1/permissions","type":0,"val":"api","end":""},{"old":"/api/v1/permissions","type":0,"val":"v1","end":""},{"old":"/api/v1/permissions","type":0,"val":"permissions","end":""}],
    types: placeholder as Registry['permissions.permissions.index']['types'],
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
  'categorias.categorias.destroy': {
    methods: ["DELETE"],
    pattern: '/api/v1/categorias/:id',
    tokens: [{"old":"/api/v1/categorias/:id","type":0,"val":"api","end":""},{"old":"/api/v1/categorias/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/categorias/:id","type":0,"val":"categorias","end":""},{"old":"/api/v1/categorias/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['categorias.categorias.destroy']['types'],
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
  'elementos.elementos.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/inventario/elementos',
    tokens: [{"old":"/api/v1/inventario/elementos","type":0,"val":"api","end":""},{"old":"/api/v1/inventario/elementos","type":0,"val":"v1","end":""},{"old":"/api/v1/inventario/elementos","type":0,"val":"inventario","end":""},{"old":"/api/v1/inventario/elementos","type":0,"val":"elementos","end":""}],
    types: placeholder as Registry['elementos.elementos.index']['types'],
  },
  'elementos.elementos.store': {
    methods: ["POST"],
    pattern: '/api/v1/inventario/elementos',
    tokens: [{"old":"/api/v1/inventario/elementos","type":0,"val":"api","end":""},{"old":"/api/v1/inventario/elementos","type":0,"val":"v1","end":""},{"old":"/api/v1/inventario/elementos","type":0,"val":"inventario","end":""},{"old":"/api/v1/inventario/elementos","type":0,"val":"elementos","end":""}],
    types: placeholder as Registry['elementos.elementos.store']['types'],
  },
  'elementos.elementos.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/inventario/elementos/:id',
    tokens: [{"old":"/api/v1/inventario/elementos/:id","type":0,"val":"api","end":""},{"old":"/api/v1/inventario/elementos/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/inventario/elementos/:id","type":0,"val":"inventario","end":""},{"old":"/api/v1/inventario/elementos/:id","type":0,"val":"elementos","end":""},{"old":"/api/v1/inventario/elementos/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['elementos.elementos.show']['types'],
  },
  'elementos.elementos.show_foto': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/inventario/elementos/:id/fotografia',
    tokens: [{"old":"/api/v1/inventario/elementos/:id/fotografia","type":0,"val":"api","end":""},{"old":"/api/v1/inventario/elementos/:id/fotografia","type":0,"val":"v1","end":""},{"old":"/api/v1/inventario/elementos/:id/fotografia","type":0,"val":"inventario","end":""},{"old":"/api/v1/inventario/elementos/:id/fotografia","type":0,"val":"elementos","end":""},{"old":"/api/v1/inventario/elementos/:id/fotografia","type":1,"val":"id","end":""},{"old":"/api/v1/inventario/elementos/:id/fotografia","type":0,"val":"fotografia","end":""}],
    types: placeholder as Registry['elementos.elementos.show_foto']['types'],
  },
  'elementos.elementos.store_foto': {
    methods: ["POST"],
    pattern: '/api/v1/inventario/elementos/:id/fotografia',
    tokens: [{"old":"/api/v1/inventario/elementos/:id/fotografia","type":0,"val":"api","end":""},{"old":"/api/v1/inventario/elementos/:id/fotografia","type":0,"val":"v1","end":""},{"old":"/api/v1/inventario/elementos/:id/fotografia","type":0,"val":"inventario","end":""},{"old":"/api/v1/inventario/elementos/:id/fotografia","type":0,"val":"elementos","end":""},{"old":"/api/v1/inventario/elementos/:id/fotografia","type":1,"val":"id","end":""},{"old":"/api/v1/inventario/elementos/:id/fotografia","type":0,"val":"fotografia","end":""}],
    types: placeholder as Registry['elementos.elementos.store_foto']['types'],
  },
  'elementos.elementos.destroy_foto': {
    methods: ["DELETE"],
    pattern: '/api/v1/inventario/elementos/:id/fotografia',
    tokens: [{"old":"/api/v1/inventario/elementos/:id/fotografia","type":0,"val":"api","end":""},{"old":"/api/v1/inventario/elementos/:id/fotografia","type":0,"val":"v1","end":""},{"old":"/api/v1/inventario/elementos/:id/fotografia","type":0,"val":"inventario","end":""},{"old":"/api/v1/inventario/elementos/:id/fotografia","type":0,"val":"elementos","end":""},{"old":"/api/v1/inventario/elementos/:id/fotografia","type":1,"val":"id","end":""},{"old":"/api/v1/inventario/elementos/:id/fotografia","type":0,"val":"fotografia","end":""}],
    types: placeholder as Registry['elementos.elementos.destroy_foto']['types'],
  },
  'elementos.elementos.update': {
    methods: ["PATCH"],
    pattern: '/api/v1/inventario/elementos/:id',
    tokens: [{"old":"/api/v1/inventario/elementos/:id","type":0,"val":"api","end":""},{"old":"/api/v1/inventario/elementos/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/inventario/elementos/:id","type":0,"val":"inventario","end":""},{"old":"/api/v1/inventario/elementos/:id","type":0,"val":"elementos","end":""},{"old":"/api/v1/inventario/elementos/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['elementos.elementos.update']['types'],
  },
  'items.items.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/inventario/items',
    tokens: [{"old":"/api/v1/inventario/items","type":0,"val":"api","end":""},{"old":"/api/v1/inventario/items","type":0,"val":"v1","end":""},{"old":"/api/v1/inventario/items","type":0,"val":"inventario","end":""},{"old":"/api/v1/inventario/items","type":0,"val":"items","end":""}],
    types: placeholder as Registry['items.items.index']['types'],
  },
  'items.items.store': {
    methods: ["POST"],
    pattern: '/api/v1/inventario/items',
    tokens: [{"old":"/api/v1/inventario/items","type":0,"val":"api","end":""},{"old":"/api/v1/inventario/items","type":0,"val":"v1","end":""},{"old":"/api/v1/inventario/items","type":0,"val":"inventario","end":""},{"old":"/api/v1/inventario/items","type":0,"val":"items","end":""}],
    types: placeholder as Registry['items.items.store']['types'],
  },
  'items.items.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/inventario/items/:id',
    tokens: [{"old":"/api/v1/inventario/items/:id","type":0,"val":"api","end":""},{"old":"/api/v1/inventario/items/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/inventario/items/:id","type":0,"val":"inventario","end":""},{"old":"/api/v1/inventario/items/:id","type":0,"val":"items","end":""},{"old":"/api/v1/inventario/items/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['items.items.show']['types'],
  },
  'items.items.update': {
    methods: ["PATCH"],
    pattern: '/api/v1/inventario/items/:id',
    tokens: [{"old":"/api/v1/inventario/items/:id","type":0,"val":"api","end":""},{"old":"/api/v1/inventario/items/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/inventario/items/:id","type":0,"val":"inventario","end":""},{"old":"/api/v1/inventario/items/:id","type":0,"val":"items","end":""},{"old":"/api/v1/inventario/items/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['items.items.update']['types'],
  },
  'items.items.destroy': {
    methods: ["DELETE"],
    pattern: '/api/v1/inventario/items/:id',
    tokens: [{"old":"/api/v1/inventario/items/:id","type":0,"val":"api","end":""},{"old":"/api/v1/inventario/items/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/inventario/items/:id","type":0,"val":"inventario","end":""},{"old":"/api/v1/inventario/items/:id","type":0,"val":"items","end":""},{"old":"/api/v1/inventario/items/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['items.items.destroy']['types'],
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
  'bodegas.stand.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/bodegas/sub-bodegas/:id/stands',
    tokens: [{"old":"/api/v1/bodegas/sub-bodegas/:id/stands","type":0,"val":"api","end":""},{"old":"/api/v1/bodegas/sub-bodegas/:id/stands","type":0,"val":"v1","end":""},{"old":"/api/v1/bodegas/sub-bodegas/:id/stands","type":0,"val":"bodegas","end":""},{"old":"/api/v1/bodegas/sub-bodegas/:id/stands","type":0,"val":"sub-bodegas","end":""},{"old":"/api/v1/bodegas/sub-bodegas/:id/stands","type":1,"val":"id","end":""},{"old":"/api/v1/bodegas/sub-bodegas/:id/stands","type":0,"val":"stands","end":""}],
    types: placeholder as Registry['bodegas.stand.index']['types'],
  },
  'bodegas.stand.store': {
    methods: ["POST"],
    pattern: '/api/v1/bodegas/sub-bodegas/:id/stands',
    tokens: [{"old":"/api/v1/bodegas/sub-bodegas/:id/stands","type":0,"val":"api","end":""},{"old":"/api/v1/bodegas/sub-bodegas/:id/stands","type":0,"val":"v1","end":""},{"old":"/api/v1/bodegas/sub-bodegas/:id/stands","type":0,"val":"bodegas","end":""},{"old":"/api/v1/bodegas/sub-bodegas/:id/stands","type":0,"val":"sub-bodegas","end":""},{"old":"/api/v1/bodegas/sub-bodegas/:id/stands","type":1,"val":"id","end":""},{"old":"/api/v1/bodegas/sub-bodegas/:id/stands","type":0,"val":"stands","end":""}],
    types: placeholder as Registry['bodegas.stand.store']['types'],
  },
  'bodegas.sub_bodegas.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/bodegas/sub-bodegas/:id',
    tokens: [{"old":"/api/v1/bodegas/sub-bodegas/:id","type":0,"val":"api","end":""},{"old":"/api/v1/bodegas/sub-bodegas/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/bodegas/sub-bodegas/:id","type":0,"val":"bodegas","end":""},{"old":"/api/v1/bodegas/sub-bodegas/:id","type":0,"val":"sub-bodegas","end":""},{"old":"/api/v1/bodegas/sub-bodegas/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['bodegas.sub_bodegas.show']['types'],
  },
  'bodegas.sub_bodegas.update': {
    methods: ["PATCH"],
    pattern: '/api/v1/bodegas/sub-bodegas/:id',
    tokens: [{"old":"/api/v1/bodegas/sub-bodegas/:id","type":0,"val":"api","end":""},{"old":"/api/v1/bodegas/sub-bodegas/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/bodegas/sub-bodegas/:id","type":0,"val":"bodegas","end":""},{"old":"/api/v1/bodegas/sub-bodegas/:id","type":0,"val":"sub-bodegas","end":""},{"old":"/api/v1/bodegas/sub-bodegas/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['bodegas.sub_bodegas.update']['types'],
  },
  'bodegas.sub_bodegas.destroy': {
    methods: ["DELETE"],
    pattern: '/api/v1/bodegas/sub-bodegas/:id',
    tokens: [{"old":"/api/v1/bodegas/sub-bodegas/:id","type":0,"val":"api","end":""},{"old":"/api/v1/bodegas/sub-bodegas/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/bodegas/sub-bodegas/:id","type":0,"val":"bodegas","end":""},{"old":"/api/v1/bodegas/sub-bodegas/:id","type":0,"val":"sub-bodegas","end":""},{"old":"/api/v1/bodegas/sub-bodegas/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['bodegas.sub_bodegas.destroy']['types'],
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
  'bodegas.sub_bodegas.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/bodegas/:id/sub-bodegas',
    tokens: [{"old":"/api/v1/bodegas/:id/sub-bodegas","type":0,"val":"api","end":""},{"old":"/api/v1/bodegas/:id/sub-bodegas","type":0,"val":"v1","end":""},{"old":"/api/v1/bodegas/:id/sub-bodegas","type":0,"val":"bodegas","end":""},{"old":"/api/v1/bodegas/:id/sub-bodegas","type":1,"val":"id","end":""},{"old":"/api/v1/bodegas/:id/sub-bodegas","type":0,"val":"sub-bodegas","end":""}],
    types: placeholder as Registry['bodegas.sub_bodegas.index']['types'],
  },
  'bodegas.sub_bodegas.store': {
    methods: ["POST"],
    pattern: '/api/v1/bodegas/:id/sub-bodegas',
    tokens: [{"old":"/api/v1/bodegas/:id/sub-bodegas","type":0,"val":"api","end":""},{"old":"/api/v1/bodegas/:id/sub-bodegas","type":0,"val":"v1","end":""},{"old":"/api/v1/bodegas/:id/sub-bodegas","type":0,"val":"bodegas","end":""},{"old":"/api/v1/bodegas/:id/sub-bodegas","type":1,"val":"id","end":""},{"old":"/api/v1/bodegas/:id/sub-bodegas","type":0,"val":"sub-bodegas","end":""}],
    types: placeholder as Registry['bodegas.sub_bodegas.store']['types'],
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
  'clasificacionesElemento.clasificaciones_elemento.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/clasificaciones-elemento',
    tokens: [{"old":"/api/v1/clasificaciones-elemento","type":0,"val":"api","end":""},{"old":"/api/v1/clasificaciones-elemento","type":0,"val":"v1","end":""},{"old":"/api/v1/clasificaciones-elemento","type":0,"val":"clasificaciones-elemento","end":""}],
    types: placeholder as Registry['clasificacionesElemento.clasificaciones_elemento.index']['types'],
  },
  'clasificacionesElemento.clasificaciones_elemento.store': {
    methods: ["POST"],
    pattern: '/api/v1/clasificaciones-elemento',
    tokens: [{"old":"/api/v1/clasificaciones-elemento","type":0,"val":"api","end":""},{"old":"/api/v1/clasificaciones-elemento","type":0,"val":"v1","end":""},{"old":"/api/v1/clasificaciones-elemento","type":0,"val":"clasificaciones-elemento","end":""}],
    types: placeholder as Registry['clasificacionesElemento.clasificaciones_elemento.store']['types'],
  },
  'clasificacionesElemento.clasificaciones_elemento.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/clasificaciones-elemento/:id',
    tokens: [{"old":"/api/v1/clasificaciones-elemento/:id","type":0,"val":"api","end":""},{"old":"/api/v1/clasificaciones-elemento/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/clasificaciones-elemento/:id","type":0,"val":"clasificaciones-elemento","end":""},{"old":"/api/v1/clasificaciones-elemento/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['clasificacionesElemento.clasificaciones_elemento.show']['types'],
  },
  'clasificacionesElemento.clasificaciones_elemento.update': {
    methods: ["PATCH"],
    pattern: '/api/v1/clasificaciones-elemento/:id',
    tokens: [{"old":"/api/v1/clasificaciones-elemento/:id","type":0,"val":"api","end":""},{"old":"/api/v1/clasificaciones-elemento/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/clasificaciones-elemento/:id","type":0,"val":"clasificaciones-elemento","end":""},{"old":"/api/v1/clasificaciones-elemento/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['clasificacionesElemento.clasificaciones_elemento.update']['types'],
  },
  'clasificacionesElemento.clasificaciones_elemento.destroy': {
    methods: ["DELETE"],
    pattern: '/api/v1/clasificaciones-elemento/:id',
    tokens: [{"old":"/api/v1/clasificaciones-elemento/:id","type":0,"val":"api","end":""},{"old":"/api/v1/clasificaciones-elemento/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/clasificaciones-elemento/:id","type":0,"val":"clasificaciones-elemento","end":""},{"old":"/api/v1/clasificaciones-elemento/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['clasificacionesElemento.clasificaciones_elemento.destroy']['types'],
  },
  'usosPresupuestales.usos_presupuestales.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/usos-presupuestales',
    tokens: [{"old":"/api/v1/usos-presupuestales","type":0,"val":"api","end":""},{"old":"/api/v1/usos-presupuestales","type":0,"val":"v1","end":""},{"old":"/api/v1/usos-presupuestales","type":0,"val":"usos-presupuestales","end":""}],
    types: placeholder as Registry['usosPresupuestales.usos_presupuestales.index']['types'],
  },
  'usosPresupuestales.usos_presupuestales.store': {
    methods: ["POST"],
    pattern: '/api/v1/usos-presupuestales',
    tokens: [{"old":"/api/v1/usos-presupuestales","type":0,"val":"api","end":""},{"old":"/api/v1/usos-presupuestales","type":0,"val":"v1","end":""},{"old":"/api/v1/usos-presupuestales","type":0,"val":"usos-presupuestales","end":""}],
    types: placeholder as Registry['usosPresupuestales.usos_presupuestales.store']['types'],
  },
  'usosPresupuestales.usos_presupuestales.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/usos-presupuestales/:id',
    tokens: [{"old":"/api/v1/usos-presupuestales/:id","type":0,"val":"api","end":""},{"old":"/api/v1/usos-presupuestales/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/usos-presupuestales/:id","type":0,"val":"usos-presupuestales","end":""},{"old":"/api/v1/usos-presupuestales/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['usosPresupuestales.usos_presupuestales.show']['types'],
  },
  'usosPresupuestales.usos_presupuestales.update': {
    methods: ["PATCH"],
    pattern: '/api/v1/usos-presupuestales/:id',
    tokens: [{"old":"/api/v1/usos-presupuestales/:id","type":0,"val":"api","end":""},{"old":"/api/v1/usos-presupuestales/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/usos-presupuestales/:id","type":0,"val":"usos-presupuestales","end":""},{"old":"/api/v1/usos-presupuestales/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['usosPresupuestales.usos_presupuestales.update']['types'],
  },
  'usosPresupuestales.usos_presupuestales.destroy': {
    methods: ["DELETE"],
    pattern: '/api/v1/usos-presupuestales/:id',
    tokens: [{"old":"/api/v1/usos-presupuestales/:id","type":0,"val":"api","end":""},{"old":"/api/v1/usos-presupuestales/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/usos-presupuestales/:id","type":0,"val":"usos-presupuestales","end":""},{"old":"/api/v1/usos-presupuestales/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['usosPresupuestales.usos_presupuestales.destroy']['types'],
  },
  'codigosEstandar.codigos_estandar.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/codigos-estandar',
    tokens: [{"old":"/api/v1/codigos-estandar","type":0,"val":"api","end":""},{"old":"/api/v1/codigos-estandar","type":0,"val":"v1","end":""},{"old":"/api/v1/codigos-estandar","type":0,"val":"codigos-estandar","end":""}],
    types: placeholder as Registry['codigosEstandar.codigos_estandar.index']['types'],
  },
  'codigosEstandar.codigos_estandar.store': {
    methods: ["POST"],
    pattern: '/api/v1/codigos-estandar',
    tokens: [{"old":"/api/v1/codigos-estandar","type":0,"val":"api","end":""},{"old":"/api/v1/codigos-estandar","type":0,"val":"v1","end":""},{"old":"/api/v1/codigos-estandar","type":0,"val":"codigos-estandar","end":""}],
    types: placeholder as Registry['codigosEstandar.codigos_estandar.store']['types'],
  },
  'codigosEstandar.codigos_estandar.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/codigos-estandar/:id',
    tokens: [{"old":"/api/v1/codigos-estandar/:id","type":0,"val":"api","end":""},{"old":"/api/v1/codigos-estandar/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/codigos-estandar/:id","type":0,"val":"codigos-estandar","end":""},{"old":"/api/v1/codigos-estandar/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['codigosEstandar.codigos_estandar.show']['types'],
  },
  'codigosEstandar.codigos_estandar.update': {
    methods: ["PATCH"],
    pattern: '/api/v1/codigos-estandar/:id',
    tokens: [{"old":"/api/v1/codigos-estandar/:id","type":0,"val":"api","end":""},{"old":"/api/v1/codigos-estandar/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/codigos-estandar/:id","type":0,"val":"codigos-estandar","end":""},{"old":"/api/v1/codigos-estandar/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['codigosEstandar.codigos_estandar.update']['types'],
  },
  'codigosEstandar.codigos_estandar.destroy': {
    methods: ["DELETE"],
    pattern: '/api/v1/codigos-estandar/:id',
    tokens: [{"old":"/api/v1/codigos-estandar/:id","type":0,"val":"api","end":""},{"old":"/api/v1/codigos-estandar/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/codigos-estandar/:id","type":0,"val":"codigos-estandar","end":""},{"old":"/api/v1/codigos-estandar/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['codigosEstandar.codigos_estandar.destroy']['types'],
  },
  'unidadesMedida.unidades_medida.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/unidades-medida',
    tokens: [{"old":"/api/v1/unidades-medida","type":0,"val":"api","end":""},{"old":"/api/v1/unidades-medida","type":0,"val":"v1","end":""},{"old":"/api/v1/unidades-medida","type":0,"val":"unidades-medida","end":""}],
    types: placeholder as Registry['unidadesMedida.unidades_medida.index']['types'],
  },
  'unidadesMedida.unidades_medida.store': {
    methods: ["POST"],
    pattern: '/api/v1/unidades-medida',
    tokens: [{"old":"/api/v1/unidades-medida","type":0,"val":"api","end":""},{"old":"/api/v1/unidades-medida","type":0,"val":"v1","end":""},{"old":"/api/v1/unidades-medida","type":0,"val":"unidades-medida","end":""}],
    types: placeholder as Registry['unidadesMedida.unidades_medida.store']['types'],
  },
  'unidadesMedida.unidades_medida.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/unidades-medida/:id',
    tokens: [{"old":"/api/v1/unidades-medida/:id","type":0,"val":"api","end":""},{"old":"/api/v1/unidades-medida/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/unidades-medida/:id","type":0,"val":"unidades-medida","end":""},{"old":"/api/v1/unidades-medida/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['unidadesMedida.unidades_medida.show']['types'],
  },
  'unidadesMedida.unidades_medida.update': {
    methods: ["PATCH"],
    pattern: '/api/v1/unidades-medida/:id',
    tokens: [{"old":"/api/v1/unidades-medida/:id","type":0,"val":"api","end":""},{"old":"/api/v1/unidades-medida/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/unidades-medida/:id","type":0,"val":"unidades-medida","end":""},{"old":"/api/v1/unidades-medida/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['unidadesMedida.unidades_medida.update']['types'],
  },
  'unidadesMedida.unidades_medida.destroy': {
    methods: ["DELETE"],
    pattern: '/api/v1/unidades-medida/:id',
    tokens: [{"old":"/api/v1/unidades-medida/:id","type":0,"val":"api","end":""},{"old":"/api/v1/unidades-medida/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/unidades-medida/:id","type":0,"val":"unidades-medida","end":""},{"old":"/api/v1/unidades-medida/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['unidadesMedida.unidades_medida.destroy']['types'],
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
