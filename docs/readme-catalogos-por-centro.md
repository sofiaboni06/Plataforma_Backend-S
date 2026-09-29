# Catálogos del elemento por centro

Guía para el frontend. Clasificación, unidad de medida, código UNSPSC y uso presupuestal ya no son listas globales. Cada centro de formación tiene las suyas. Un centro nuevo llega vacío.

Prefijo: `/api/v1`. Header: `Authorization: Bearer <token>`. Las respuestas van en `{ "data": ... }`.

## Regla

Dos bodegas del **mismo** centro comparten catálogo. Una bodega de **otro** centro no lo ve.

El id que importa es `idCformacion` de la bodega donde se va a guardar el elemento, no el id de la bodega.

`GET /bodegas` (y el detalle) traen ese dato:

```json
{
  "id": 9,
  "idCformacion": 2,
  "nombre": "Bodega nueva",
  "centroFormacion": { "id": 2, "nombre": "..." }
}
```

El login y el perfil traen `trainingCenterId` y `bodegas: [{ id, name }]`. Esas bodegas del perfil **no** traen `idCformacion`. Para los selects hay que usar la bodega de `GET /bodegas`, o `trainingCenterId` si la persona no es admin y solo trabaja en su centro.

## Pantalla de crear elemento

1. El usuario elige bodega (o el stand, y de ahí se sabe la bodega).
2. Con `bodega.idCformacion` se piden los cuatro selects. Si cambia la bodega y el centro es otro, se vuelven a pedir y se limpian los ids ya elegidos.
3. Al guardar el elemento se mandan los `id` de esas listas, no el texto ni el código UNSPSC escrito a mano.

```
GET /clasificaciones-elemento?idCformacion=2
GET /unidades-medida?idCformacion=2
GET /codigos-estandar?idCformacion=2
GET /usos-presupuestales?idCformacion=2
```

Cada uno responde un arreglo, sin paginar, solo filas activas, ordenadas por nombre:

```json
{
  "data": [
    { "id": 4, "idCformacion": 2, "nombre": "HERRAMIENTA", "estado": true }
  ]
}
```

UNSPSC:

```json
{ "id": 8, "idCformacion": 2, "codigo": "13111305", "nombre": "RESINA O ESPUMA" }
```

Unidad:

```json
{ "id": 1, "idCformacion": 2, "nombre": "Unidad", "abreviatura": "UND", "estado": true }
```

Si `data` llega `[]`, el centro no tiene ese catálogo. El select se muestra vacío, con un texto del estilo "Este centro no tiene clasificaciones". No se rellenan con las de otro centro.

Quién ve qué:

- Quien no es admin ignora `?idCformacion=` y solo ve su centro. Mandarlo igual no hace daño.
- El admin, si no manda `idCformacion`, ve el centro de su propia cuenta. En el alta de un elemento de otra bodega **hay que mandarlo**. Si no, el select muestra el centro del admin y al guardar la API responde 422.

`idUnidadMedida` es obligatorio para crear el elemento. Clasificación, UNSPSC y uso presupuestal son opcionales.

En el POST del elemento:

| Campo del body | De dónde sale |
| --- | --- |
| `codigo` | Texto que inventa el usuario. Código interno del inventario, máximo 50. No es el UNSPSC. |
| `idUnidadMedida` | `id` de `/unidades-medida` |
| `idClasificacion` | `id` de `/clasificaciones-elemento` |
| `idCodigoEstandar` | `id` de `/codigos-estandar`. No se manda `"13111305"`. |
| `idUsoPresupuestal` | `id` de `/usos-presupuestales`. Es la partida, no el UNSPSC. |

Si uno de esos ids es de otro centro distinto al stand, la API responde **422** con `code: "E_CATALOGO_OTRO_CENTRO"`. El ítem de otro centro responde `E_ITEM_OTRO_CENTRO`. El mensaje viene en `message`.

## Pantalla para llenar un centro nuevo

Sin estas filas no se puede crear un elemento, porque la unidad es obligatoria. Hace falta una pantalla (o un alta rápida desde el select vacío) para crearlas en ese centro.

El botón se muestra solo si el permiso está en `permissions` del login.

| Catálogo | Ver | Crear | Editar | Deshabilitar |
| --- | --- | --- | --- | --- |
| Clasificación | `clasificacion_elemento.ver` | `.crear` | `.editar` | `.eliminar` |
| Uso presupuestal | `uso_presupuestal.ver` | `.crear` | `.editar` | `.eliminar` |
| Unidad | `unidad_medida.ver` | `.crear` | `.editar` | `.eliminar` |
| Código UNSPSC | `elemento.ver` | `codigo_estandar.crear` | `.editar` | `.eliminar` |

No existe `codigo_estandar.ver`. Quien puede ver elementos puede listar los UNSPSC.

### Crear

`idCformacion` en el body solo lo usa el admin. Cualquier otro perfil crea la fila en su centro, aunque mande otro número.

Clasificación — `POST /clasificaciones-elemento`

```json
{ "nombre": "HERRAMIENTA", "idCformacion": 2 }
```

`nombre` 1–150. `estado` opcional, queda en `true`.

Uso presupuestal — `POST /usos-presupuestales`

```json
{ "nombre": "Herramientas y Maquinaria General", "idCformacion": 2 }
```

`nombre` 1–200.

Unidad — `POST /unidades-medida`

```json
{ "nombre": "Unidad", "abreviatura": "UND", "idCformacion": 2 }
```

`nombre` 1–80. `abreviatura` 1–20. Las dos son obligatorias.

Código UNSPSC — `POST /codigos-estandar`

```json
{ "codigo": "13111305", "nombre": "RESINA O ESPUMA", "idCformacion": 2 }
```

`codigo` 1–20. `nombre` 1–200.

Nombre o código repetido **en el mismo centro** responde **409**. En otro centro sí se puede repetir.

### Editar y apagar

`PATCH /clasificaciones-elemento/:id` con `{ "nombre" }` y, si aplica, `{ "estado": false }`.

Igual para `/usos-presupuestales/:id` y `/unidades-medida/:id` (`nombre`, `abreviatura`, `estado`).

`PATCH /codigos-estandar/:id` con `{ "codigo", "nombre" }`. El UNSPSC no tiene `estado`.

No se puede mover una fila a otro centro. El PATCH no lleva `idCformacion`.

`DELETE` de clasificación, uso y unidad no borra la fila: deja `estado` en `false` y desaparece del select. Si ya estaba apagada, responde 409.

`DELETE /codigos-estandar/:id` sí borra la fila. Si algún elemento la usa, responde 409 y no se borra.

Apagar o borrar una fila de otro centro, si quien entra no es admin, responde 403.

## Checklist

- [ ] Al elegir bodega, leer `idCformacion` de `GET /bodegas`, no del arreglo `bodegas` del login.
- [ ] Pedir los cuatro GET con `?idCformacion=` de esa bodega.
- [ ] Si el centro cambia, vaciar los selects y volver a pedirlos.
- [ ] Lista vacía: mensaje de centro sin datos y botón de crear si hay permiso.
- [ ] Guardar los `id` numéricos. El código interno va en `codigo`. El UNSPSC va en `idCodigoEstandar`.
- [ ] Mostrar el 422 cuando el id no es del centro del stand.
