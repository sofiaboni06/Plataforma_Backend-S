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
      syncPermissions: typeof routes['roles.roles.sync_permissions']
    }
  }
  users: {
    users: {
      options: typeof routes['users.users.options']
      index: typeof routes['users.users.index']
      store: typeof routes['users.users.store']
      show: typeof routes['users.users.show']
      update: typeof routes['users.users.update']
      syncBodegas: typeof routes['users.users.sync_bodegas']
    }
  }
  permissions: {
    permissions: {
      index: typeof routes['permissions.permissions.index']
    }
  }
  categorias: {
    categorias: {
      index: typeof routes['categorias.categorias.index']
      store: typeof routes['categorias.categorias.store']
      show: typeof routes['categorias.categorias.show']
      update: typeof routes['categorias.categorias.update']
      destroy: typeof routes['categorias.categorias.destroy']
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
      showFoto: typeof routes['elementos.elementos.show_foto']
      storeFoto: typeof routes['elementos.elementos.store_foto']
      destroyFoto: typeof routes['elementos.elementos.destroy_foto']
      update: typeof routes['elementos.elementos.update']
    }
  }
  items: {
    items: {
      index: typeof routes['items.items.index']
      store: typeof routes['items.items.store']
      show: typeof routes['items.items.show']
      update: typeof routes['items.items.update']
      destroy: typeof routes['items.items.destroy']
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
    subBodegas: {
      show: typeof routes['bodegas.sub_bodegas.show']
      update: typeof routes['bodegas.sub_bodegas.update']
      destroy: typeof routes['bodegas.sub_bodegas.destroy']
      index: typeof routes['bodegas.sub_bodegas.index']
      store: typeof routes['bodegas.sub_bodegas.store']
    }
  }
  clasificacionesElemento: {
    clasificacionesElemento: {
      index: typeof routes['clasificacionesElemento.clasificaciones_elemento.index']
      store: typeof routes['clasificacionesElemento.clasificaciones_elemento.store']
      show: typeof routes['clasificacionesElemento.clasificaciones_elemento.show']
      update: typeof routes['clasificacionesElemento.clasificaciones_elemento.update']
      destroy: typeof routes['clasificacionesElemento.clasificaciones_elemento.destroy']
    }
  }
  usosPresupuestales: {
    usosPresupuestales: {
      index: typeof routes['usosPresupuestales.usos_presupuestales.index']
      store: typeof routes['usosPresupuestales.usos_presupuestales.store']
      show: typeof routes['usosPresupuestales.usos_presupuestales.show']
      update: typeof routes['usosPresupuestales.usos_presupuestales.update']
      destroy: typeof routes['usosPresupuestales.usos_presupuestales.destroy']
    }
  }
  codigosEstandar: {
    codigosEstandar: {
      index: typeof routes['codigosEstandar.codigos_estandar.index']
      store: typeof routes['codigosEstandar.codigos_estandar.store']
      show: typeof routes['codigosEstandar.codigos_estandar.show']
      update: typeof routes['codigosEstandar.codigos_estandar.update']
      destroy: typeof routes['codigosEstandar.codigos_estandar.destroy']
    }
  }
  unidadesMedida: {
    unidadesMedida: {
      index: typeof routes['unidadesMedida.unidades_medida.index']
      store: typeof routes['unidadesMedida.unidades_medida.store']
      show: typeof routes['unidadesMedida.unidades_medida.show']
      update: typeof routes['unidadesMedida.unidades_medida.update']
      destroy: typeof routes['unidadesMedida.unidades_medida.destroy']
    }
  }
}
