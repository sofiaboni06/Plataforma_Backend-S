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
node ace db:seed         # llena permisos, y en el primer centro los UNSPSC, clasificaciones y usos. El perfil Admin bodega también. Un centro nuevo no hereda esos catálogos
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

El perfil `Administrador` se salta todas estas validaciones y ve todos los centros de formación.

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
| `GET/POST` | `/categorias` | categorías del centro. El listado oculta las deshabilitadas; `?estado=false` las muestra |
| `GET/PATCH/DELETE` | `/categorias/:id` | `DELETE` **deshabilita** (`estado=false`). Falla 409 si tiene subcategorías activas |
| `GET/POST` | `/subcategorias` | cuelga de la categoría: `idCategoria`, `nombre`, `estado?`. Quien no es admin solo ve las de su centro |
| `GET/PATCH` | `/subcategorias/:id` | no hay `DELETE`. Apagarla es `estado: false` |
| `GET/POST` | `/inventario/items` | ficha del producto: `nombre`, `descripcion`, `idSubcategoria`. El nombre es lo específico, por ejemplo "pintura para techos vinilo color rojo". `?idSubcategoria=` / `?search=` / `?estado=` |
| `GET/PATCH/DELETE` | `/inventario/items/:id` | `DELETE` deshabilita. Falla 409 si tiene elementos activos |
| `GET/POST` | `/inventario/elementos` | stock de un item. `idItem` obligatorio, `cantidad` mínimo 10, `cantidadMinima` opcional (default 10, umbral de alerta), `gramaje` opcional. Ficha: `idClasificacion`, `idUsoPresupuestal` (partida, no es el UNSPSC), `valorUnitarioPromedio`, `porcentajeAumento` (editable) y `idCodigoEstandar`. Esos ids tienen que ser del mismo centro que el stand. `valorConAumento` se calcula: cantidad × valor unitario × (1 + porcentaje / 100). Nombre y subcategoría se copian del item. `codigo` sigue siendo el código propio del elemento |
| `GET/PATCH` | `/inventario/elementos/:id` | |
| `GET/POST` | `/bodegas` | listado paginado: `{ data, metadata }`. La bodega es la del centro (`idCformacion`): cada centro solo ve la suya. Borrar una bodega con sub-bodegas responde 409 |
| `GET/PATCH/DELETE` | `/bodegas/:id` | |
| `GET/POST` | `/bodegas/:id/sub-bodegas` | la sub-bodega cuelga de la bodega. Permisos de bodega. Borrar una con stands responde 409 |
| `GET/PATCH/DELETE` | `/bodegas/sub-bodegas/:id` | |
| `GET/POST` | `/bodegas/sub-bodegas/:id/stands` | el stand cuelga de esa sub-bodega |
| `GET/PATCH/DELETE` | `/bodegas/stands/:id` | borrar un stand con elementos responde 409 |
| `GET/POST` | `/clasificaciones-elemento` | catálogo de la ficha del centro (ACCESORIO, EPP, …). `?idCformacion=` (solo admin). Un centro nuevo llega vacío. `POST` crea una en el centro de quien entra; el admin puede mandar `idCformacion`. `DELETE` la deshabilita |
| `GET/PATCH/DELETE` | `/clasificaciones-elemento/:id` | |
| `GET/POST` | `/usos-presupuestales` | partida del centro (MINERALES; ELECTRICIDAD, GAS Y AGUA, …). No es el código UNSPSC. Mismas reglas de centro que la clasificación |
| `GET/PATCH/DELETE` | `/usos-presupuestales/:id` | |
| `GET/POST` | `/codigos-estandar` | UNSPSC del centro. Ej. `{ idCformacion, codigo: "13111305", nombre: "RESINA O ESPUMA" }`. `GET` usa `elemento.ver`. Crear, editar y borrar usan `codigo_estandar.*`. Un centro nuevo llega vacío |
| `GET/PATCH/DELETE` | `/codigos-estandar/:id` | borrar con elementos que lo usan responde 409 |
| `GET/POST` | `/unidades-medida` | unidades del centro. `POST`: `nombre`, `abreviatura`. Un centro nuevo llega vacío. `DELETE` deshabilita |
| `GET/PATCH/DELETE` | `/unidades-medida/:id` | |

El login y `GET /account/profile` devuelven `permissions` (lista de códigos), `isAdmin` y `bodegas`,
para que el front oculte botones sin adivinar. Al Administrador le llega el catálogo completo.

Cuentas dump, password `123456`: Carlos Administrador, Juan Almacenista, María Funcionario.
`db:seed` agrega `adminbodega@correo.com` (Admin bodega): inventario de la bodega que tiene asignada. No crea ni borra bodegas.

Subcategoría y sub-bodega no se mezclan. La subcategoría clasifica el producto (`categoria` → `subcategoria` → item → elemento) y tiene CRUD en `/subcategorias`. La sub-bodega es la ubicación (`bodega` → `sub-bodega` → stand → elemento) y se crea, edita y borra con los permisos de bodega. El elemento copia nombre y subcategoría del item, y queda en el stand.

Categorías e items **no se borran de la base**: `DELETE` baja `estado`. La subcategoría se apaga con `estado: false`, sin `DELETE`. Bodegas, sub-bodegas y stands sí se borran de verdad, pero solo si están vacíos (409 si no). La bodega pertenece a un centro de formación. El Administrador la crea y se la asigna al usuario en Usuarios. Quien no es administrador solo ve esas bodegas. Si otro perfil con permiso de crear bodega crea una, queda asignada a él. Admin bodega no trae `bodega.crear` ni `bodega.eliminar`. Elementos todavía no tienen `DELETE`. Un elemento nuevo no puede quedar con cantidad menor a 10. Recuperar contraseña (`/auth/recover`) sigue siendo la tarea aparte; los tests están en skip.

Contrato para el frontend: [readme-frontend.md](./readme-frontend.md).
