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
para que el front oculte botones sin adivinar. Al Administrador le llega el catálogo completo.

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

Dos procesos, dos tablas. La devolución no es otra tabla: es el estado de `solicitud_equipo`.
El elemento trae `cantidad` (lo que hay en estante) y `disponible` (esa cantidad menos lo que
ya está pedido y sigue `pendiente`).

**Instructor** (`instructor@correo.com`), desde cualquier lado:

1. `POST /solicitudes-material` para un elemento de carácter `consumo`, asociado a una obra.
2. `POST /solicitudes-equipo` para un elemento de carácter `devolutivo`, asociado a una obra.
3. `PATCH /solicitudes-equipo/:id/devolver` cuando el equipo ya fue entregado. Body:
   `{ estadoElemento: "bueno" \| "danado" \| "perdido" \| "en_reparacion", observacion? }`.
   Si vuelve `bueno`, la cantidad regresa al inventario. En los otros estados queda descontada.

**Admin bodega**:

1. CRUD de obras.
2. `GET /solicitudes-material?estado=pendiente` y `PATCH /solicitudes-material/:id/entregar`.
3. `GET /solicitudes-equipo?estado=pendiente` y `PATCH /solicitudes-equipo/:id/entregar`.

La solicitud nace `pendiente` y no mueve el inventario. Si no alcanza, responde 422
`E_SIN_STOCK` con cuántos hay disponibles, contando también los pedidos pendientes. La
entrega descuenta `cantidad`. El instructor no puede entregar. Admin bodega no puede pedir
ni devolver.

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
Estados de material: `pendiente`, `entregado`. Estados de equipo: `pendiente`, `entregado`, `devuelto`.

Archivos: `obra_service.ts`, `solicitud_material_service.ts`, `solicitud_equipo_service.ts`,
`disponibilidad_service.ts`, `tests/functional/obras.spec.ts`, `tests/functional/flujo_entrega.spec.ts`.

