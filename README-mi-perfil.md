# Mi perfil — contrato para el frontend

Pantalla **Mi perfil**: información, contraseña y foto. Prefijo de todas las rutas: `/api/v1`.

Header en todas:

```
Authorization: Bearer <token>
```

El perfil llega en `{ "data": { ... } }`.

Cuenta de prueba: `carlos@correo.com` / `123456`.

## Cargar la pantalla

`GET /api/v1/account/profile`

| En la vista | Campo de `data` | ¿Se edita? |
| --- | --- | --- |
| Nombre | `fullName` | Sí. El PATCH manda `nombres` y `apellidos` por separado |
| Rol | `role` y `roleLabel` | No |
| Documento | `documentType` y `documentId` | Sí (`tipoDocumento`, `numeroDocumento`) |
| Correo | `email` | Sí |
| Centro de formación | `trainingCenter` | No |
| Ubicación | `location` | No. Ya viene como `centro — regional` |
| Teléfono | `phone` | No se guarda. Siempre `""`. Mostrar “Sin registrar” |
| Dirección | `address` | No se guarda. Siempre `""`. Mostrar “Sin registrar” |
| Foto | `avatarUrl` | Sí. `""` si no hay. Si hay: `/api/v1/account/profile/foto` |

También vienen `id`, `initials`, `isAdmin`, `permissions`, `trainingCenterId`, `regional`, `bodegaIds` y `bodegas`. Rol, centro y regional no se cambian aquí.

Ejemplo:

```json
{
  "data": {
    "id": 1,
    "fullName": "Carlos Perez",
    "role": "Administrador",
    "roleLabel": "Administrador",
    "documentType": "CC",
    "documentId": "1001001001",
    "email": "carlos@correo.com",
    "phone": "",
    "address": "",
    "trainingCenter": "Centro de Comercio y Servicios",
    "location": "Centro de Comercio y Servicios — Regional Cauca",
    "avatarUrl": "",
    "initials": "CP"
  }
}
```

## Guardar información

`PATCH /api/v1/account/profile`

JSON. Todos los campos son opcionales: envía solo lo que cambió.

```json
{
  "nombres": "Carlos",
  "apellidos": "Perez",
  "tipoDocumento": "CC",
  "numeroDocumento": "1001001001",
  "email": "carlos@correo.com"
}
```

Límites: `nombres` y `apellidos` de 1 a 100. `tipoDocumento` y `numeroDocumento` de 1 a 30. `email` válido, máximo 150.

Responde el perfil actualizado, igual que el GET. Si el correo o el documento ya los usa otra cuenta: **422**.

## Cambiar contraseña

`PATCH /api/v1/account/password`

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

`multipart/form-data`. Campo del archivo: `fotografia`. JPG, PNG o WebP, máximo 8 MB.

| Método | Ruta |
| --- | --- |
| `GET` | `/api/v1/account/profile/foto` |
| `POST` | `/api/v1/account/profile/foto` |
| `DELETE` | `/api/v1/account/profile/foto` |

- `GET` devuelve la imagen. **404** si todavía no hay foto.
- `POST` sube o reemplaza. Responde el perfil, con `avatarUrl` en `/api/v1/account/profile/foto`.
- `DELETE` la quita. `avatarUrl` vuelve a `""`.
- Si `avatarUrl` está vacío, muestra `initials`.
- La imagen del `GET` también lleva el token. No es la foto de inventario.

## Errores

| Código | Cuándo |
| --- | --- |
| `401` | Sin token o token vencido |
| `422` | Validación, correo o documento repetido, o contraseña actual incorrecta |

## Cerrar sesión

`POST /api/v1/account/logout` revoca el token.
