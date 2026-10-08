# Guía para el equipo (backend desde cero)

Esta API es **AdonisJS 7**. Si nunca han tocado backend, léan esto antes de abrir archivos.

**Node 24.21.0 + npm 11.19.0**, la misma que el frontend. Adonis 7 no corre en Node 22. No usen Node 26 (Current). Guía: [`docs/node.md`](node.md).

No hay que adivinar el orden. Para **cualquier** función nueva siempre es el mismo camino.

## 1. Ideas que se confunden

En esta plataforma hay dos “perfiles” distintos. No los mezclen:

| Cómo lo dice la gente | Qué es en la base de datos | Ejemplo |
| --- | --- | --- |
| **Mi perfil** (la ficha de una persona) | Tabla `usuario` | Carlos Pérez, correo, documento |
| **Perfil / rol** (tipo de usuario) | Tabla `perfil` | Administrador, Aprendiz, Funcionario |
| **Módulo** (una app o una pantalla dentro de una app) | Tabla `modulo` | Inventario, Ambiental, o más adelante una app completa |
| **Permiso** | Tabla `modulo_perfil` | Este rol sí puede usar este módulo |

La plataforma va a alojar **muchas aplicaciones**. Cada aplicación entra como un módulo. Un módulo puede tener hijos y nietos:

```
Aplicación          ← padre     (ejemplo: una app que metamos después)
  └── Sección       ← hijo      (ejemplo: una parte de esa app)
        └── Acción  ← nieto     (ejemplo: una sola cosa que sí puede hacer)
```

Eso **no** es una app real que deban programar ahora. Es la forma en que queremos dejar los permisos listos. Si más adelante alguien crea una aplicación nueva, no hay que rediseñar roles: se crea el módulo padre, se le cuelgan hijos/nietos, y a cada perfil se le marca solo lo que puede hacer.

Regla de oro: **marcar el padre no regala los hijos**. Si a “Aprendiz” le asignan solo el nieto, ese perfil puede esa acción. El menú puede mostrar el padre para que se entienda dónde vive, pero el permiso real es el módulo que sí quedó marcado.

## 2. Orden obligatorio (no se salten pasos)

Hagan las capas **de abajo hacia arriba**:

```
1. Modelo        app/models/           habla con la tabla SQL
2. Validador     app/validators/       revisa lo que llega del front
3. Servicio      app/services/         reglas de negocio y consultas
4. Transformer   app/transformers/     forma JSON que React sí entiende
5. Controlador   app/controllers/      recibe HTTP, llama servicio, responde
6. Ruta          start/routes.ts       URL + middleware
7. Prueba        tests/functional/     401, 200, 403, y que sí se guardó
```

El controlador **no** hace consultas largas. El modelo **no** arma el JSON del front. La ruta **no** tiene `if`.

Contrato con el frontend:

- JSON en **camelCase** (`name`, `parentId`, `moduleIds`).
- Tablas SQL en **español** (`nombre`, `id_modulo_padre`).
- El **servicio** traduce de uno al otro.
- Respuesta de recurso: `{ "data": ... }`.
- Prefijo: `/api/v1`.
- Rutas privadas: `.use(middleware.auth()).use(middleware.account())`.
- Rutas solo de administrador: además `.use(middleware.admin())`. Eso mira si `perfil.nombre === 'Administrador'`.

**No alteren `plataforma_1.sql`** salvo acuerdo del grupo. Si Figma pide teléfono, dirección, avatar o ficha y esa columna no existe, se documenta y se espera migración. No inventen columnas a escondidas.

## 3. Cuentas para probar

Contraseña de las tres: `123456`.

| Correo | Perfil |
| --- | --- |
| `carlos@correo.com` | Administrador (puede crear perfiles y módulos) |
| `juan@correo.com` | Almacenista |
| `maria@correo.com` | Funcionario |

El front manda `Authorization: Bearer <token>` después de `POST /api/v1/auth/login`.

## 4. Receta copiable (función nueva)

Imaginen que les tocó **inventario**. Copian esta receta cambiando nombres.

### Paso 1 — Modelo

Archivo: `app/models/producto.ts` (el nombre real depende de la tabla que les toque).

```ts
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Producto extends BaseModel {
  static table = 'producto' // el nombre EXACTO de la tabla SQL

  @column({ isPrimary: true, columnName: 'id_producto' })
  declare id: number

  @column()
  declare nombre: string
}
```

Si el campo en SQL es `id_producto` y en TypeScript quieren `id`, usen `columnName`.

### Paso 2 — Validador

Archivo: `app/validators/producto.ts`.

```ts
import vine from '@vinejs/vine'

export const createProductoValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(100),
})
```

Vine revisa tipos y tamaños **antes** de tocar la base. Si algo llega mal, responde `422`.

### Paso 3 — Servicio

Archivo: `app/services/producto_service.ts`.

Aquí va: “¿existe?”, “¿este perfil puede verlo?”, “guardar”, “listar”.

El controlador solo dice `new ProductoService().list()`.

### Paso 4 — Transformer

Archivo: `app/transformers/producto_transformer.ts`.

Ahí sale el JSON en camelCase. Nunca manden `password`, hashes ni filas crudas del pivote.

### Paso 5 — Controlador

```ts
async store({ request, serialize }: HttpContext) {
  const payload = await request.validateUsing(createProductoValidator)
  const producto = await new ProductoService().create(payload)
  return serialize(ProductoTransformer.transform(producto))
}
```

### Paso 6 — Ruta

En `start/routes.ts`, **dentro** del grupo `/api/v1`:

```ts
router
  .group(() => {
    router.get('/', [controllers.Productos, 'index'])
    router.post('/', [controllers.Productos, 'store'])
    router.patch('/:id', [controllers.Productos, 'update'])
  })
  .prefix('inventario')
  .as('inventario')
  .use(middleware.auth())
  .use(middleware.account())
```

Adonis genera `controllers.Productos` solo si el archivo se llama como espera el framework (`productos_controller.ts`). Si no aparece, miren `.adonisjs/server/controllers.ts`.

### Paso 7 — Prueba

En `tests/functional/`:

1. Sin token → `401`
2. Con Carlos → `200` si es algo general, o `403` si solo admin
3. Un `POST`/`PATCH` y luego un `GET` para comprobar que sí quedó guardado

Correr:

```bash
node ace test
```

### Paso 8 — Que salga en el menú

Si esa función es un módulo nuevo de la plataforma:

1. El administrador lo crea con `POST /api/v1/modules/catalog` (o un `INSERT` acordado en `modulo`).
2. Se lo asigna a un perfil con `PUT /api/v1/roles/:id/modules`.
3. Si el front necesita icono y ruta, se agrega el nombre en `app/data/module_presentation.ts`.

## 5. Lo que ya está hecho (no lo vuelvan a crear)

### Login y ficha de la persona

| Método | Ruta | Quién | Qué hace |
| --- | --- | --- | --- |
| `POST` | `/api/v1/auth/login` | público | `{ email }` o `{ usuario }` + `password` → `{ user, token }` |
| `POST` | `/api/v1/auth/signup` | público | crea `usuario` |
| `GET` | `/api/v1/account/profile` | logueado | ficha de **esa** persona |
| `PATCH` | `/api/v1/account/profile` | logueado | `nombres`, `apellidos`, `tipoDocumento`, `numeroDocumento`, `email` |
| `PATCH` | `/api/v1/account/password` | logueado | `{ currentPassword, password, passwordConfirmation }` |
| `POST` | `/api/v1/account/logout` | logueado | revoca el token |

`phone`, `address`, `avatarUrl` y `groupCode` salen vacíos: **no existen en el dump**.

Archivos para copiar el estilo: `profile_service.ts`, `profile_controller.ts`, `user.ts` (validador), `user_transformer.ts`.

### Perfiles (roles) y módulos

Esto ya lo pueden usar. Sirve para crear **Aprendiz**, **Funcionario**, etc., y más adelante marcarles módulos.

| Método | Ruta | Quién | Qué hace |
| --- | --- | --- | --- |
| `GET` | `/api/v1/roles` | admin | lista perfiles |
| `POST` | `/api/v1/roles` | admin | crea un perfil. Body: `{ "name": "Aprendiz", "description": "..." }` |
| `GET` | `/api/v1/roles/:id` | admin | un perfil + `moduleIds` + árbol con `granted` |
| `PATCH` | `/api/v1/roles/:id` | admin | `{ name?, description?, active? }` |
| `PUT` | `/api/v1/roles/:id/modules` | admin | `{ "moduleIds": [3] }` deja **solo** esos módulos |
| `GET` | `/api/v1/users/options` | admin | perfiles activos y centros para el formulario |
| `GET` | `/api/v1/users` | admin | lista usuarios |
| `POST` | `/api/v1/users` | admin | crea usuario y le asigna perfil. Body: `{ nombres, apellidos, tipoDocumento, numeroDocumento, email, password, passwordConfirmation, idPerfil, idCformacion }` |
| `GET` | `/api/v1/users/:id` | admin | ficha |
| `PATCH` | `/api/v1/users/:id` | admin | cambia datos, perfil o estado. Contraseña opcional |
| `GET` | `/api/v1/modules` | logueado | lista plana de módulos **concedidos** (el menú actual) |
| `GET` | `/api/v1/modules/tree` | logueado | árbol: padres visibles para ubicar, `granted: true` solo en lo permitido |
| `GET` | `/api/v1/modules/catalog` | admin | árbol de **todos** los módulos |
| `POST` | `/api/v1/modules/catalog` | admin | crea padre, hijo o nieto. Body: `{ "name": "Inventario" }` o `{ "name": "Entradas", "parentId": 1 }` |

Si mandan `parentId`, ese módulo queda **hijo** del que indiquen. Si no mandan `parentId`, queda **padre** (una app o un módulo de primer nivel).

Ejemplo de idea (inventado, **no lo implementen como proyecto aparte**):

```
POST /modules/catalog  { "name": "Mi aplicacion" }           → id 10  padre
POST /modules/catalog  { "name": "Seccion", "parentId": 10 } → id 11  hijo
POST /modules/catalog  { "name": "Accion",  "parentId": 11 } → id 12  nieto

PUT /roles/4/modules   { "moduleIds": [12] }
```

El perfil 4 puede **solo** la acción 12. El árbol muestra “Mi aplicacion → Seccion → Accion” para que el menú tenga dónde colgarse, pero `granted` es `true` únicamente en 12.

Cadena de menú: usuario → `id_perfil` → `modulo_perfil` → módulos. El front pinta `GET /modules`, no una lista fija.

Archivos: `role_service.ts`, `module_service.ts`, `module_tree.ts`, `roles_controller.ts`, `modules_controller.ts`, `users_controller.ts`, `usuario_service.ts`, `admin_user_transformer.ts`, `admin_middleware.ts`.

## 6. Si les tocó una pantalla del Figma

El frontend ya tiene maquetas con datos de demostración. Les toca el **API** de esa pantalla, no redibujar React salvo que el grupo lo pida.

### Inventario

1. Revisar el dump: ¿existe tabla de productos / movimientos? Si no existe, **no inventen la tabla**. Avísenle al grupo.
2. Modelo de esa tabla → validador → servicio (filtrar por lo que el perfil pueda ver) → transformer → `GET/POST/PATCH /api/v1/inventario/...`
3. Probar con Juan (Almacenista) y con alguien que no deba entrar.
4. El menú ya tiene el módulo Inventario en el dump.

### Materiales de formación

Misma receta. Ruta sugerida: `/api/v1/materiales`. El front hoy está en `/materiales` con datos falsos.

### Ambiental

Misma receta. Ruta sugerida: `/api/v1/ambiental`.

### Actividades

Misma receta. Ruta sugerida: `/api/v1/actividades`. Si no hay tabla, no la creen solos.

### Reportes

Casi seguro son **consultas** sobre tablas de otros módulos (`GET` que agrupa), no una tabla `reporte`. Primero pregunten de dónde salen los números.

### Recuperar contraseña (y las vistas de login)

Eso es **una sola tarea**, asignada. No la implementen el resto. Receta: [tarea-login-y-recuperar.md](./tarea-login-y-recuperar.md).

El `POST /api/v1/auth/login` ya existe. Las pantallas `/login` y `/recuperar` se quitaron para que las cree quien tenga la tarea. Rutas previstas de recuperar: `POST /api/v1/auth/recover`, `/recover/verify`, `/recover/reset`. No copien la contraseña en logs.

### Notificaciones (pestaña de Mi perfil)

Ya existe. La tabla es `notificacion` y la API es `GET/PATCH /api/v1/account/notifications`. El aviso en vivo llega por Transmit, en el canal `notificaciones/:idUsuario`. Qué evento le avisa a quién está en [guia-endpoints.md](./guia-endpoints.md#alertas-y-notificaciones). Para un aviso nuevo, agreguen el tipo en la migración y en el modelo, y escríbanlo desde `NotificacionService` dentro de la misma transacción de la acción.

### Usuarios (alta de gente, no “Mi perfil”)

Signup ya crea `usuario`. Si les toca un CRUD de usuarios para admin, reutilicen el modelo `User` y protejan con `middleware.admin()`. No dupliquen la tabla.

## 7. Cómo saber si su función quedó bien

- [ ] Siguieron el orden modelo → validador → servicio → transformer → controlador → ruta → test
- [ ] No tocaron el esquema SQL sin acuerdo
- [ ] El JSON del front es camelCase
- [ ] Password no viaja en el GET de perfil
- [ ] Hay `401` sin token y `403` si el perfil no debe
- [ ] Hay un test funcional
- [ ] Si es un módulo nuevo de la plataforma, queda colgado en el árbol (padre/hijo/nieto) y se asigna por perfil, no “a mano” en el frontend

Códigos: `200` ok, `401` sin token, `403` prohibido, `404` no existe, `422` datos inválidos.
