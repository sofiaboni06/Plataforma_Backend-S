/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractResponse } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'auth.new_account.store': {
    methods: ["POST"]
    pattern: '/api/v1/auth/signup'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/usuario').signupValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/usuario').signupValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/new_account_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/new_account_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth.access_tokens.store': {
    methods: ["POST"]
    pattern: '/api/v1/auth/login'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/usuario').loginValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/usuario').loginValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/access_tokens_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/access_tokens_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'account.profile.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/account/profile'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/profile_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/profile_controller').default['show']>>>
    }
  }
  'account.profile.update': {
    methods: ["PATCH"]
    pattern: '/api/v1/account/profile'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/usuario').updateProfileValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/usuario').updateProfileValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/profile_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/profile_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'account.profile.change_password': {
    methods: ["PATCH"]
    pattern: '/api/v1/account/password'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/usuario').changePasswordValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/usuario').changePasswordValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/profile_controller').default['changePassword']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/profile_controller').default['changePassword']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'account.access_tokens.destroy': {
    methods: ["POST"]
    pattern: '/api/v1/account/logout'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/access_tokens_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/access_tokens_controller').default['destroy']>>>
    }
  }
  'modules.modules.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/modules'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/modules_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/modules_controller').default['index']>>>
    }
  }
  'modules.modules.tree': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/modules/tree'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/modules_controller').default['tree']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/modules_controller').default['tree']>>>
    }
  }
  'modules.modules.catalog': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/modules/catalog'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/modules_controller').default['catalog']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/modules_controller').default['catalog']>>>
    }
  }
  'modules.modules.store': {
    methods: ["POST"]
    pattern: '/api/v1/modules/catalog'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/role').createCatalogModuleValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/role').createCatalogModuleValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/modules_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/modules_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'roles.roles.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/roles'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/roles_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/roles_controller').default['index']>>>
    }
  }
  'roles.roles.store': {
    methods: ["POST"]
    pattern: '/api/v1/roles'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/role').createRoleValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/role').createRoleValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/roles_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/roles_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'roles.roles.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/roles/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/roles_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/roles_controller').default['show']>>>
    }
  }
  'roles.roles.update': {
    methods: ["PATCH"]
    pattern: '/api/v1/roles/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/role').updateRoleValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/role').updateRoleValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/roles_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/roles_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'roles.roles.sync_modules': {
    methods: ["PUT"]
    pattern: '/api/v1/roles/:id/modules'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/role').assignModulesValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/role').assignModulesValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/roles_controller').default['syncModules']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/roles_controller').default['syncModules']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'users.users.options': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/users/options'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/users_controller').default['options']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/users_controller').default['options']>>>
    }
  }
  'users.users.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/users'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/users_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/users_controller').default['index']>>>
    }
  }
  'users.users.store': {
    methods: ["POST"]
    pattern: '/api/v1/users'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/usuario').createUserValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/usuario').createUserValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/users_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/users_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'users.users.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/users/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/users_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/users_controller').default['show']>>>
    }
  }
  'users.users.update': {
    methods: ["PATCH"]
    pattern: '/api/v1/users/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/usuario').updateUserValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/usuario').updateUserValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/users_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/users_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'categorias.categorias.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/categorias'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/categorias_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/categorias_controller').default['index']>>>
    }
  }
  'categorias.categorias.store': {
    methods: ["POST"]
    pattern: '/api/v1/categorias'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/categoria').createCategoriaValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/categoria').createCategoriaValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/categorias_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/categorias_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'categorias.categorias.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/categorias/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/categorias_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/categorias_controller').default['show']>>>
    }
  }
  'categorias.categorias.update': {
    methods: ["PATCH"]
    pattern: '/api/v1/categorias/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/categoria').updateCategoriaValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/categoria').updateCategoriaValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/categorias_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/categorias_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'subcategorias.subcategorias.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/subcategorias'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/subcategorias_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/subcategorias_controller').default['index']>>>
    }
  }
  'subcategorias.subcategorias.store': {
    methods: ["POST"]
    pattern: '/api/v1/subcategorias'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/subcategoria').createSubcategoriaValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/subcategoria').createSubcategoriaValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/subcategorias_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/subcategorias_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'subcategorias.subcategorias.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/subcategorias/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/subcategorias_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/subcategorias_controller').default['show']>>>
    }
  }
  'subcategorias.subcategorias.update': {
    methods: ["PATCH"]
    pattern: '/api/v1/subcategorias/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/subcategoria').updateSubcategoriaValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/subcategoria').updateSubcategoriaValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/subcategorias_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/subcategorias_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'elementos.elementos.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/inventario/elementos'
  'bodegas.bodega.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/bodegas'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
    }
  }
  'elementos.elementos.store': {
    methods: ["POST"]
    pattern: '/api/v1/inventario/elementos'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
    }
  }
  'elementos.elementos.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/inventario/elementos/:id'
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/bodega_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/bodega_controller').default['index']>>>
    }
  }
  'bodegas.bodega.store': {
    methods: ["POST"]
    pattern: '/api/v1/bodegas'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/bodega').createBodegaValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/bodega').createBodegaValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/bodega_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/bodega_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'bodegas.bodega.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/bodegas/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/bodega_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/bodega_controller').default['show']>>>
    }
  }
  'bodegas.bodega.update': {
    methods: ["PATCH"]
    pattern: '/api/v1/bodegas/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/bodega').updateBodegaValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/bodega').updateBodegaValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/bodega_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/bodega_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'bodegas.bodega.destroy': {
    methods: ["DELETE"]
    pattern: '/api/v1/bodegas/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/bodega_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/bodega_controller').default['destroy']>>>
    }
  }
  'bodegas.stand.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/bodegas/:id_bodega/stands'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id_bodega: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/stand_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/stand_controller').default['index']>>>
    }
  }
  'bodegas.stand.store': {
    methods: ["POST"]
    pattern: '/api/v1/bodegas/:id_bodega/stands'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/bodega').createStandValidator)>>
      paramsTuple: [ParamValue]
      params: { id_bodega: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/bodega').createStandValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/stand_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/stand_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'bodegas.stand.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/bodegas/stands/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: unknown
      errorResponse: unknown
    }
  }
  'elementos.elementos.update': {
    methods: ["PATCH"]
    pattern: '/api/v1/inventario/elementos/:id'
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/stand_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/stand_controller').default['show']>>>
    }
  }
  'bodegas.stand.update': {
    methods: ["PATCH"]
    pattern: '/api/v1/bodegas/stands/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/bodega').updateStandValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/bodega').updateStandValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/stand_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/stand_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'bodegas.stand.destroy': {
    methods: ["DELETE"]
    pattern: '/api/v1/bodegas/stands/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: unknown
      errorResponse: unknown
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/stand_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/stand_controller').default['destroy']>>>
    }
  }
}
