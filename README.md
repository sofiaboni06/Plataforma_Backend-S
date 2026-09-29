# Plataforma Backend

API AdonisJS 7 para el frontend de perfil y módulos. Consume el esquema de `plataforma_1.sql` **sin alterarlo**.

Al clonar este repo ya estás en el API: `npm ci` y `npm run dev` (puerto 3333). No hay carpeta extra.

## Node.js (obligatorio, igual que el frontend)

**Node 24.21.0** + **npm 11.19.0**. No usar 22, 20 ni 26. Guía: [`docs/node.md`](docs/node.md).

```bash
nvm install 24.21.0
nvm use
node -v   # v24.21.0
npm ci
npm run dev
```

## Base de datos

La conexión apunta a PostgreSQL (`Plataforma`). Tablas del dump que se leen, no se modifican:

- `usuario`, `perfil`, `modulo`, `modulo_perfil`, `c_formacion`, `regional`

La única tabla que crea este backend es `auth_access_tokens` (tokens de la API).

```bash
cp .env.example .env   # ajustar credenciales
node ace migration:run # solo crea auth_access_tokens
npm run dev
```

## Autenticación

Las rutas protegidas esperan:

```
Authorization: Bearer <token>
```

El token se obtiene en el login. Las cuentas del dump siguen usando la contraseña en texto del SQL; las cuentas nuevas creadas por `/auth/signup` se guardan con hash.

| Correo | Perfil | Contraseña |
| --- | --- | --- |
| carlos@correo.com | Administrador | 123456 |
| juan@correo.com | Almacenista | 123456 |
| maria@correo.com | Funcionario | 123456 |

## Endpoints

Prefijo: `/api/v1`. Las respuestas van envueltas en `{ "data": ... }`.

### `POST /api/v1/auth/login`

```json
{ "email": "carlos@correo.com", "password": "123456" }
```

Respuesta: `user` (mismo contrato que perfil) + `token`.

### `GET /api/v1/account/profile`

Requiere autenticación y cuenta activa. Devuelve lo que el frontend necesita para **Mi perfil**, armado desde `usuario` + `perfil` + `c_formacion` + `regional`:

```json
{
  "data": {
    "id": 1,
    "fullName": "Carlos Perez",
    "roleLabel": "Administrador",
    "location": "Centro de Comercio y Servicios — Regional Cauca",
    "avatarUrl": "",
    "documentType": "CC",
    "documentId": "1001001001",
    "email": "carlos@correo.com",
    "phone": "",
    "trainingCenter": "Centro de Comercio y Servicios",
    "groupCode": "",
    "role": "Administrador",
    "initials": "CP"
  }
}
```

### `PATCH /api/v1/account/profile`

Requiere autenticación. Actualiza solo columnas reales de `usuario`: `nombres`, `apellidos`, `tipoDocumento`, `numeroDocumento`, `email`.

```json
{ "email": "carlos.nuevo@correo.com", "numeroDocumento": "1991991991" }
```

Devuelve el mismo contrato que `GET`. `422` si el correo o documento ya existen.

### `PATCH /api/v1/account/password`

```json
{
  "currentPassword": "123456",
  "password": "NuevaClave1",
  "passwordConfirmation": "NuevaClave1"
}
```

## Guía para el resto del equipo

Si no han hecho backend, empiecen aquí (orden modelo → validador → servicio → controlador, perfiles y módulos padre/hijo/nieto):

[docs/guia-para-el-equipo.md](docs/guia-para-el-equipo.md)

Resumen de URLs: [docs/guia-endpoints.md](docs/guia-endpoints.md).

Contrato para que el frontend arme las mismas pantallas: [docs/readme-frontend.md](docs/readme-frontend.md).

### `GET /api/v1/modules`

Requiere autenticación y cuenta activa. Devuelve los módulos de `modulo` asignados al `perfil` del usuario en `modulo_perfil` (`estado = true` en ambos).

Administrador: Inventario, Materiales de Formación, Ambiental  
Almacenista: Inventario  
Funcionario: Inventario, Materiales de Formación

```json
{
  "data": [
    {
      "id": 1,
      "code": "inventario",
      "label": "Inventario",
      "description": "Gestión del inventario",
      "to": null,
      "icon": "inventory",
      "parentId": null,
      "order": 1
    }
  ]
}
```

### Perfiles (roles) y catálogo de módulos

Solo **Administrador**. Crear `Aprendiz` / `Funcionario` y asignar módulos (incluyendo hijos y nietos):

- `GET/POST /api/v1/roles`
- `GET/PATCH /api/v1/roles/:id`
- `PUT /api/v1/roles/:id/modules` con `{ "moduleIds": [12] }`
- `GET /api/v1/modules/tree` árbol para el usuario logueado
- `GET/POST /api/v1/modules/catalog` catálogo completo; `parentId` crea un hijo

Marcar un padre **no** concede los hijos. El detalle está en la guía del equipo.

### Cómo agregar un módulo después

Sin migraciones ni cambios de esquema:

1. `POST /api/v1/modules/catalog` (o `INSERT` acordado en `modulo`).
2. `PUT /api/v1/roles/:id/modules` para el perfil que deba verlo.

La API lo devolverá en `GET /api/v1/modules` si ese perfil lo tiene concedido. Icono y ruta se resuelven en `app/data/module_presentation.ts` (si no hay mapeo: icono `home` y `to: null`).

### Otros

- `POST /api/v1/auth/signup` — alta contra columnas de `usuario`.
- `POST /api/v1/account/logout` — revoca el token.

## Pruebas

```bash
node ace test
```

Las pruebas leen los datos de `plataforma_1.sql` y envuelven cada suite en una transacción para no dejar tokens huérfanos.
