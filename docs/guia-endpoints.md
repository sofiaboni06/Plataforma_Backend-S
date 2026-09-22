# Guía corta de endpoints

La explicación para quienes **no han hecho backend** está aquí:

**[guia-para-el-equipo.md](./guia-para-el-equipo.md)**

Ahí va el orden modelo → validador → servicio → transformer → controlador → ruta → test, cómo crear perfiles (Aprendiz, Funcionario, …) y cómo colgar módulos padre / hijo / nieto.

## Recordatorio

- AdonisJS 7. Tablas de `plataforma_1.sql`. **No alterar el dump** sin acuerdo.
- JSON camelCase. SQL en español.
- Prefijo `/api/v1`. Respuestas `{ "data": ... }`.
- Privado: `auth` + `account`. Solo admin: también `admin`.

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
| `PUT` | `/roles/:id/modules` | `{ moduleIds }` |
| `GET` | `/users/options` | perfiles activos y centros, solo admin |
| `GET/POST` | `/users` | listar / crear usuario con `idPerfil`, solo admin |
| `GET/PATCH` | `/users/:id` | ficha y cambio de perfil/datos, solo admin |
| `GET/POST` | `/categorias` | categorías del centro |
| `GET/PATCH` | `/categorias/:id` | |
| `GET/POST` | `/subcategorias` | |
| `GET/PATCH` | `/subcategorias/:id` | |
| `GET/POST` | `/inventario/elementos` | camelCase. `descripcion` se guarda en `descripcion_tecnica`. La respuesta incluye `unidadMedida`, `subcategoria` y `stand` |
| `GET/PATCH` | `/inventario/elementos/:id` | |
| `GET/POST` | `/bodegas` | listado paginado: `{ data, metadata }`. Borrar una bodega con stands responde 409 |
| `GET/PATCH/DELETE` | `/bodegas/:id` | |
| `GET/POST` | `/bodegas/:id/stands` | |
| `GET/PATCH/DELETE` | `/bodegas/stands/:id` | borrar un stand con elementos responde 409 |
| `GET` | `/unidades-medida` | catálogo de `unidad_medida` |
| `GET` | `/unidades-medida/:id` | |

Cuentas dump, password `123456`: Carlos Administrador, Juan Almacenista, María Funcionario.

Tablas del backup que todavía no tienen CRUD: `item` (seriales). El modelo ya existe para no inventar columnas. Recuperar contraseña (`/auth/recover`) sigue siendo la tarea aparte; los tests están en skip.
