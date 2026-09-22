import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'auth.new_account.store': { paramsTuple?: []; params?: {} }
    'auth.access_tokens.store': { paramsTuple?: []; params?: {} }
    'account.profile.show': { paramsTuple?: []; params?: {} }
    'account.profile.update': { paramsTuple?: []; params?: {} }
    'account.profile.change_password': { paramsTuple?: []; params?: {} }
    'account.access_tokens.destroy': { paramsTuple?: []; params?: {} }
    'modules.modules.index': { paramsTuple?: []; params?: {} }
    'modules.modules.tree': { paramsTuple?: []; params?: {} }
    'modules.modules.catalog': { paramsTuple?: []; params?: {} }
    'modules.modules.store': { paramsTuple?: []; params?: {} }
    'roles.roles.index': { paramsTuple?: []; params?: {} }
    'roles.roles.store': { paramsTuple?: []; params?: {} }
    'roles.roles.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'roles.roles.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'roles.roles.sync_modules': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.users.options': { paramsTuple?: []; params?: {} }
    'users.users.index': { paramsTuple?: []; params?: {} }
    'users.users.store': { paramsTuple?: []; params?: {} }
    'users.users.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.users.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'categorias.categorias.index': { paramsTuple?: []; params?: {} }
    'categorias.categorias.store': { paramsTuple?: []; params?: {} }
    'categorias.categorias.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'categorias.categorias.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'subcategorias.subcategorias.index': { paramsTuple?: []; params?: {} }
    'subcategorias.subcategorias.store': { paramsTuple?: []; params?: {} }
    'subcategorias.subcategorias.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'subcategorias.subcategorias.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'elementos.elementos.index': { paramsTuple?: []; params?: {} }
    'elementos.elementos.store': { paramsTuple?: []; params?: {} }
    'elementos.elementos.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'elementos.elementos.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bodegas.bodega.index': { paramsTuple?: []; params?: {} }
    'bodegas.bodega.store': { paramsTuple?: []; params?: {} }
    'bodegas.bodega.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bodegas.bodega.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bodegas.bodega.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bodegas.stand.index': { paramsTuple: [ParamValue]; params: {'id_bodega': ParamValue} }
    'bodegas.stand.store': { paramsTuple: [ParamValue]; params: {'id_bodega': ParamValue} }
    'bodegas.stand.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bodegas.stand.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bodegas.stand.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  GET: {
    'account.profile.show': { paramsTuple?: []; params?: {} }
    'modules.modules.index': { paramsTuple?: []; params?: {} }
    'modules.modules.tree': { paramsTuple?: []; params?: {} }
    'modules.modules.catalog': { paramsTuple?: []; params?: {} }
    'roles.roles.index': { paramsTuple?: []; params?: {} }
    'roles.roles.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.users.options': { paramsTuple?: []; params?: {} }
    'users.users.index': { paramsTuple?: []; params?: {} }
    'users.users.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'categorias.categorias.index': { paramsTuple?: []; params?: {} }
    'categorias.categorias.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'subcategorias.subcategorias.index': { paramsTuple?: []; params?: {} }
    'subcategorias.subcategorias.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'elementos.elementos.index': { paramsTuple?: []; params?: {} }
    'elementos.elementos.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bodegas.bodega.index': { paramsTuple?: []; params?: {} }
    'bodegas.bodega.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bodegas.stand.index': { paramsTuple: [ParamValue]; params: {'id_bodega': ParamValue} }
    'bodegas.stand.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  HEAD: {
    'account.profile.show': { paramsTuple?: []; params?: {} }
    'modules.modules.index': { paramsTuple?: []; params?: {} }
    'modules.modules.tree': { paramsTuple?: []; params?: {} }
    'modules.modules.catalog': { paramsTuple?: []; params?: {} }
    'roles.roles.index': { paramsTuple?: []; params?: {} }
    'roles.roles.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.users.options': { paramsTuple?: []; params?: {} }
    'users.users.index': { paramsTuple?: []; params?: {} }
    'users.users.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'categorias.categorias.index': { paramsTuple?: []; params?: {} }
    'categorias.categorias.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'subcategorias.subcategorias.index': { paramsTuple?: []; params?: {} }
    'subcategorias.subcategorias.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'elementos.elementos.index': { paramsTuple?: []; params?: {} }
    'elementos.elementos.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bodegas.bodega.index': { paramsTuple?: []; params?: {} }
    'bodegas.bodega.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bodegas.stand.index': { paramsTuple: [ParamValue]; params: {'id_bodega': ParamValue} }
    'bodegas.stand.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  POST: {
    'auth.new_account.store': { paramsTuple?: []; params?: {} }
    'auth.access_tokens.store': { paramsTuple?: []; params?: {} }
    'account.access_tokens.destroy': { paramsTuple?: []; params?: {} }
    'modules.modules.store': { paramsTuple?: []; params?: {} }
    'roles.roles.store': { paramsTuple?: []; params?: {} }
    'users.users.store': { paramsTuple?: []; params?: {} }
    'categorias.categorias.store': { paramsTuple?: []; params?: {} }
    'subcategorias.subcategorias.store': { paramsTuple?: []; params?: {} }
    'elementos.elementos.store': { paramsTuple?: []; params?: {} }
    'bodegas.bodega.store': { paramsTuple?: []; params?: {} }
    'bodegas.stand.store': { paramsTuple: [ParamValue]; params: {'id_bodega': ParamValue} }
  }
  PATCH: {
    'account.profile.update': { paramsTuple?: []; params?: {} }
    'account.profile.change_password': { paramsTuple?: []; params?: {} }
    'roles.roles.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.users.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'categorias.categorias.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'subcategorias.subcategorias.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'elementos.elementos.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bodegas.bodega.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bodegas.stand.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PUT: {
    'roles.roles.sync_modules': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'bodegas.bodega.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bodegas.stand.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}