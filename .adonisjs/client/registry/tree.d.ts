/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  auth: {
    newAccount: {
      store: typeof routes['auth.new_account.store']
    }
    accessTokens: {
      store: typeof routes['auth.access_tokens.store']
    }
  }
  account: {
    profile: {
      show: typeof routes['account.profile.show']
      update: typeof routes['account.profile.update']
      changePassword: typeof routes['account.profile.change_password']
    }
    accessTokens: {
      destroy: typeof routes['account.access_tokens.destroy']
    }
  }
  modules: {
    modules: {
      index: typeof routes['modules.modules.index']
      tree: typeof routes['modules.modules.tree']
      catalog: typeof routes['modules.modules.catalog']
      store: typeof routes['modules.modules.store']
    }
  }
  roles: {
    roles: {
      index: typeof routes['roles.roles.index']
      store: typeof routes['roles.roles.store']
      show: typeof routes['roles.roles.show']
      update: typeof routes['roles.roles.update']
      syncModules: typeof routes['roles.roles.sync_modules']
    }
  }
  users: {
    users: {
      options: typeof routes['users.users.options']
      index: typeof routes['users.users.index']
      store: typeof routes['users.users.store']
      show: typeof routes['users.users.show']
      update: typeof routes['users.users.update']
    }
  }
  categorias: {
    categorias: {
      index: typeof routes['categorias.categorias.index']
      store: typeof routes['categorias.categorias.store']
      show: typeof routes['categorias.categorias.show']
      update: typeof routes['categorias.categorias.update']
    }
  }
  subcategorias: {
    subcategorias: {
      index: typeof routes['subcategorias.subcategorias.index']
      store: typeof routes['subcategorias.subcategorias.store']
      show: typeof routes['subcategorias.subcategorias.show']
      update: typeof routes['subcategorias.subcategorias.update']
    }
  }
  elementos: {
    elementos: {
      index: typeof routes['elementos.elementos.index']
      store: typeof routes['elementos.elementos.store']
      show: typeof routes['elementos.elementos.show']
      update: typeof routes['elementos.elementos.update']
    }
  }
  bodegas: {
    bodega: {
      index: typeof routes['bodegas.bodega.index']
      store: typeof routes['bodegas.bodega.store']
      show: typeof routes['bodegas.bodega.show']
      update: typeof routes['bodegas.bodega.update']
      destroy: typeof routes['bodegas.bodega.destroy']
    }
    stand: {
      index: typeof routes['bodegas.stand.index']
      store: typeof routes['bodegas.stand.store']
      show: typeof routes['bodegas.stand.show']
      update: typeof routes['bodegas.stand.update']
      destroy: typeof routes['bodegas.stand.destroy']
    }
  }
  unidadesMedida: {
    unidadesMedida: {
      index: typeof routes['unidadesMedida.unidades_medida.index']
      show: typeof routes['unidadesMedida.unidades_medida.show']
    }
  }
}
