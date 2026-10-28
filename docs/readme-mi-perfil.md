# Mi perfil

Contrato para la pantalla **Mi perfil** (información, contraseña y notificaciones). Prefijo: `/api/v1`. Todas las rutas llevan:

```
Authorization: Bearer <token>
```

La respuesta del perfil va en `{ "data": { ... } }`.

Cuenta de prueba del dump: `carlos@correo.com` / `123456`.

## Qué muestra la tarjeta y de dónde sale

`GET /account/profile`

| En la vista | Campo de `data` | Editar |
| --- | --- | --- |
| Nombre | `fullName` | Sí. En el PATCH van `nombres` y `apellidos` por separado |
| Rol | `role` y `roleLabel` | No |
| Documento | `documentType` y `documentId` | Sí (`tipoDocumento`, `numeroDocumento`) |
| Correo | `email` | Sí |
| Centro de formación | `trainingCenter` | No |
| Ubicación | `location` (centro — regional) | No |
| Teléfono | `phone` | No existe. Siempre `""`. Dejar “Sin registrar” |
| Dirección | `address` | No existe. Siempre `""`. Dejar “Sin registrar” |
| Foto | `avatarUrl` | Sí. Vacío si no hay foto. Si hay, es `/api/v1/account/profile/foto` |

También vienen `id`, `initials`, `isAdmin`, `permissions`, `trainingCenterId`, `regional`, `bodegaIds` y `bodegas`. El rol, el centro y la regional no se cambian desde esta pantalla.

## Editar información

`PATCH /account/profile`

Todos los campos son opcionales. Envía solo lo que cambió.

```json
{
  "nombres": "Carlos",
  "apellidos": "Perez",
  "tipoDocumento": "CC",
  "numeroDocumento": "1001001001",
  "email": "carlos@correo.com"
}
```

Límites: `nombres` y `apellidos` de 1 a 100 caracteres. `tipoDocumento` y `numeroDocumento` de 1 a 30. `email` válido, máximo 150.

Respuesta: el mismo objeto que el GET, ya actualizado.

Si el correo o el documento ya los usa otra cuenta, responde **422**.

## Cambiar contraseña

`PATCH /account/password`

```json
{
  "currentPassword": "123456",
  "password": "NuevaClave1",
  "passwordConfirmation": "NuevaClave1"
}
```

- `password` y `passwordConfirmation` tienen que ser iguales.
- Entre 8 y 32 caracteres.
- Si la actual no coincide: **422**, mensaje `La contraseña actual no es correcta`.
- Si sale bien: `{ "message": "Contraseña actualizada" }`.

## Foto de perfil

`multipart/form-data`, campo de archivo `fotografia`. JPG, PNG o WebP, máximo 8 MB. El servidor la guarda como WebP. La base solo guarda la ruta, no los bytes.

| Método | Ruta | Para qué |
| --- | --- | --- |
| `GET` | `/account/profile/foto` | Mostrar la imagen. `404` si no hay foto |
| `POST` | `/account/profile/foto` | Subir o reemplazar |
| `DELETE` | `/account/profile/foto` | Quitarla. `avatarUrl` vuelve a `""` |

El `POST` y el `DELETE` responden el perfil completo. Usa `avatarUrl` como `src` de la imagen, con el mismo token. Si `avatarUrl` está vacío, muestra `initials`.

Esta foto no es la de inventario (`/inventario/elementos/:id/fotografia`).

Teléfono y dirección no se guardan. No los mandes en el PATCH.

## Notificaciones

La tercera pestaña usa estas rutas, también con el token:

| Método | Ruta |
| --- | --- |
| `GET` | `/account/notifications` |
| `GET` | `/account/notifications/:id` |
| `PATCH` | `/account/notifications/:id` |
| `PATCH` | `/account/notifications` |

## Errores

| Código | Cuándo |
| --- | --- |
| `401` | Sin token o token vencido |
| `422` | Validación, correo o documento repetido, o contraseña actual incorrecta |

## Cerrar sesión

`POST /account/logout` revoca el token.
