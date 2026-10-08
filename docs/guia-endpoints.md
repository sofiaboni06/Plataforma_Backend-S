# Guía corta de endpoints

La explicación para quienes **no han hecho backend** está aquí:

**[guia-para-el-equipo.md](./guia-para-el-equipo.md)**

Ahí va el orden modelo → validador → servicio → transformer → controlador → ruta → test, cómo crear perfiles (Aprendiz, Funcionario, …) y cómo colgar módulos padre / hijo / nieto.

## Recordatorio

- AdonisJS 7. Tablas de `plataforma_1.sql`. **No alterar el dump** sin acuerdo.
- JSON camelCase. SQL en español.
- Prefijo `/api/v1`. Respuestas `{ "data": ... }`.
- Privado: `auth` + `account`. Solo admin: también `admin`. Por permiso: `permission('recurso.accion')`.

## Puesta en marcha

Después de restaurar el dump, **los dos comandos son obligatorios**:

```bash
node ace migration:run   # tablas nuevas (tokens, permiso, perfil_permiso, usuario_bodega, codigo_estandar, uso_presupuestal), ficha de elemento e item
node ace db:seed         # llena permisos y, una sola vez para toda la red, los UNSPSC, clasificaciones y usos. El perfil Admin bodega también
```

Si te saltas `db:seed`, la tabla `permiso` queda vacía y **no hay ningún mensaje de error**: el
catálogo de `/permissions` sale sin módulos, la pantalla del admin no muestra ningún checkbox y
todos los usuarios que no sean Administrador reciben 403 en todo el inventario.

El catálogo de permisos vive en `app/data/permission_catalog.ts`. Si agregas un recurso o una
acción ahí, vuelve a correr `node ace db:seed` (es idempotente, puedes correrlo las veces que
quieras).

## Permisos

Un permiso se identifica por su **código** `recurso.accion`, por ejemplo `stand.crear` o
`categoria.ver`. Ese código es lo que se guarda en `perfil_permiso` y lo que reciben y devuelven
los endpoints, nunca el id numérico: así la configuración significa lo mismo en cualquier base de
datos y se puede mover entre ambientes.

Los permisos se asignan **al perfil**, no al usuario. Lo único que se asigna por usuario es la
bodega. Un perfil solo puede recibir permisos de un módulo que ya tenga concedido, y si le quitas
el módulo, sus permisos de ese módulo se revocan solos.

El perfil `Administrador` se salta la revisión de permisos. No lista el inventario de otros centros: ítems, elementos y el árbol de bodegas quedan en el centro de su cuenta. Sí crea bodegas para cualquier centro (`idCformacion` en el POST) y mantiene los catálogos estándar, que son una sola lista para toda la red.

## Endpoints listos

| Método | Ruta | Notas |
| --- | --- | --- |
| `POST` | `/auth/login` `/auth/signup` | público. Recuperar (`/auth/recover`) es la tarea de autenticación |
| `GET/PATCH` | `/account/profile` | ficha de la persona |
| `PATCH` | `/account/password` | |
| `POST` | `/account/logout` | |
| `GET` | `/modules` | módulos concedidos (plano) |
| `GET` | `/modules/tree` | árbol con `granted` |
| `GET/POST` | `/modules/catalog` | catálogo, solo admin |
| `GET/POST` | `/roles` | perfiles/roles, solo admin |
| `GET/PATCH` | `/roles/:id` | |
| `PUT` | `/roles/:id/modules` | `{ moduleIds }`. Quitar un módulo revoca sus permisos |
| `PUT` | `/roles/:id/permissions` | `{ permissionCodes }`, ej. `["stand.crear"]`. Solo admin |
| `GET` | `/permissions` | catálogo módulo → recurso → acción, solo admin |
| `GET` | `/users/options` | perfiles, centros y bodegas, solo admin |
| `GET/POST` | `/users` | listar / crear usuario con `idPerfil` y `bodegaIds`, solo admin |
| `GET/PATCH` | `/users/:id` | ficha y cambio de perfil/datos, solo admin |
| `PUT` | `/users/:id/bodegas` | `{ bodegaIds }`. Solo bodegas del centro del usuario |
| `GET/POST` | `/categorias` | lista global. El listado oculta las deshabilitadas; `?estado=false` las muestra. Crear y editar es del administrador |
| `GET/PATCH/DELETE` | `/categorias/:id` | `DELETE` **deshabilita** (`estado=false`). Falla 409 si tiene subcategorías activas |
| `GET/POST` | `/subcategorias` | lista global. Cuelga de la categoría: `idCategoria`, `nombre`, `estado?`. Crear y editar es del administrador |
| `GET/PATCH` | `/subcategorias/:id` | no hay `DELETE`. Apagarla es `estado: false` |
| `GET/POST` | `/inventario/items` | ficha del producto: `nombre`, `descripcion`, `idSubcategoria`. El nombre es lo específico, por ejemplo "pintura para techos vinilo color rojo". `?idSubcategoria=` / `?search=` / `?estado=` |
| `GET/PATCH/DELETE` | `/inventario/items/:id` | `DELETE` deshabilita. Falla 409 si tiene elementos activos |
| `GET/POST` | `/inventario/elementos` | stock de un item del centro. `idItem` obligatorio y del mismo centro que el stand (`E_ITEM_OTRO_CENTRO`), `cantidad` mínimo 10, `cantidadMinima` opcional (default 10, umbral de alerta), `gramaje` opcional. Ficha: `idClasificacion`, `idUsoPresupuestal` (partida, no es el UNSPSC), `valorUnitarioPromedio`, `porcentajeAumento` (editable) y `idCodigoEstandar`. Esos cuatro ids son de las listas globales. `valorConAumento` se calcula: cantidad × valor unitario × (1 + porcentaje / 100). Nombre y subcategoría se copian del item. `codigo` sigue siendo el código propio del elemento |
| `GET/PATCH` | `/inventario/elementos/:id` | |
| `GET/POST` | `/bodegas` | listado paginado del centro de quien entra. El administrador puede crear en otro centro con `idCformacion`; esa bodega no sale en su `GET /bodegas` y el `GET /bodegas/:id` responde 403. Sí sale en `GET /users/options` para asignarla. Borrar una bodega con sub-bodegas responde 409 |
| `GET/PATCH/DELETE` | `/bodegas/:id` | |
| `GET/POST` | `/bodegas/:id/sub-bodegas` | la sub-bodega cuelga de la bodega. Permisos de bodega. Borrar una con stands responde 409 |
| `GET/PATCH/DELETE` | `/bodegas/sub-bodegas/:id` | |
| `GET/POST` | `/bodegas/sub-bodegas/:id/stands` | el stand cuelga de esa sub-bodega |
| `GET/PATCH/DELETE` | `/bodegas/stands/:id` | borrar un stand con elementos responde 409 |
| `GET/POST` | `/clasificaciones-elemento` | lista global (ACCESORIO, EPP, …). Body: `nombre`, `caracter` (`consumo` o `devolutivo`). Sin centro. Crear, editar y borrar es del administrador. `DELETE` la deshabilita |
| `GET/PATCH/DELETE` | `/clasificaciones-elemento/:id` | |
| `GET/POST` | `/usos-presupuestales` | partida global (MINERALES; ELECTRICIDAD, GAS Y AGUA, …). No es el código UNSPSC. Sin centro. Crear, editar y borrar es del administrador |
| `GET/PATCH/DELETE` | `/usos-presupuestales/:id` | |
| `GET/POST` | `/codigos-estandar` | UNSPSC global. Ej. `{ codigo: "13111305", nombre: "RESINA O ESPUMA" }`. `GET` usa `elemento.ver`. Crear, editar y borrar usan `codigo_estandar.*` (el administrador) |
| `GET/PATCH/DELETE` | `/codigos-estandar/:id` | borrar con elementos que lo usan responde 409 |
| `GET/POST` | `/unidades-medida` | unidades globales. `POST`: `nombre`, `abreviatura`. Sin centro. `DELETE` deshabilita |
| `GET/PATCH/DELETE` | `/unidades-medida/:id` | |

El login y `GET /account/profile` devuelven `permissions` (lista de códigos), `isAdmin` y `bodegas`,
para que el front oculte botones sin adivinar. Al Administrador de la plataforma **no** le llegan
`solicitud_*` ni `alerta.ver`: eso es de Admin bodega e instructor. El resto del catálogo sí.

Cuentas dump, password `123456`: Carlos Administrador, Juan Almacenista, María Funcionario.
`db:seed` agrega `adminbodega@correo.com` (Admin bodega) e `instructor@correo.com` (Instructor). Admin bodega lleva el inventario de la bodega que tiene asignada y entrega lo pendiente. El instructor pide y devuelve. Ninguno de los dos es administrador. Contraseña de ambas: `123456`.

Subcategoría y sub-bodega no se mezclan. La subcategoría clasifica el producto (`categoria` → `subcategoria` → item → elemento) y tiene CRUD en `/subcategorias`. La sub-bodega es la ubicación (`bodega` → `sub-bodega` → stand → elemento) y se crea, edita y borra con los permisos de bodega. El elemento copia nombre y subcategoría del item, y queda en el stand.

Categorías e items **no se borran de la base**: `DELETE` baja `estado`. La subcategoría se apaga con `estado: false`, sin `DELETE`. Bodegas, sub-bodegas y stands sí se borran de verdad, pero solo si están vacíos (409 si no). La bodega pertenece a un centro de formación. El Administrador la crea y se la asigna al usuario en Usuarios. Quien no es administrador solo ve esas bodegas. Si otro perfil con permiso de crear bodega crea una, queda asignada a él. Admin bodega no trae `bodega.crear` ni `bodega.eliminar`. Elementos todavía no tienen `DELETE`. Un elemento nuevo no puede quedar con cantidad menor a 10. Recuperar contraseña (`/auth/recover`) sigue siendo la tarea aparte; los tests están en skip.

Contrato para el frontend: [readme-frontend.md](./readme-frontend.md).

## Obras

La obra es el proyecto del centro de formación, no de la bodega. Al crearla se guarda
`id_cformacion` del usuario logueado. Solo un administrador puede mandar `idCformacion` para
crearla en otro centro. Admin bodega hace el CRUD. El instructor solo la consulta para
colgar ahí la solicitud.

- Columnas: `nombre`, `lugar`, `id_cformacion` y `estado`.
- `DELETE` apaga la obra (`estado = false`). Sigue en la base para que las solicitudes no queden
  huérfanas. El listado normal esconde las apagadas; `?estado=false` las muestra.
- No se repite el nombre dentro de un mismo centro (`uq_obra_centro_nombre`): responde 409.
- Una obra de otro centro no aparece en el listado, y por id responde 403.

| Método | Ruta | Permiso | Body / query |
| --- | --- | --- | --- |
| GET | `/api/v1/obras` | `obra.ver` | `?estado=true\|false`, `?idCformacion=` (solo admin) |
| POST | `/api/v1/obras` | `obra.crear` | `{ nombre, lugar?, estado?, idCformacion? }` |
| GET | `/api/v1/obras/:id` | `obra.ver` | |
| PATCH | `/api/v1/obras/:id` | `obra.editar` | `{ nombre?, lugar?, estado? }` (cambiar `estado` pide `obra.eliminar`) |
| DELETE | `/api/v1/obras/:id` | `obra.eliminar` | apaga la obra |

Respuesta: `{ "data": { "id", "idCformacion", "nombre", "lugar", "estado" } }`.

## Entrega de materiales

Dos procesos, dos tablas (`solicitud_material` y `solicitud_equipo`). Cada salida de bodega
queda en `entrega` y cada devolución, con su estado, en `devolucion`. El elemento trae
`cantidad` (lo que hay en estante) y `disponible` (esa cantidad menos lo que otras solicitudes
todavía esperan recibir; nunca baja de 0).

**Instructor** (`instructor@correo.com`), desde cualquier lado:

1. `POST /solicitudes` con varios elementos del mismo tipo, como una factura (ver abajo). Es el
   flujo normal.
2. `POST /solicitudes-material` o `POST /solicitudes-equipo` siguen sirviendo para pedir un solo
   elemento.

**Admin bodega**:

1. CRUD de obras.
2. `GET /solicitudes-material?estado=pendiente` (o `parcial`) y
   `PATCH /solicitudes-material/:id/entregar`.
3. `GET /solicitudes-equipo?estado=pendiente` (o `parcial`) y
   `PATCH /solicitudes-equipo/:id/entregar`.
4. Cuando el instructor trae el equipo, `PATCH /solicitudes-equipo/:id/devolver` (ver
   "Devolución con novedad").
5. Si el instructor llega sin poder usar la app, le registra la solicitud en el mostrador (ver
   "Solicitud desde bodega").

La solicitud nace `pendiente` y no mueve el inventario. **Se puede pedir más de lo que hay**: si
piden 10 y hay 7, la solicitud se guarda por 10. Al entregar salen los 7 del estante, la fila
queda `parcial` con 3 pendientes y el instructor recibe "Te entregaron 7 de … Quedan 3
pendientes.". Cuando llegue más stock, bodega vuelve a llamar `/entregar` y sale lo que falte.
El instructor no puede entregar ni registrar la devolución. Admin bodega no pide para sí mismo.

Body de `/entregar` (opcional, en las dos): `{ cantidad?, observacion? }`. Sin `cantidad` sale
todo lo que falte, hasta donde alcance el estante. Con `cantidad` sale esa (422
`E_CANTIDAD_INVALIDA` si es más de lo que falta). Si el estante está en 0 responde 422
`E_SIN_STOCK`. El `message` de la respuesta dice cuánto quedó pendiente.

| Método | Ruta | Permiso |
| --- | --- | --- |
| GET | `/api/v1/solicitudes-material` | `solicitud_material.ver` |
| POST | `/api/v1/solicitudes-material` | `solicitud_material.crear` |
| GET | `/api/v1/solicitudes-material/:id` | `solicitud_material.ver` |
| PATCH | `/api/v1/solicitudes-material/:id/entregar` | `solicitud_material.entregar` |
| GET | `/api/v1/solicitudes-equipo` | `solicitud_equipo.ver` |
| POST | `/api/v1/solicitudes-equipo` | `solicitud_equipo.crear` |
| GET | `/api/v1/solicitudes-equipo/:id` | `solicitud_equipo.ver` |
| PATCH | `/api/v1/solicitudes-equipo/:id/entregar` | `solicitud_equipo.entregar` |
| PATCH | `/api/v1/solicitudes-equipo/:id/devolver` | `solicitud_equipo.devolver` |

Body de alta, en las dos: `{ codigoSolicitud, idObra, idElemento, cantidad, ficha?, observacion? }`.

Estados de material: `pendiente` (nada entregado), `parcial` (falta parte), `entregado`.
Estados de equipo: `pendiente`, `parcial`, `entregado` (todo entregado, algo sigue afuera) y
`devuelto` (todo entregado y todo de vuelta). Mientras falte algo por entregar la fila sigue
`parcial`, aunque lo que salió ya haya vuelto.

Cada fila trae `cantidad`, `cantidadEntregada`, `cantidadPendiente` y, si es equipo,
`cantidadDevuelta` y `cantidadAfuera`. También `entregas[]` (`cantidad`, `fecha`,
`observacion`, `entregadoPor`) y, si es equipo, `devoluciones[]` (`cantidad`,
`estadoElemento`, `fecha`, `observacion`, `recibidoPor`).

### Devolución con novedad

`PATCH /api/v1/solicitudes-equipo/:id/devolver`. Se devuelve lo que está afuera (entregado menos
devuelto), por partes si hace falta, y aunque la fila siga `parcial`.

```json
{ "detalle": [
    { "estadoElemento": "bueno", "cantidad": 5 },
    { "estadoElemento": "danado", "cantidad": 2, "observacion": "Mandril partido" }
  ],
  "observacion": "Regresa de la obra" }
```

- Estados: `bueno`, `danado`, `perdido`, `en_reparacion`. Un estado no se repite en `detalle`.
- Lo `bueno` vuelve al estante. Lo demás queda como novedad y no suma stock.
- Atajo de antes, sigue sirviendo: `{ estadoElemento, cantidad?, observacion? }`. Sin
  `cantidad` devuelve todo lo que está afuera.
- Si suman más de lo que está afuera: 422 `E_CANTIDAD_INVALIDA`.
- `estadoElemento` de la fila queda con el peor estado recibido
  (`perdido` > `danado` > `en_reparacion` > `bueno`).

### Solicitud con varios elementos (factura)

No hay tabla nueva. Una solicitud es de un solo tipo: `tipo: "consumo"` guarda todas las filas en
`solicitud_material` y `tipo: "devolutivo"` en `solicitud_equipo`. Todas comparten el
`codigoSolicitud`. Ese código es el número de la factura: no se repite dentro del centro (409
`E_CODIGO_REPETIDO`). Para pedir consumo y devolutivo se hacen dos solicitudes.

| Método | Ruta | Permiso | Body / query |
| --- | --- | --- | --- |
| GET | `/api/v1/solicitudes` | `solicitud_material.ver` o `solicitud_equipo.ver` | `?estado=pendiente\|parcial\|entregado\|cerrado` |
| POST | `/api/v1/solicitudes` | `solicitud_material.crear` (consumo) o `solicitud_equipo.crear` (devolutivo) | ver abajo |
| GET | `/api/v1/solicitudes/:codigo` | `solicitud_material.ver` o `solicitud_equipo.ver` | el código va con `encodeURIComponent` |

```json
{
  "codigoSolicitud": "SOL-0001",
  "idObra": 3,
  "tipo": "consumo",
  "ficha": "2758963",
  "observacion": "Para el taller",
  "elementos": [
    { "idElemento": 25, "cantidad": 5, "observacion": "Grano 120" },
    { "idElemento": 26, "cantidad": 3 }
  ]
}
```

- Todos los elementos deben ser del `tipo` de la solicitud. Si uno no lo es, responde 422
  `E_TIPO_DISTINTO` (`"Pulidora es devolutivo y esta solicitud es de consumo"`).
- Entre 1 y 100 filas. Un elemento no se repite en la misma solicitud (422): suma la cantidad en
  la misma fila.
- Todo entra o nada entra. Si una fila falla, no se guarda ninguna, y el mensaje dice cuál
  (`"Lija #120: el elemento no está activo"`). La falta de stock ya no es un fallo: se entrega
  por partes.
- La `observacion` de la fila gana. Si la fila no trae, se copia la del encabezado.
- Bodega recibe un solo aviso con todas las filas de su bodega, no uno por fila. El
  `idReferencia` apunta a la primera fila; con su `codigoSolicitud` el front abre la factura.

Respuesta:

```json
{
  "data": {
    "codigoSolicitud": "SOL-0001",
    "tipo": "consumo",
    "estado": "pendiente",
    "fecha": "...",
    "ficha": "2758963",
    "idObra": 3,
    "obra": { "id": 3, "nombre": "...", "lugar": "..." },
    "idUsuario": 7,
    "usuario": { "id": 7, "nombres": "...", "apellidos": "...", "email": "..." },
    "registradaEnBodega": false,
    "registradaPor": null,
    "totales": {
      "lineas": 2, "pendientes": 2, "parciales": 0, "entregadas": 0, "devueltas": 0,
      "cantidad": 8, "cantidadEntregada": 0, "cantidadPendiente": 8, "cantidadAfuera": 0
    },
    "detalle": [
      {
        "id": 41, "tipo": "material", "idElemento": 25,
        "elemento": { "id": 25, "nombre": "...", "codigo": "...", "cantidad": 20 },
        "cantidad": 5, "cantidadEntregada": 0, "cantidadPendiente": 5,
        "cantidadDevuelta": null, "cantidadAfuera": null,
        "estado": "pendiente", "estadoElemento": null, "observacion": "Grano 120",
        "fechaEntrega": null, "fechaDevolucion": null, "usuarioEntrega": null,
        "entregas": [], "devoluciones": []
      }
    ]
  }
}
```

Bodega entrega y recibe fila por fila con las rutas de siempre: `detalle[].tipo` dice cuál.
`material` → `PATCH /solicitudes-material/:id/entregar`. `equipo` →
`PATCH /solicitudes-equipo/:id/entregar` y `/devolver`.

Estado de la factura: `pendiente` (nada entregado), `parcial` (falta algo por entregar),
`entregado` (solo devolutivo: no queda nada por entregar, pero hay equipo afuera) y `cerrado`
(todo entregado y, si es devolutivo, todo devuelto). Cada quien ve las filas que ya veía: el
instructor las suyas y bodega las de sus stands.

### Solicitud desde bodega (mostrador)

Para el instructor que llega a bodega sin celular o sin acceso. Admin bodega le pide el
documento, lo busca, arma la misma solicitud (consumo o devolutivo) y le entrega en el mismo
paso lo que haya en el estante. Lo que falte queda pendiente como en cualquier solicitud. La
solicitud queda a nombre del instructor: él la ve en su app y recibe el aviso.

| Método | Ruta | Permiso | Qué hace |
| --- | --- | --- | --- |
| GET | `/api/v1/solicitudes/solicitantes/:documento` | `solicitud_material.entregar` o `solicitud_equipo.entregar` | busca a la persona por número de documento, solo en el centro propio (404 si no está) |
| POST | `/api/v1/solicitudes/bodega` | `solicitud_material.entregar` (consumo) o `solicitud_equipo.entregar` (devolutivo) | registra y entrega |

Respuesta de la búsqueda: `{ id, nombres, apellidos, tipoDocumento, numeroDocumento, email,
activo, puedeConsumo, puedeDevolutivo }`. Con `puedeConsumo` / `puedeDevolutivo` el front sabe
qué tipo de solicitud ofrecer.

Body del registro: el mismo de `POST /solicitudes` más `numeroDocumento`.

```json
{
  "numeroDocumento": "1001001005",
  "codigoSolicitud": "SOL-0002",
  "idObra": 3,
  "tipo": "devolutivo",
  "elementos": [{ "idElemento": 12, "cantidad": 10 }]
}
```

- Responde 201 con la factura. `registradaEnBodega: true` y `registradaPor` dice quién la hizo.
  Cada fila ya trae lo entregado y lo pendiente.
- Solo elementos de los stands de las bodegas de quien registra (403 si no).
- 422 `E_SOLICITANTE_INVALIDO` si el documento es el propio o si esa persona no tiene permiso
  para ese tipo de solicitud. 422 `E_USUARIO_INACTIVO` si su cuenta está inactiva.
- El instructor recibe un solo aviso: "Andrea Bodega registró a tu nombre la solicitud SOL-0002
  para … Te entregaron 7 de Taladro. Quedan pendientes 3 de Taladro."

### Historial de entregas

`GET /api/v1/entregas` (`solicitud_material.ver` o `solicitud_equipo.ver`). Una fila por cada
salida de bodega, la más reciente primero. Paginado: `page`, `perPage` (máx. 100). Filtros:
`tipo=material|equipo` y `documento` (número de documento del instructor). El instructor ve las
suyas; bodega, las de sus stands.

```json
{
  "id": 9, "cantidad": 7, "fecha": "...", "observacion": null,
  "entregadoPor": { "id": 4, "nombres": "Andrea", "apellidos": "Bodega", "email": "..." },
  "tipo": "equipo",
  "solicitud": {
    "id": 41, "codigoSolicitud": "SOL-0002", "estado": "parcial",
    "cantidad": 10, "cantidadEntregada": 7, "cantidadPendiente": 3,
    "cantidadDevuelta": 0, "cantidadAfuera": 7,
    "usuario": { "...": "el instructor" },
    "elemento": { "id": 12, "nombre": "Taladro", "codigo": "..." },
    "obra": { "id": 3, "nombre": "...", "lugar": "..." }
  }
}
```

Archivos: `obra_service.ts`, `solicitud_service.ts`, `solicitud_material_service.ts`,
`solicitud_equipo_service.ts`, `entrega_service.ts`, `disponibilidad_service.ts`,
`tests/functional/obras.spec.ts`, `tests/functional/flujo_entrega.spec.ts`,
`tests/functional/solicitudes.spec.ts`, `tests/functional/entregas_parciales.spec.ts`.

## Alertas y notificaciones

Cada aviso queda guardado en `notificacion` (la bandeja de cada usuario) y además se empuja en
vivo con Transmit. Si la persona no está conectada, lo ve al volver a entrar.

| Qué pasa | Tipo | Le llega a |
| --- | --- | --- |
| Un instructor pide material | `solicitud_material` | quien puede entregar en esa bodega |
| Un instructor pide equipo | `solicitud_equipo` | quien puede entregar en esa bodega |
| Admin bodega entrega material (todo o en parte) | `entrega_material` | el instructor que lo pidió |
| Admin bodega entrega equipo (todo o en parte) | `entrega_equipo` | el instructor que lo pidió |
| Admin bodega registra la solicitud en el mostrador | `entrega_material` o `entrega_equipo` | el instructor a cuyo nombre quedó |
| Admin bodega recibe el equipo devuelto | `devolucion_equipo` | el instructor que lo pidió |
| La cantidad llega a `cantidadMinima` | `por_agotarse` | quien tiene `alerta.ver` y esa bodega asignada (Admin bodega) |
| La cantidad llega a 0 | `agotado` | quien tiene `alerta.ver` y esa bodega asignada (Admin bodega) |

El instructor solo recibe los avisos de sus propias solicitudes. No tiene `alerta.ver`.

El aviso de stock sale una vez cuando se abre la alerta y otra si pasa de `por_agotarse` a
`agotado`. Mientras la alerta sigue abierta no se repite. Cuando la cantidad vuelve a pasar el
mínimo, la alerta se cierra sola. Crear un elemento que ya nace en el mínimo abre la alerta,
pero no manda aviso. Quien hace la acción no se avisa a sí mismo.

| Método | Ruta | Permiso | Qué hace |
| --- | --- | --- | --- |
| GET | `/api/v1/account/notifications` | sesión | bandeja propia, paginada. Query: `page`, `perPage` (máx. 100), `leida` |
| PATCH | `/api/v1/account/notifications` | sesión | marca todas. Body `{ leida: true }`. Responde `{ data: { total } }` |
| PATCH | `/api/v1/account/notifications/:id` | sesión | marca una. Body `{ leida: true \| false }`. Si no es tuya, 404 |
| GET | `/api/v1/inventario/alertas` | `alerta.ver` | alertas activas de las bodegas que ves. `estado=false` trae las cerradas |

Notificación: `{ id, tipo, titulo, mensaje, leida, recurso, idReferencia, fecha }`. `recurso` es
`alerta`, `solicitud_material` o `solicitud_equipo`, y `idReferencia` es el id de esa fila: con eso
el front abre el detalle.

Alerta: `{ id, idElemento, tipo, cantidad, cantidadMinima, estado, fecha, elemento: { id, nombre, codigo } }`.

**En vivo**, con `@adonisjs/transmit-client` en el front:

```ts
import { Transmit } from '@adonisjs/transmit-client'

const transmit = new Transmit({
  baseUrl: 'http://localhost:3333',
  beforeSubscribe: (request) => {
    request.headers.set('Authorization', `Bearer ${token}`)
  },
})

const canal = transmit.subscription(`notificaciones/${usuario.id}`)
await canal.create()
canal.onMessage((aviso) => {
  // misma forma que un elemento de GET /account/notifications
})
```

El canal es `notificaciones/:idUsuario`. Solo puedes suscribirte al tuyo: el de otro responde 400 y
sin token responde 401. Al cerrar sesión llama `canal.delete()`.

Archivos: `notificacion_service.ts`, `alerta_service.ts`, `start/transmit.ts`,
`tests/functional/notificaciones.spec.ts`.

