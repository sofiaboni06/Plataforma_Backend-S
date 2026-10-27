import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'event_stream': { paramsTuple?: []; params?: {} }
    'subscribe': { paramsTuple?: []; params?: {} }
    'unsubscribe': { paramsTuple?: []; params?: {} }
    'auth.new_account.store': { paramsTuple?: []; params?: {} }
    'auth.access_tokens.store': { paramsTuple?: []; params?: {} }
    'auth.password_recovery.request': { paramsTuple?: []; params?: {} }
    'auth.password_recovery.verify': { paramsTuple?: []; params?: {} }
    'auth.password_recovery.verify_google': { paramsTuple?: []; params?: {} }
    'auth.password_recovery.reset': { paramsTuple?: []; params?: {} }
    'authTwoFactor.password_recovery.setup_google': { paramsTuple?: []; params?: {} }
    'authTwoFactor.password_recovery.confirm_google': { paramsTuple?: []; params?: {} }
    'authTwoFactor.password_recovery.disable_google': { paramsTuple?: []; params?: {} }
    'account.profile.show': { paramsTuple?: []; params?: {} }
    'account.profile.update': { paramsTuple?: []; params?: {} }
    'account.profile.change_password': { paramsTuple?: []; params?: {} }
    'account.profile.programas': { paramsTuple?: []; params?: {} }
    'account.notificaciones.index': { paramsTuple?: []; params?: {} }
    'account.notificaciones.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'account.notificaciones.update_all': { paramsTuple?: []; params?: {} }
    'account.notificaciones.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
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
    'roles.roles.sync_permissions': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.users.options': { paramsTuple?: []; params?: {} }
    'users.users.index': { paramsTuple?: []; params?: {} }
    'users.users.store': { paramsTuple?: []; params?: {} }
    'users.users.programas': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.users.sync_programas': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.users.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.users.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.users.sync_bodegas': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'permissions.permissions.index': { paramsTuple?: []; params?: {} }
    'categorias.categorias.index': { paramsTuple?: []; params?: {} }
    'categorias.categorias.store': { paramsTuple?: []; params?: {} }
    'categorias.categorias.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'categorias.categorias.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'categorias.categorias.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'subcategorias.subcategorias.index': { paramsTuple?: []; params?: {} }
    'subcategorias.subcategorias.store': { paramsTuple?: []; params?: {} }
    'subcategorias.subcategorias.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'subcategorias.subcategorias.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'elementos.elementos.index': { paramsTuple?: []; params?: {} }
    'elementos.elementos.store': { paramsTuple?: []; params?: {} }
    'elementos.elementos.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'elementos.elementos.show_foto': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'elementos.elementos.store_foto': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'elementos.elementos.destroy_foto': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'elementos.elementos.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'alertas.alertas.index': { paramsTuple?: []; params?: {} }
    'items.items.index': { paramsTuple?: []; params?: {} }
    'items.items.store': { paramsTuple?: []; params?: {} }
    'items.items.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'items.items.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'items.items.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bodegas.bodega.index': { paramsTuple?: []; params?: {} }
    'bodegas.bodega.store': { paramsTuple?: []; params?: {} }
    'bodegas.stand.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bodegas.stand.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bodegas.sub_bodegas.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bodegas.sub_bodegas.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bodegas.sub_bodegas.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bodegas.stand.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bodegas.stand.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bodegas.stand.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bodegas.sub_bodegas.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bodegas.sub_bodegas.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bodegas.bodega.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bodegas.bodega.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bodegas.bodega.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'clasificacionesElemento.clasificaciones_elemento.index': { paramsTuple?: []; params?: {} }
    'clasificacionesElemento.clasificaciones_elemento.store': { paramsTuple?: []; params?: {} }
    'clasificacionesElemento.clasificaciones_elemento.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'clasificacionesElemento.clasificaciones_elemento.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'clasificacionesElemento.clasificaciones_elemento.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'usosPresupuestales.usos_presupuestales.index': { paramsTuple?: []; params?: {} }
    'usosPresupuestales.usos_presupuestales.store': { paramsTuple?: []; params?: {} }
    'usosPresupuestales.usos_presupuestales.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'usosPresupuestales.usos_presupuestales.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'usosPresupuestales.usos_presupuestales.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'codigosEstandar.codigos_estandar.index': { paramsTuple?: []; params?: {} }
    'codigosEstandar.codigos_estandar.store': { paramsTuple?: []; params?: {} }
    'codigosEstandar.codigos_estandar.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'codigosEstandar.codigos_estandar.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'codigosEstandar.codigos_estandar.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'unidadesMedida.unidades_medida.index': { paramsTuple?: []; params?: {} }
    'unidadesMedida.unidades_medida.store': { paramsTuple?: []; params?: {} }
    'unidadesMedida.unidades_medida.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'unidadesMedida.unidades_medida.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'unidadesMedida.unidades_medida.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'nivelesPrograma.niveles_programa.index': { paramsTuple?: []; params?: {} }
    'nivelesPrograma.niveles_programa.store': { paramsTuple?: []; params?: {} }
    'nivelesPrograma.niveles_programa.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'nivelesPrograma.niveles_programa.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'nivelesPrograma.niveles_programa.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'redesConocimiento.redes_conocimiento.index': { paramsTuple?: []; params?: {} }
    'redesConocimiento.redes_conocimiento.options': { paramsTuple?: []; params?: {} }
    'redesConocimiento.redes_conocimiento.store': { paramsTuple?: []; params?: {} }
    'redesConocimiento.redes_conocimiento.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'redesConocimiento.redes_conocimiento.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'redesConocimiento.redes_conocimiento.sync_lineas': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'redesConocimiento.redes_conocimiento.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'lineasTematicas.lineas_tematicas.index': { paramsTuple?: []; params?: {} }
    'lineasTematicas.lineas_tematicas.options': { paramsTuple?: []; params?: {} }
    'lineasTematicas.lineas_tematicas.store': { paramsTuple?: []; params?: {} }
    'lineasTematicas.lineas_tematicas.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'lineasTematicas.lineas_tematicas.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'lineasTematicas.lineas_tematicas.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'programasFormacion.programas_formacion.index': { paramsTuple?: []; params?: {} }
    'programasFormacion.programas_formacion.options': { paramsTuple?: []; params?: {} }
    'programasFormacion.programas_formacion.store': { paramsTuple?: []; params?: {} }
    'programasFormacion.programas_formacion.usuarios': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'programasFormacion.programas_formacion.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'programasFormacion.programas_formacion.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'programasFormacion.programas_formacion.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'listasMaestrasMaterial.listas_maestras_material.listar': { paramsTuple?: []; params?: {} }
    'listasMaestrasMaterial.listas_maestras_material.crear': { paramsTuple?: []; params?: {} }
    'listasMaestrasMaterial.listas_maestras_material.plantilla': { paramsTuple?: []; params?: {} }
    'listasMaestrasMaterial.listas_maestras_material.importar': { paramsTuple?: []; params?: {} }
    'listasMaestrasMaterial.listas_maestras_material.actualizar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'listasMaestrasMaterial.listas_maestras_material.eliminar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'vigencias.vigencias.index': { paramsTuple?: []; params?: {} }
    'vigencias.vigencias.activa': { paramsTuple?: []; params?: {} }
    'vigencias.vigencias.store': { paramsTuple?: []; params?: {} }
    'vigencias.vigencias.update': { paramsTuple: [ParamValue]; params: {'anio': ParamValue} }
    'vigencias.vigencias.destroy': { paramsTuple: [ParamValue]; params: {'anio': ParamValue} }
    'solicitudesPrograma.solicitudes_programa.index': { paramsTuple?: []; params?: {} }
    'solicitudesPrograma.solicitudes_programa.store': { paramsTuple?: []; params?: {} }
    'solicitudesPrograma.solicitudes_programa.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'solicitudesPrograma.solicitudes_programa.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'solicitudesPrograma.solicitudes_programa.enviar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'solicitudesPrograma.solicitudes_programa.decidir': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'solicitudesPrograma.solicitudes_programa.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'presupuestoFormacion.presupuesto_formacion.resumen': { paramsTuple?: []; params?: {} }
    'presupuestoFormacion.presupuesto_formacion.guardar_monto': { paramsTuple?: []; params?: {} }
    'presupuestoFormacion.presupuesto_formacion.repartir': { paramsTuple?: []; params?: {} }
    'presupuestoFormacion.presupuesto_formacion.lotes': { paramsTuple?: []; params?: {} }
    'presupuestoFormacion.presupuesto_formacion.crear_lote': { paramsTuple?: []; params?: {} }
    'presupuestoFormacion.presupuesto_formacion.descargar': { paramsTuple?: []; params?: {} }
    'procesosCompra.procesos_compra.consolidado': { paramsTuple?: []; params?: {} }
    'procesosCompra.procesos_compra.store': { paramsTuple?: []; params?: {} }
    'fichas.fichas.index': { paramsTuple?: []; params?: {} }
    'fichas.fichas.options': { paramsTuple?: []; params?: {} }
    'fichas.fichas.store': { paramsTuple?: []; params?: {} }
    'fichas.fichas.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'fichas.fichas.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'fichas.fichas.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'jornadas.jornadas.index': { paramsTuple?: []; params?: {} }
    'obras.obras.index': { paramsTuple?: []; params?: {} }
    'obras.obras.store': { paramsTuple?: []; params?: {} }
    'obras.obras.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'obras.obras.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'obras.obras.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'solicitudes.solicitudes.index': { paramsTuple?: []; params?: {} }
    'solicitudes.solicitudes.store': { paramsTuple?: []; params?: {} }
    'solicitudes.solicitudes.registrar_en_bodega': { paramsTuple?: []; params?: {} }
    'solicitudes.solicitudes.solicitante': { paramsTuple: [ParamValue]; params: {'documento': ParamValue} }
    'solicitudes.solicitudes.prestamos': { paramsTuple?: []; params?: {} }
    'solicitudes.solicitudes.show': { paramsTuple: [ParamValue]; params: {'codigo': ParamValue} }
    'solicitudes.solicitudes.entregar': { paramsTuple: [ParamValue]; params: {'codigo': ParamValue} }
    'solicitudes.solicitudes.plazo': { paramsTuple: [ParamValue]; params: {'codigo': ParamValue} }
    'entregas.entregas.index': { paramsTuple?: []; params?: {} }
    'solicitudesEquipo.solicitud_equipo.index': { paramsTuple?: []; params?: {} }
    'solicitudesEquipo.solicitud_equipo.store': { paramsTuple?: []; params?: {} }
    'solicitudesEquipo.solicitud_equipo.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'solicitudesEquipo.solicitud_equipo.entregar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'solicitudesEquipo.solicitud_equipo.devolver': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'solicitudesMaterial.solicitud_material.index': { paramsTuple?: []; params?: {} }
    'solicitudesMaterial.solicitud_material.store': { paramsTuple?: []; params?: {} }
    'solicitudesMaterial.solicitud_material.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'solicitudesMaterial.solicitud_material.entregar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'reportes.reportes.elementos': { paramsTuple?: []; params?: {} }
    'reportes.reportes.bodega': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'formato': ParamValue} }
  }
  GET: {
    'event_stream': { paramsTuple?: []; params?: {} }
    'account.profile.show': { paramsTuple?: []; params?: {} }
    'account.profile.programas': { paramsTuple?: []; params?: {} }
    'account.notificaciones.index': { paramsTuple?: []; params?: {} }
    'account.notificaciones.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'modules.modules.index': { paramsTuple?: []; params?: {} }
    'modules.modules.tree': { paramsTuple?: []; params?: {} }
    'modules.modules.catalog': { paramsTuple?: []; params?: {} }
    'roles.roles.index': { paramsTuple?: []; params?: {} }
    'roles.roles.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.users.options': { paramsTuple?: []; params?: {} }
    'users.users.index': { paramsTuple?: []; params?: {} }
    'users.users.programas': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.users.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'permissions.permissions.index': { paramsTuple?: []; params?: {} }
    'categorias.categorias.index': { paramsTuple?: []; params?: {} }
    'categorias.categorias.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'subcategorias.subcategorias.index': { paramsTuple?: []; params?: {} }
    'subcategorias.subcategorias.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'elementos.elementos.index': { paramsTuple?: []; params?: {} }
    'elementos.elementos.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'elementos.elementos.show_foto': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'alertas.alertas.index': { paramsTuple?: []; params?: {} }
    'items.items.index': { paramsTuple?: []; params?: {} }
    'items.items.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bodegas.bodega.index': { paramsTuple?: []; params?: {} }
    'bodegas.stand.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bodegas.sub_bodegas.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bodegas.stand.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bodegas.sub_bodegas.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bodegas.bodega.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'clasificacionesElemento.clasificaciones_elemento.index': { paramsTuple?: []; params?: {} }
    'clasificacionesElemento.clasificaciones_elemento.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'usosPresupuestales.usos_presupuestales.index': { paramsTuple?: []; params?: {} }
    'usosPresupuestales.usos_presupuestales.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'codigosEstandar.codigos_estandar.index': { paramsTuple?: []; params?: {} }
    'codigosEstandar.codigos_estandar.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'unidadesMedida.unidades_medida.index': { paramsTuple?: []; params?: {} }
    'unidadesMedida.unidades_medida.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'nivelesPrograma.niveles_programa.index': { paramsTuple?: []; params?: {} }
    'nivelesPrograma.niveles_programa.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'redesConocimiento.redes_conocimiento.index': { paramsTuple?: []; params?: {} }
    'redesConocimiento.redes_conocimiento.options': { paramsTuple?: []; params?: {} }
    'redesConocimiento.redes_conocimiento.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'lineasTematicas.lineas_tematicas.index': { paramsTuple?: []; params?: {} }
    'lineasTematicas.lineas_tematicas.options': { paramsTuple?: []; params?: {} }
    'lineasTematicas.lineas_tematicas.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'programasFormacion.programas_formacion.index': { paramsTuple?: []; params?: {} }
    'programasFormacion.programas_formacion.options': { paramsTuple?: []; params?: {} }
    'programasFormacion.programas_formacion.usuarios': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'programasFormacion.programas_formacion.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'listasMaestrasMaterial.listas_maestras_material.listar': { paramsTuple?: []; params?: {} }
    'listasMaestrasMaterial.listas_maestras_material.plantilla': { paramsTuple?: []; params?: {} }
    'vigencias.vigencias.index': { paramsTuple?: []; params?: {} }
    'vigencias.vigencias.activa': { paramsTuple?: []; params?: {} }
    'solicitudesPrograma.solicitudes_programa.index': { paramsTuple?: []; params?: {} }
    'solicitudesPrograma.solicitudes_programa.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'presupuestoFormacion.presupuesto_formacion.resumen': { paramsTuple?: []; params?: {} }
    'presupuestoFormacion.presupuesto_formacion.lotes': { paramsTuple?: []; params?: {} }
    'presupuestoFormacion.presupuesto_formacion.descargar': { paramsTuple?: []; params?: {} }
    'procesosCompra.procesos_compra.consolidado': { paramsTuple?: []; params?: {} }
    'fichas.fichas.index': { paramsTuple?: []; params?: {} }
    'fichas.fichas.options': { paramsTuple?: []; params?: {} }
    'fichas.fichas.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'jornadas.jornadas.index': { paramsTuple?: []; params?: {} }
    'obras.obras.index': { paramsTuple?: []; params?: {} }
    'obras.obras.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'solicitudes.solicitudes.index': { paramsTuple?: []; params?: {} }
    'solicitudes.solicitudes.solicitante': { paramsTuple: [ParamValue]; params: {'documento': ParamValue} }
    'solicitudes.solicitudes.prestamos': { paramsTuple?: []; params?: {} }
    'solicitudes.solicitudes.show': { paramsTuple: [ParamValue]; params: {'codigo': ParamValue} }
    'entregas.entregas.index': { paramsTuple?: []; params?: {} }
    'solicitudesEquipo.solicitud_equipo.index': { paramsTuple?: []; params?: {} }
    'solicitudesEquipo.solicitud_equipo.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'solicitudesMaterial.solicitud_material.index': { paramsTuple?: []; params?: {} }
    'solicitudesMaterial.solicitud_material.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'reportes.reportes.elementos': { paramsTuple?: []; params?: {} }
    'reportes.reportes.bodega': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'formato': ParamValue} }
  }
  HEAD: {
    'event_stream': { paramsTuple?: []; params?: {} }
    'account.profile.show': { paramsTuple?: []; params?: {} }
    'account.profile.programas': { paramsTuple?: []; params?: {} }
    'account.notificaciones.index': { paramsTuple?: []; params?: {} }
    'account.notificaciones.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'modules.modules.index': { paramsTuple?: []; params?: {} }
    'modules.modules.tree': { paramsTuple?: []; params?: {} }
    'modules.modules.catalog': { paramsTuple?: []; params?: {} }
    'roles.roles.index': { paramsTuple?: []; params?: {} }
    'roles.roles.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.users.options': { paramsTuple?: []; params?: {} }
    'users.users.index': { paramsTuple?: []; params?: {} }
    'users.users.programas': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.users.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'permissions.permissions.index': { paramsTuple?: []; params?: {} }
    'categorias.categorias.index': { paramsTuple?: []; params?: {} }
    'categorias.categorias.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'subcategorias.subcategorias.index': { paramsTuple?: []; params?: {} }
    'subcategorias.subcategorias.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'elementos.elementos.index': { paramsTuple?: []; params?: {} }
    'elementos.elementos.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'elementos.elementos.show_foto': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'alertas.alertas.index': { paramsTuple?: []; params?: {} }
    'items.items.index': { paramsTuple?: []; params?: {} }
    'items.items.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bodegas.bodega.index': { paramsTuple?: []; params?: {} }
    'bodegas.stand.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bodegas.sub_bodegas.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bodegas.stand.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bodegas.sub_bodegas.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bodegas.bodega.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'clasificacionesElemento.clasificaciones_elemento.index': { paramsTuple?: []; params?: {} }
    'clasificacionesElemento.clasificaciones_elemento.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'usosPresupuestales.usos_presupuestales.index': { paramsTuple?: []; params?: {} }
    'usosPresupuestales.usos_presupuestales.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'codigosEstandar.codigos_estandar.index': { paramsTuple?: []; params?: {} }
    'codigosEstandar.codigos_estandar.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'unidadesMedida.unidades_medida.index': { paramsTuple?: []; params?: {} }
    'unidadesMedida.unidades_medida.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'nivelesPrograma.niveles_programa.index': { paramsTuple?: []; params?: {} }
    'nivelesPrograma.niveles_programa.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'redesConocimiento.redes_conocimiento.index': { paramsTuple?: []; params?: {} }
    'redesConocimiento.redes_conocimiento.options': { paramsTuple?: []; params?: {} }
    'redesConocimiento.redes_conocimiento.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'lineasTematicas.lineas_tematicas.index': { paramsTuple?: []; params?: {} }
    'lineasTematicas.lineas_tematicas.options': { paramsTuple?: []; params?: {} }
    'lineasTematicas.lineas_tematicas.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'programasFormacion.programas_formacion.index': { paramsTuple?: []; params?: {} }
    'programasFormacion.programas_formacion.options': { paramsTuple?: []; params?: {} }
    'programasFormacion.programas_formacion.usuarios': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'programasFormacion.programas_formacion.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'listasMaestrasMaterial.listas_maestras_material.listar': { paramsTuple?: []; params?: {} }
    'listasMaestrasMaterial.listas_maestras_material.plantilla': { paramsTuple?: []; params?: {} }
    'vigencias.vigencias.index': { paramsTuple?: []; params?: {} }
    'vigencias.vigencias.activa': { paramsTuple?: []; params?: {} }
    'solicitudesPrograma.solicitudes_programa.index': { paramsTuple?: []; params?: {} }
    'solicitudesPrograma.solicitudes_programa.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'presupuestoFormacion.presupuesto_formacion.resumen': { paramsTuple?: []; params?: {} }
    'presupuestoFormacion.presupuesto_formacion.lotes': { paramsTuple?: []; params?: {} }
    'presupuestoFormacion.presupuesto_formacion.descargar': { paramsTuple?: []; params?: {} }
    'procesosCompra.procesos_compra.consolidado': { paramsTuple?: []; params?: {} }
    'fichas.fichas.index': { paramsTuple?: []; params?: {} }
    'fichas.fichas.options': { paramsTuple?: []; params?: {} }
    'fichas.fichas.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'jornadas.jornadas.index': { paramsTuple?: []; params?: {} }
    'obras.obras.index': { paramsTuple?: []; params?: {} }
    'obras.obras.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'solicitudes.solicitudes.index': { paramsTuple?: []; params?: {} }
    'solicitudes.solicitudes.solicitante': { paramsTuple: [ParamValue]; params: {'documento': ParamValue} }
    'solicitudes.solicitudes.prestamos': { paramsTuple?: []; params?: {} }
    'solicitudes.solicitudes.show': { paramsTuple: [ParamValue]; params: {'codigo': ParamValue} }
    'entregas.entregas.index': { paramsTuple?: []; params?: {} }
    'solicitudesEquipo.solicitud_equipo.index': { paramsTuple?: []; params?: {} }
    'solicitudesEquipo.solicitud_equipo.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'solicitudesMaterial.solicitud_material.index': { paramsTuple?: []; params?: {} }
    'solicitudesMaterial.solicitud_material.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'reportes.reportes.elementos': { paramsTuple?: []; params?: {} }
    'reportes.reportes.bodega': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'formato': ParamValue} }
  }
  POST: {
    'subscribe': { paramsTuple?: []; params?: {} }
    'unsubscribe': { paramsTuple?: []; params?: {} }
    'auth.new_account.store': { paramsTuple?: []; params?: {} }
    'auth.access_tokens.store': { paramsTuple?: []; params?: {} }
    'auth.password_recovery.request': { paramsTuple?: []; params?: {} }
    'auth.password_recovery.verify': { paramsTuple?: []; params?: {} }
    'auth.password_recovery.verify_google': { paramsTuple?: []; params?: {} }
    'auth.password_recovery.reset': { paramsTuple?: []; params?: {} }
    'authTwoFactor.password_recovery.setup_google': { paramsTuple?: []; params?: {} }
    'authTwoFactor.password_recovery.confirm_google': { paramsTuple?: []; params?: {} }
    'account.access_tokens.destroy': { paramsTuple?: []; params?: {} }
    'modules.modules.store': { paramsTuple?: []; params?: {} }
    'roles.roles.store': { paramsTuple?: []; params?: {} }
    'users.users.store': { paramsTuple?: []; params?: {} }
    'categorias.categorias.store': { paramsTuple?: []; params?: {} }
    'subcategorias.subcategorias.store': { paramsTuple?: []; params?: {} }
    'elementos.elementos.store': { paramsTuple?: []; params?: {} }
    'elementos.elementos.store_foto': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'items.items.store': { paramsTuple?: []; params?: {} }
    'bodegas.bodega.store': { paramsTuple?: []; params?: {} }
    'bodegas.stand.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bodegas.sub_bodegas.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'clasificacionesElemento.clasificaciones_elemento.store': { paramsTuple?: []; params?: {} }
    'usosPresupuestales.usos_presupuestales.store': { paramsTuple?: []; params?: {} }
    'codigosEstandar.codigos_estandar.store': { paramsTuple?: []; params?: {} }
    'unidadesMedida.unidades_medida.store': { paramsTuple?: []; params?: {} }
    'nivelesPrograma.niveles_programa.store': { paramsTuple?: []; params?: {} }
    'redesConocimiento.redes_conocimiento.store': { paramsTuple?: []; params?: {} }
    'lineasTematicas.lineas_tematicas.store': { paramsTuple?: []; params?: {} }
    'programasFormacion.programas_formacion.store': { paramsTuple?: []; params?: {} }
    'listasMaestrasMaterial.listas_maestras_material.crear': { paramsTuple?: []; params?: {} }
    'listasMaestrasMaterial.listas_maestras_material.importar': { paramsTuple?: []; params?: {} }
    'vigencias.vigencias.store': { paramsTuple?: []; params?: {} }
    'solicitudesPrograma.solicitudes_programa.store': { paramsTuple?: []; params?: {} }
    'solicitudesPrograma.solicitudes_programa.enviar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'solicitudesPrograma.solicitudes_programa.decidir': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'presupuestoFormacion.presupuesto_formacion.crear_lote': { paramsTuple?: []; params?: {} }
    'procesosCompra.procesos_compra.store': { paramsTuple?: []; params?: {} }
    'fichas.fichas.store': { paramsTuple?: []; params?: {} }
    'obras.obras.store': { paramsTuple?: []; params?: {} }
    'solicitudes.solicitudes.store': { paramsTuple?: []; params?: {} }
    'solicitudes.solicitudes.registrar_en_bodega': { paramsTuple?: []; params?: {} }
    'solicitudesEquipo.solicitud_equipo.store': { paramsTuple?: []; params?: {} }
    'solicitudesMaterial.solicitud_material.store': { paramsTuple?: []; params?: {} }
  }
  DELETE: {
    'authTwoFactor.password_recovery.disable_google': { paramsTuple?: []; params?: {} }
    'categorias.categorias.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'elementos.elementos.destroy_foto': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'items.items.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bodegas.sub_bodegas.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bodegas.stand.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bodegas.bodega.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'clasificacionesElemento.clasificaciones_elemento.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'usosPresupuestales.usos_presupuestales.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'codigosEstandar.codigos_estandar.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'unidadesMedida.unidades_medida.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'nivelesPrograma.niveles_programa.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'redesConocimiento.redes_conocimiento.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'lineasTematicas.lineas_tematicas.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'programasFormacion.programas_formacion.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'listasMaestrasMaterial.listas_maestras_material.eliminar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'vigencias.vigencias.destroy': { paramsTuple: [ParamValue]; params: {'anio': ParamValue} }
    'solicitudesPrograma.solicitudes_programa.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'fichas.fichas.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'obras.obras.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PATCH: {
    'account.profile.update': { paramsTuple?: []; params?: {} }
    'account.profile.change_password': { paramsTuple?: []; params?: {} }
    'account.notificaciones.update_all': { paramsTuple?: []; params?: {} }
    'account.notificaciones.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'roles.roles.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.users.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'categorias.categorias.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'subcategorias.subcategorias.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'elementos.elementos.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'items.items.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bodegas.sub_bodegas.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bodegas.stand.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bodegas.bodega.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'clasificacionesElemento.clasificaciones_elemento.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'usosPresupuestales.usos_presupuestales.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'codigosEstandar.codigos_estandar.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'unidadesMedida.unidades_medida.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'nivelesPrograma.niveles_programa.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'redesConocimiento.redes_conocimiento.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'lineasTematicas.lineas_tematicas.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'programasFormacion.programas_formacion.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'listasMaestrasMaterial.listas_maestras_material.actualizar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'solicitudesPrograma.solicitudes_programa.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'fichas.fichas.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'obras.obras.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'solicitudes.solicitudes.entregar': { paramsTuple: [ParamValue]; params: {'codigo': ParamValue} }
    'solicitudes.solicitudes.plazo': { paramsTuple: [ParamValue]; params: {'codigo': ParamValue} }
    'solicitudesEquipo.solicitud_equipo.entregar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'solicitudesEquipo.solicitud_equipo.devolver': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'solicitudesMaterial.solicitud_material.entregar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PUT: {
    'roles.roles.sync_modules': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'roles.roles.sync_permissions': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.users.sync_programas': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.users.sync_bodegas': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'redesConocimiento.redes_conocimiento.sync_lineas': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'vigencias.vigencias.update': { paramsTuple: [ParamValue]; params: {'anio': ParamValue} }
    'presupuestoFormacion.presupuesto_formacion.guardar_monto': { paramsTuple?: []; params?: {} }
    'presupuestoFormacion.presupuesto_formacion.repartir': { paramsTuple?: []; params?: {} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}