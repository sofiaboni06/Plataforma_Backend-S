# README para el frontend

Contrato de la API para armar las mismas pantallas que ya cubre este backend. Prefijo de todo: `/api/v1`. JSON en camelCase. Cada respuesta va envuelta en `{ "data": ... }`. Los listados paginados agregan `meta` (`total`, `perPage`, `currentPage`, `lastPage`).

Header de las rutas privadas:

```
Authorization: Bearer <token>
```

Cuentas del dump, contraseña `123456`:

| Correo | Perfil |
| --- | --- |
| `carlos@correo.com` | Administrador |
| `juan@correo.com` | Almacenista |
| `maria@correo.com` | Funcionario |
| `adminbodega@correo.com` | Admin bodega (la crea `db:seed`) |

El perfil se llama como el Administrador quiera. En Perfiles marca el módulo Inventario y, debajo, las funciones: solo elementos, solo stands, o **Agregar como admin bodega**. Esa opción deja ver y manejar el inventario de la bodega asignada, sin `bodega.crear` ni `bodega.eliminar`. En Usuarios se elige ese perfil, el centro, y se marca la bodega.

## Dos cadenas distintas

Subcategoría clasifica el producto y cuelga de la categoría. Sub-bodega es el tipo de material dentro de la bodega, y el stand cuelga de ella. No son la misma cosa.

### Producto: categoría → subcategoría → ítem → elemento

`GET/POST /subcategorias` y `GET/PATCH /subcategorias/:id`. Permisos `subcategoria.ver`, `subcategoria.crear`, `subcategoria.editar`.

- Categorías. El alta es nombre, estado y centro (`POST /categorias`). La subcategoría se guarda aparte, con `idCategoria`, en `POST /subcategorias`.
- Listado de categorías. La columna de subcategorías sale de `GET /subcategorias`, no del objeto de la categoría. El botón de inhabilitar se queda: `categoria.eliminar` y `DELETE /categorias/:id`. Si todavía hay subcategorías activas, se muestra el 409.
- Ítems. `GET /subcategorias` para el select. Al crear o editar se envía `idSubcategoria`. La tabla muestra categoría y subcategoría que devuelve la API.
- Elementos. El listado y el detalle traen `subcategoria` (con su `categoria`) y lo mismo dentro de `item.subcategoria`. No hace falta armarlo a mano.

No hay `DELETE /subcategorias`. Para apagar una se manda `PATCH` con `{ "estado": false }`.

### Ubicación: bodega → sub-bodega → stand → elemento

No hay permisos `sub_bodega.*`. Crear, ver, editar y borrar sub-bodegas usa los de bodega: `bodega.ver`, `bodega.crear`, `bodega.editar`, `bodega.eliminar`.

| Método | Ruta |
| --- | --- |
| `GET/POST` | `/bodegas/:id/sub-bodegas` |
| `GET/PATCH/DELETE` | `/bodegas/sub-bodegas/:id` |

Crear sub-bodega: `{ "nombre": "Madera" }`. `estado` es opcional y queda en `true`.

El stand se crea sobre esa sub-bodega: `POST /bodegas/sub-bodegas/:id/stands` con `{ "nombre" }`. Borrar una sub-bodega que todavía tiene stands responde 409. Borrar una bodega que todavía tiene sub-bodegas responde 409.

## Cómo ocultar botones

`POST /auth/login` y `GET /account/profile` devuelven:

- `permissions`: códigos `recurso.accion`, por ejemplo `item.crear`, `bodega.eliminar`.
- `isAdmin`: el Administrador trae el catálogo completo y no se le filtra por centro ni por bodega.
- `bodegas` y `bodegaIds`: bodegas asignadas a esa persona.

Si el código no está en `permissions`, el botón no se muestra. Un 403 igual puede llegar si el perfil no tiene el módulo Inventario o la bodega no es suya.

Códigos que usa esta API:

| Recurso | Acciones |
| --- | --- |
| `bodega` | `ver` `crear` `editar` `eliminar` |
| `stand` | `ver` `crear` `editar` `eliminar` |
| `categoria` | `ver` `crear` `editar` `eliminar` |
| `subcategoria` | `ver` `crear` `editar` |
| `item` | `ver` `crear` `editar` `eliminar` |
| `elemento` | `ver` `crear` `editar` |
| `clasificacion_elemento` | `ver` `crear` `editar` `eliminar` |
| `uso_presupuestal` | `ver` `crear` `editar` `eliminar` |
| `unidad_medida` | `ver` `crear` `editar` `eliminar` |
| `codigo_estandar` | `crear` `editar` `eliminar` |

`GET /permissions` (solo admin) devuelve el árbol para los checkboxes: `data.modules[]` → `resources[]` → `permissions[]` con `code`, `action`, `actionLabel`, `name`.

Errores habituales: `401` sin token, `403` sin permiso, `422` validación (`errors[]`), `409` cuando no se puede borrar o deshabilitar porque todavía hay hijos.

## Sesión

### `POST /auth/login`

```json
{ "email": "carlos@correo.com", "password": "123456" }
```

`data` trae el usuario (mismo contrato que el perfil) y `token`.

### `GET /account/profile` y `PATCH /account/profile`

El PATCH solo cambia `nombres`, `apellidos`, `tipoDocumento`, `numeroDocumento`, `email`.

### `PATCH /account/password`

```json
{
  "currentPassword": "123456",
  "password": "NuevaClave1",
  "passwordConfirmation": "NuevaClave1"
}
```

### `POST /account/logout`

Revoca el token.

## Admin: perfiles, permisos y usuarios

Solo Administrador.

| Método | Ruta | Body |
| --- | --- | --- |
| `GET/POST` | `/roles` | crear: `{ "name", "description?" }` |
| `GET/PATCH` | `/roles/:id` | el GET trae `moduleIds`, `permissionCodes` y `tree` |
| `PUT` | `/roles/:id/modules` | `{ "moduleIds": [1, 2] }`. Quitar un módulo revoca sus permisos |
| `PUT` | `/roles/:id/permissions` | `{ "permissionCodes": ["item.crear", "elemento.ver"] }` |
| `GET` | `/permissions` | catálogo de checkboxes |
| `GET` | `/users/options` | `{ roles, centers, bodegas }` para los selects |
| `GET/POST` | `/users` | ver body de abajo |
| `GET/PATCH` | `/users/:id` | |
| `PUT` | `/users/:id/bodegas` | `{ "bodegaIds": [1, 3] }`. Solo bodegas del centro de ese usuario |

Crear usuario:

```json
{
  "nombres": "Ana",
  "apellidos": "López",
  "tipoDocumento": "CC",
  "numeroDocumento": "100200300",
  "email": "ana@correo.com",
  "password": "clave123",
  "passwordConfirmation": "clave123",
  "idPerfil": 2,
  "idCformacion": 1,
  "bodegaIds": [1]
}
```

La ficha de admin devuelve `roleId`, `trainingCenterId`, `active`, `bodegaIds` y `bodegas: [{ id, name }]`.

## Inventario

Quien no es admin solo ve datos de su centro y de las bodegas que le asignaron.

### Categorías

`GET/POST /categorias`, `GET/PATCH/DELETE /categorias/:id`.

Listado: activas. `?estado=false` muestra las deshabilitadas.

```json
{ "nombre": "Pinturas", "estado": true }
```

`idCformacion` en el POST solo lo respeta el admin. `DELETE` no borra la fila: deja `estado` en `false`. Responde 409 si todavía tiene subcategorías activas.

Objeto: `{ id, idCformacion, nombre, estado }`.

### Subcategorías

`GET/POST /subcategorias`, `GET/PATCH /subcategorias/:id`. Permisos `subcategoria.ver`, `subcategoria.crear` y `subcategoria.editar`.

```json
{ "idCategoria": 2, "nombre": "Vinilos", "estado": true }
```

Quien no es admin solo ve y escribe subcategorías de las categorías de su centro. No hay `DELETE`: para apagarla se manda `{ "estado": false }`.

Objeto: `{ id, idCategoria, nombre, estado }`.

### Items

La ficha del producto. El nombre es lo específico, por ejemplo "pintura para techos vinilo color rojo".

`GET/POST /inventario/items`, `GET/PATCH/DELETE /inventario/items/:id`.

Query del listado: `page`, `perPage` (máx. 100, default 20), `search`, `estado`, `idSubcategoria`.

```json
{
  "nombre": "Pintura para techos vinilo color rojo",
  "descripcion": "Vinilo para techo, acabado mate",
  "idSubcategoria": 4
}
```

Respuesta:

```json
{
  "id": 12,
  "nombre": "Pintura para techos vinilo color rojo",
  "descripcion": "Vinilo para techo, acabado mate",
  "idSubcategoria": 4,
  "estado": true,
  "subcategoria": {
    "id": 4,
    "nombre": "Vinilos",
    "idCategoria": 2,
    "categoria": { "id": 2, "nombre": "Pinturas" }
  }
}
```

`DELETE` deshabilita. 409 si el item tiene elementos activos, o si ya estaba deshabilitado.

### Elementos

El stock de un item. `GET/POST /inventario/elementos`, `GET/PATCH /inventario/elementos/:id`. No hay `DELETE`.

```json
{
  "idItem": 12,
  "idStand": 3,
  "cantidad": 10,
  "gramaje": 1.5,
  "estado": true,
  "idUnidadMedida": 1,
  "codigo": "VIN-TECHO-01",
  "marca": "Pintuco",
  "color": "Rojo",
  "descripcion": "opcional",
  "urlFotografia": "opcional",
  "idClasificacion": 2,
  "valorUnitarioPromedio": 1000,
  "porcentajeAumento": 15,
  "idCodigoEstandar": 8,
  "idUsoPresupuestal": 1,
  "cantidadMinima": 10
}
```

Reglas:

- `cantidad` mínima 10. Menos de eso es 422. Es la existencia, lo que hay en el stand.
- `cantidadMinima` es el umbral de la alerta. Si no se manda, queda en 10. Puede ser 0. No es lo mismo que `cantidad`.
- `idItem` es obligatorio al crear. Nombre y subcategoría se copian del item; no se mandan aparte.
- `codigo` es el código propio del elemento y no se repite.
- `idClasificacion`, `idUsoPresupuestal`, valores y `idCodigoEstandar` pueden ir en el alta o en un PATCH posterior. Uso presupuestal es la partida de la plata, no el código UNSPSC.
- Esos ids, y también `idUnidadMedida`, tienen que ser del mismo centro que el stand. Si son de otro centro, la API responde 422.
- `valorConAumento` no se envía. Lo calcula el backend: cantidad × valor unitario × (1 + porcentaje / 100). Sale `null` hasta que existan valor y porcentaje. Ejemplo: cantidad 10, valor 1000, porcentaje 15 → `11500`.

La respuesta incluye `item` (con `subcategoria` y `categoria`), `subcategoria` (con `categoria`), `stand.subBodega.bodega`, `unidadMedida`, `clasificacion`, `codigoEstandar`, `usoPresupuestal` y `cantidadMinima`.

```json
{
  "idItem": 12,
  "item": {
    "id": 12,
    "nombre": "Pintura para techos vinilo color rojo",
    "subcategoria": {
      "id": 4,
      "nombre": "Vinilos",
      "categoria": { "id": 2, "nombre": "Pinturas" }
    }
  },
  "subcategoria": {
    "id": 4,
    "nombre": "Vinilos",
    "categoria": { "id": 2, "nombre": "Pinturas" }
  },
  "stand": {
    "id": 3,
    "nombre": "Estante 1",
    "subBodega": {
      "id": 7,
      "nombre": "Madera",
      "idBodega": 1,
      "bodega": { "id": 1, "nombre": "Bodega principal" }
    }
  }
}
```

### Bodega → sub-bodega → stand

La bodega es la del centro. La sub-bodega cuelga de ella y el stand cuelga de la sub-bodega.

| Método | Ruta | Notas |
| --- | --- | --- |
| `GET/POST` | `/bodegas` | `page`, `perPage` (default 10), `search`, `estado`, `idCformacion` (admin) |
| `GET/PATCH/DELETE` | `/bodegas/:id` | borrar con sub-bodegas → 409 |
| `GET/POST` | `/bodegas/:id/sub-bodegas` | permisos de bodega |
| `GET/PATCH/DELETE` | `/bodegas/sub-bodegas/:id` | borrar con stands → 409 |
| `GET/POST` | `/bodegas/sub-bodegas/:id/stands` | el id es de la sub-bodega |
| `GET/PATCH/DELETE` | `/bodegas/stands/:id` | borrar con elementos → 409 |

Crear bodega: `{ "nombre": "Bodega principal", "estado": true }`. El admin puede mandar `idCformacion`.

Crear sub-bodega: `{ "nombre": "Madera" }`.

Crear stand: `{ "nombre": "Estante 1" }`.

Bodega:

```json
{
  "id": 1,
  "idCformacion": 1,
  "nombre": "Bodega principal",
  "estado": true,
  "ubicacion": "Centro de Comercio y Servicios",
  "centroFormacion": { "id": 1, "nombre": "Centro de Comercio y Servicios" },
  "subBodegas": [],
  "totalSubBodegas": 0
}
```

Bodega, sub-bodega y stand sí se borran de la tabla, pero solo si están vacíos.

### Catálogos del elemento

Clasificación, uso presupuestal, código UNSPSC y unidad de medida pertenecen al **centro de formación**, no a la bodega y no son globales. Dos bodegas del mismo centro comparten catálogo. Un centro nuevo no trae filas: hay que crearlas ahí.

En el alta del elemento, los selects se piden con el `idCformacion` de la bodega elegida:

`GET /clasificaciones-elemento?idCformacion=2`

Quien no es admin ignora ese query y solo ve su centro. El admin, si no manda `idCformacion`, ve el centro de su propia cuenta.

Clasificación de la ficha (ACCESORIO, EPP, CONSUMO, ELEMENTO DE ASEO, …):

`GET/POST /clasificaciones-elemento`, `GET/PATCH/DELETE /clasificaciones-elemento/:id`.

```json
{ "nombre": "HERRAMIENTA", "idCformacion": 2 }
```

`idCformacion` en el POST solo lo respeta el admin. `DELETE` deshabilita. Objeto: `{ id, idCformacion, nombre, estado }`.

Uso presupuestal, la partida de la ficha (MINERALES; ELECTRICIDAD, GAS Y AGUA, …). No es el código UNSPSC:

`GET/POST /usos-presupuestales`, `GET/PATCH/DELETE /usos-presupuestales/:id`.

```json
{ "nombre": "Herramientas y Maquinaria General" }
```

`DELETE` deshabilita. Objeto: `{ id, idCformacion, nombre, estado }`.

Códigos UNSPSC. Ver con `elemento.ver`. Crear, editar y borrar con `codigo_estandar.crear`, `codigo_estandar.editar`, `codigo_estandar.eliminar`:

`GET/POST /codigos-estandar`, `GET/PATCH/DELETE /codigos-estandar/:id`.

```json
{ "codigo": "13111305", "nombre": "RESINA O ESPUMA", "idCformacion": 2 }
```

Objeto: `{ id, idCformacion, codigo, nombre }`. Borrar uno que ya usa un elemento responde 409.

Unidades de medida, permiso `unidad_medida.ver` / `crear` / `editar` / `eliminar`:

`GET/POST /unidades-medida`, `GET/PATCH/DELETE /unidades-medida/:id`.

```json
{ "nombre": "Unidad", "abreviatura": "UND", "estado": true }
```

`DELETE` deshabilita. Objeto: `{ id, idCformacion, nombre, abreviatura, estado }`.

## Orden de una pantalla de alta

1. Login y guardar `token`, `permissions`, `isAdmin`, `bodegas`.
2. Bodega del usuario. Con su `idCformacion`, pedir unidades, clasificaciones, usos presupuestales y códigos UNSPSC. Si el centro es nuevo, esos selects llegan vacíos.
3. Subcategoría con `GET /subcategorias`, o una que ya exista.
4. Bodega, sub-bodega con `POST /bodegas/:id/sub-bodegas`, y el stand sobre ese id.
5. Item con `idSubcategoria`. Mostrar `subcategoria.nombre` y `subcategoria.categoria.nombre` que devuelve la API.
6. Elemento con `idItem`, `idStand`, `cantidad` ≥ 10 y el resto de la ficha.
