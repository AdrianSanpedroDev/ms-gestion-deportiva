# Acuerdos del equipo: Entrega 2 (Gestión Deportiva + Gestión de Competencias)

> **Este archivo es el contrato del equipo.** Va en la raíz del repo del nuevo microservicio `ms-gestion-deportiva` y una copia en la raíz de `frontend-app`. Mientras ese repo se crea, vive en la raíz de `ProyectoDesarrolloBackend`.
> Cualquier persona o asistente de IA que trabaje en esta entrega debe leerlo completo antes de escribir código.
> Si algo de aquí no te sirve, **no lo cambies por tu cuenta**: propónlo en el grupo y se actualiza este archivo (sección 12).

> **Punto de partida (entrega 1, entregada el 03/11/2026):** `ms_security` (Spring Boot, puerto 8181), `frontend-app` (React + Vite, puerto 5173) y `ms-notifications` (Flask, puerto 5000) funcionan y están en `main`. Esta entrega **se apoya en ellos** y sigue el patrón NestJS + TypeORM de las guías del curso (proyecto `ms-cinema`, guías 1 a 5). El microservicio nuevo **todavía no existe**: se crea en la Fase 0 (sección 11).

---

## 0. Instrucciones para asistentes de IA (leer primero)

Si eres una IA (Claude, ChatGPT, Copilot, Cursor, etc.) ayudando a un miembro del equipo:

1. **Pregunta o identifica qué persona (A, B o C) es tu usuario** antes de crear o modificar archivos (tabla de la sección 1).
2. **Solo crea o modifica archivos que pertenecen a esa persona** (sección 4). Puedes **leer** cualquier archivo del proyecto.
3. **No modifiques, renombres, muevas ni borres** archivos de otra persona ni de `common/`, aunque parezca que "se arregla más fácil así". Si necesitas un cambio fuera de tu zona, **detente y dile al usuario** que se lo pida al dueño. No hagas el cambio.
4. **Respeta el contrato al pie de la letra:** rutas, métodos HTTP, nombres de campos JSON, nombres de tablas y columnas, códigos de estado y formato de error. No inventes campos ni cambies nombres.
5. Para usar datos de otra persona: **registra su entidad en tu módulo con `TypeOrmModule.forFeature([...])` e inyecta `Repository<SuEntidad>` solo para leer** (sección 7). **Nunca** llames `save`, `insert`, `update`, `delete` ni `remove` sobre entidades ajenas, y nunca inyectes el `Service` de otra persona (crea dependencias circulares entre módulos de Nest). Los servicios de `common/` sí los puede usar cualquiera.
6. **No toques** `.env.example`, `package.json`, `typeorm.config.ts`, `app.module.ts`, `main.ts`, la carpeta `common/` (errores, seguridad, correo, utilidades) ni las migraciones de otros sin acuerdo del equipo.
7. **No modifiques los otros proyectos** (`ms_security`, `ms-notifications`) ni los archivos compartidos del front (`src/api/`, `src/config/env.js`, `src/constants/permissions.js`, `src/routes/router.jsx`, `src/components/Sidebar.jsx`), salvo que la tarea esté asignada en la sección 11.
8. **No hagas pantallas para las entidades marcadas "Solo Postman"** (sección 2). Esas se entregan solo con backend.
9. **Nunca** sugieras ni ejecutes `git push --force` ni `git reset --hard` sobre ramas compartidas, ni borres ramas de otros. Nunca subas `.env`, `credentials/` ni contraseñas.
10. Si este archivo y el código existente se contradicen, **gana este archivo**. Avísale al usuario de la diferencia.

---

## 1. Quién es quién

**Fecha de entrega: lunes 24/11/2026.**

| Persona | Nombre | Historias de usuario | Extra |
|---|---|---|---|
| **A** | **Nicolás** (`nico` en los commits) | HU-GD-01, HU-GD-02, HU-GD-03, HU-GC-01, HU-GC-02 | Fase 0 (esqueleto Nest y base del front), correo (`ms-notifications`), escenario mínimo |
| **B** | **Adrián** (GitHub `AdrianSanpedroDev`) | HU-GD-04, HU-GD-05, HU-GD-06, HU-GC-06, HU-GC-07 | Crea el repo `ms-gestion-deportiva` |
| **C** | **Andrei** (GitHub `Kippie01PW`) | HU-GD-07, HU-GD-08, HU-GC-03, HU-GC-04, HU-GC-05, HU-GC-08 | Endpoint de validación de permisos en `ms_security` (propuesto) |

> **HU-GC-02 = Gestionar inscripciones de equipos en torneos.** En el Anexo 3 aparece rotulada como "HU-GC-08" por un error del documento (hay dos GC-08). Aquí la llamamos GC-02 para no confundirla con "Consultar desarrollo de un torneo", que es la GC-08.

Dos tareas de la Fase 0 tocan proyectos de la entrega 1 y las hace **quien ya conoce ese código** (propuesto; confírmenlo en el grupo):
- Endpoint de correo genérico en `ms-notifications` (sección 8) → **Nicolás (A)**, que hizo `ms-notifications`.
- Endpoint de validación de permisos en `ms_security` (10.3) → **Andrei (C)**, que hizo roles y permisos (reutiliza `PermissionService.hasPermission`).

**Quién hizo qué en la entrega 1** (para saber a quién preguntar; corríjanlo si falta algo):

| Integrante | Entrega 1 |
|---|---|
| Adrián | HU-SE-01 usuarios (activar/desactivar), HU-SE-02 perfil, HU-SE-07 registro, HU-SE-09 recuperar contraseña |
| Andrei (`Kippie01PW`) | Roles, permisos y sus asignaciones (usuario ↔ rol, rol ↔ permiso), CORS |
| Nicolás | Login, OAuth con Firebase, 2FA, sesiones, `ms-notifications` |

---

## 2. Alcance: qué lleva frontend

Según el diagrama de clases del equipo: **rojo = solo backend (se prueba en Postman)** y **verde = backend + frontend**.

| HU | Nombre | Entidades | Frontend | Dueño |
|---|---|---|---|---|
| GD-01 | Gestionar deportes | `Deporte` | ❌ Solo Postman | A |
| GD-02 | Gestionar equipos | `Equipo` | ✅ | A |
| GD-03 | Asociar equipos con deportes | `EquipoDeporte` | ✅ | A |
| GD-04 | Gestionar jugadores | `Jugador` | ✅ | B |
| GD-05 | Asignar jugadores a equipos | `EquipoJugador` | ✅ | B |
| GD-06 | Gestionar habilidades | `Habilidad` | ❌ Solo Postman | B |
| GD-07 | Asignar habilidades a jugadores | `HabilidadJugador` | ✅ | C |
| GD-08 | Consultar perfil deportivo del jugador | (consulta) | ✅ | C |
| GC-01 | Gestionar torneos | `Torneo` | ✅ | A |
| GC-02 | Gestionar inscripciones | `Inscripcion` | ✅ | A |
| GC-03 | Gestionar fases | `Fase` (abstracta) | ❌ Solo Postman | C |
| GC-04 | Gestionar grupos | `Grupo` | ❌ Solo Postman | C |
| GC-05 | Gestionar fases finales | `FaseFinal` ("Final" en el diagrama) | ✅ | C |
| GC-06 | Gestionar partidos | `Partido` | ✅ | B |
| GC-07 | Resultados y anotaciones | `Partido` (resultado), `Anotacion` | ✅ | B |
| GC-08 | Consultar desarrollo de un torneo | (consulta) | ✅ | C |

Aunque una entidad sea "Solo Postman", el front **sí puede consumir sus GET** para llenar listas desplegables (ej.: elegir el deporte al crear un torneo, o la habilidad al asignarla).

**Fuera de esta entrega** (entrega 3): `Aficionado`, `AficionadoEquipo`, `Boleto`, `Localidad`, `Apuesta`, `MetodoPago`, `MetodoPagoAficionado`, `PosicionEspacial`, `Pelota`, `EscenarioTorneo` y el CRUD de `Escenario`. No se crean ahora (salvo lo que dice la sección 6.9 sobre `escenario`).

---

## 3. Stack y configuración general

| Tema | Acuerdo |
|---|---|
| Microservicio | `ms-gestion-deportiva`: **los módulos 2 y 3 van en el mismo microservicio**, en un repo propio |
| Tecnología | **NestJS + TypeScript**, igual que `ms-cinema` (guías del curso) |
| Base de datos | **MySQL + TypeORM** (`@nestjs/typeorm`, driver `mysql2`), como en las guías: `Repository<Entidad>` para el CRUD y un repositorio propio con SQL solo para consultas especiales (tabla de posiciones, reportes) |
| Creación de tablas | **Migraciones de TypeORM** (`typeorm.config.ts` + `npx typeorm-ts-node-commonjs`, guías 2 a 4). `synchronize` siempre en `false` (6.15) |
| Validación | `class-validator` + `class-transformer` con `ValidationPipe` global |
| Configuración | `@nestjs/config` con `.env` (se sube `.env.example`; **el `.env` nunca se sube**) |
| Seguridad | `SecurityGuard` global de la **guía 5**: le pregunta a `ms_security` si el token tiene permiso para el método y la URL (sección 10). El JWT **no** se valida localmente |
| Correo | A través de **`ms-notifications`** (HTTP + `X-Service-Key`), igual que `ms_security` con 2FA y recuperación (sección 8). Sin SMTP ni `nodemailer` |
| Puerto | `8182` *(`ms_security` usa 8181, `ms-notifications` 5000 y el front 5173)* |
| Base de datos local | `gestion_deportiva_db`, en el mismo MySQL local donde está `proyecto_db` (la de seguridad). Se crea a mano (`CREATE DATABASE gestion_deportiva_db;`); las tablas las crean las migraciones |
| Zona horaria | `America/Bogota` (para "hoy", cierres de inscripción, etc.) |
| Nombres de archivos | `kebab-case` con sufijo, como en `ms-cinema`: `torneo.controller.ts`, `torneo.service.ts`, `torneo.entity.ts`, `torneo.mapper.ts`, `crear-torneo.dto.ts` |
| Ruta base de la API | `/api` (`app.setGlobalPrefix('api')`) |
| JSON | `camelCase` |
| Fechas | ISO `yyyy-MM-dd` (columnas `DATE`) |
| Fecha y hora | ISO `yyyy-MM-ddTHH:mm:ss` (columnas `DATETIME`) |
| IDs | `@PrimaryGeneratedColumn()` (`INT AUTO_INCREMENT` en MySQL), `number` en TypeScript |
| Tablas y columnas | `snake_case`, nombres exactos de la sección 6 (`@Entity('equipo_deporte')`, `@Column({ name: 'fecha_creacion' })`) |
| Enums | `enum` de TypeScript con valores en texto (`EN_CURSO = 'EN_CURSO'`); en MySQL son `VARCHAR` |
| SQL propio | Solo en `repositories/` y **siempre con parámetros** (`dataSource.query('... WHERE id = ?', [id])`). Prohibido armar SQL concatenando valores (inyección SQL) |
| Idioma | Código, endpoints y mensajes en **español**. Excepción: los valores de `errorCase` (sección 5), que son los mismos de `ms_security` para que el front los reconozca |
| Paginación | No. Los listados devuelven un arreglo completo (con filtros opcionales) |

---

## 4. Estructura de carpetas y dueños

### 4.1 Backend (NestJS, un módulo por funcionalidad, como `ms-cinema`)

```
ms-gestion-deportiva/
├── src/
│   ├── main.ts                    ← A   (prefijo /api, ValidationPipe global, filtro de errores, CORS, puerto)
│   ├── app.module.ts              ← A   (ConfigModule, TypeOrmModule.forRootAsync, SecurityGuard como APP_GUARD, importa los módulos)
│   ├── migrations/                Migraciones de TypeORM: cada persona solo las suyas (6.15)
│   ├── common/                    ← A. Nadie lo modifica sin acuerdo.
│   │   ├── errores/               ErrorCase, ApplicationException, HttpExceptionFilter (sección 5)
│   │   ├── seguridad/             SecurityGuard (guía 5) y decorador @Public
│   │   ├── dto/                   tipos *Resumen compartidos, EstadoDto
│   │   ├── utils/                 fechas (formato ISO), helpers
│   │   └── notificacion/          NotificacionModule (@Global): CorreoService (cliente de ms-notifications), DestinatariosService
│   ├── deporte/                   ← A   Deporte
│   ├── equipo/                    ← A   Equipo, EquipoDeporte
│   ├── torneo/                    ← A   Torneo, Inscripcion
│   ├── escenario/                 ← A   Escenario (mínimo, ver 6.9)
│   ├── jugador/                   ← B   Jugador, EquipoJugador
│   ├── habilidad/                 ← B   Habilidad
│   ├── partido/                   ← B   Partido (incluye resultado), Anotacion
│   ├── habilidad-jugador/         ← C   HabilidadJugador
│   ├── perfil/                    ← C   consulta del perfil
│   ├── fase/                      ← C   Fase (abstracta), Grupo, FaseFinal, GrupoEquipo, tabla de posiciones, llaves
│   └── desarrollo/                ← C   consulta del desarrollo del torneo
├── typeorm.config.ts              ← A   (DataSource que usa el CLI de migraciones, igual que en ms-cinema)
├── .env.example                   ← A
└── package.json                   ← A   (scripts migration:generate y migration:run)
```

Cada carpeta de funcionalidad sigue la estructura de las guías (ejemplo con `torneo/`):

```
torneo/
├── torneo.module.ts             TypeOrmModule.forFeature([Torneo, Inscripcion, ...entidades ajenas que lee]) + controllers + services
├── torneo.controller.ts         recibe HTTP, valida con DTOs, responde. Sin lógica de negocio
├── inscripcion.controller.ts
├── torneo.service.ts            reglas de negocio; usa @InjectRepository(Torneo) Repository<Torneo>
├── inscripcion.service.ts
├── entities/      torneo.entity.ts, inscripcion.entity.ts, estado-torneo.enum.ts   (clases @Entity)
├── dto/           crear-torneo.dto.ts, actualizar-torneo.dto.ts, cambiar-estado-torneo.dto.ts, torneo-response.dto.ts
├── mappers/       torneo.mapper.ts, inscripcion.mapper.ts   (entidad ↔ DTO, métodos estáticos como TheaterMapper)
└── repositories/  torneo.repository.ts   (solo si hay SQL especial: @InjectDataSource() + dataSource.query)
```

**Capas (lo que más evalúa el profe, igual que en la entrega 1):** controller (HTTP) → service (reglas de negocio, lanza `ApplicationException`) → `Repository<T>` o repositorio propio (el único lugar que habla con la BD). Además: entity (tabla), dto (lo que entra y sale) y mapper (entidad ↔ DTO). El controlador nunca devuelve entidades.

**Por qué no hay dependencias circulares:** cada módulo registra con `TypeOrmModule.forFeature([...])` las entidades que necesita leer, aunque sean de otro dueño. Así nadie importa el módulo de otro ni inyecta su `Service`. El archivo de cada entidad sigue en la carpeta de su dueño, y **solo su dueño lo modifica**.

| Carpeta / archivo | Dueño | Quién más puede tocarlo |
|---|---|---|
| `src/common/**`, `main.ts`, `app.module.ts`, `typeorm.config.ts` | A | Nadie, salvo acuerdo |
| `src/deporte/**`, `equipo/**`, `torneo/**`, `escenario/**` | A | Nadie |
| `src/jugador/**`, `habilidad/**`, `partido/**` | B | Nadie |
| `src/habilidad-jugador/**`, `perfil/**`, `fase/**`, `desarrollo/**` | C | Nadie |
| `src/migrations/<timestamp>-<Letra><Nombre>.ts` | La persona de la letra | Nadie (una migración que ya está en `main` no se edita: se crea otra) |
| `.env.example`, `package.json` | A | Solo con acuerdo (las dependencias nuevas se piden en el grupo) |
| `ACUERDOS.md`, `HISTORIAS_USUARIO.md` | Todos | Solo con acuerdo (sección 12) |

### 4.2 Frontend (`frontend-app`: React 19 + Vite + JavaScript)

El front de la entrega 1 ya tiene su estructura; esta entrega **la reutiliza, no la cambia**:

- `src/api/axiosClient.js`: axios con el token (`Authorization: Bearer`) que cierra la sesión ante un 401. Apunta a `ms_security` (`VITE_API_URL`).
- `src/services/<x>Service.js`: un objeto `api` con las llamadas y, al final, `export const xService = env.useMocks ? mock : api` (mocks en `src/services/mock/`).
- `src/pages/<área>/`: pantallas. Hay componentes listos en `src/components/` (`DataTable`, `CrudToolbar`, `Modal`, `FormField`, `ConfirmDialog`, `DetailPanel`, `StatusBadge`, `Alert`, `Spinner`, `Switch`), hooks (`useAsyncData`, `useToast`, `useCan`) y `getApiErrorMessage` / `getApiFieldErrors` en `src/utils/apiError.js`.
- `src/routes/router.jsx`: rutas protegidas con `<RequirePermission resource="..." operation="..." />`. `src/components/Sidebar.jsx`: menú.
- `src/constants/permissions.js`: catálogo de recursos por módulo. **Ya trae un módulo "Gestión Deportiva" de ejemplo con rutas en inglés (`/api/tournaments`, `/api/teams`, `/api/players`, `/api/matches`) que hay que reemplazar** por los recursos reales (10.4).

Lo nuevo de esta entrega:

```
frontend-app/src/
├── api/gestionClient.js            ← A   segunda instancia de axios hacia VITE_GESTION_API_URL (mismo token, mismos interceptores)
├── config/env.js                   ← A   agrega gestionApiUrl
├── constants/permissions.js        ← A   módulo gestion-deportiva con los recursos reales
├── routes/router.jsx               ← A   todas las rutas nuevas
├── components/Sidebar.jsx          ← A   entradas del menú
├── services/gestion/
│   ├── catalogosService.js         ← A   (GET deportes y escenarios; B y C lo pueden usar)
│   ├── equiposService.js           ← A
│   ├── torneosService.js           ← A
│   ├── jugadoresService.js         ← B   (incluye GET habilidades para listas)
│   ├── partidosService.js          ← B
│   ├── habilidadJugadorService.js  ← C
│   ├── perfilService.js            ← C
│   └── fasesService.js             ← C   (fases, fase final, llaves, desarrollo)
├── services/mock/gestion/          mocks opcionales, cada uno los suyos
└── pages/gestion-deportiva/
    ├── equipos/                    ← A
    ├── torneos/                    ← A
    ├── jugadores/                  ← B
    ├── partidos/                   ← B
    ├── perfil/                     ← C
    ├── fase-final/                 ← C
    └── desarrollo/                 ← C
```

En el `.env` del front: `VITE_GESTION_API_URL=http://localhost:8182/api` (y `VITE_USE_MOCKS=false` para probar contra los backends reales).

**Rutas y menú:** A las agrega todas en la Fase 0, apuntando a componentes vacíos que cada dueño luego llena. La columna "Permiso" es lo que va en `RequirePermission` (recurso · operación de `constants/permissions.js`).

| Ruta front | Pantalla | Permiso | Dueño |
|---|---|---|---|
| `/equipos` | Listado de equipos + crear/editar/desactivar/eliminar | `equipos` · `listar` | A |
| `/equipos/:id` | Detalle del equipo | `equipos` · `ver` | A |
| `/torneos` | Listado de torneos + crear/editar/cambiar estado/eliminar | `torneos` · `listar` | A |
| `/torneos/:id` | Detalle del torneo | `torneos` · `ver` | A |
| `/jugadores` | Listado de jugadores + crear/editar/desactivar/eliminar | `jugadores` · `listar` | B |
| `/jugadores/:id` | Detalle del jugador | `jugadores` · `ver` | B |
| `/partidos` | Listado de partidos (filtros por torneo, equipo y estado) | `partidos` · `listar` | B |
| `/partidos/nuevo`, `/partidos/:id/editar` | Formulario de partido | `partidos` · `crear` / `actualizar` | B |
| `/partidos/:id` | Detalle del partido: estado, resultado y anotaciones | `partidos` · `ver` | B |
| `/jugadores/:id/perfil` | Perfil deportivo | `jugadores` · `ver` | C |
| `/torneos/:id/fase-final` | Configuración de la fase final y llaves | `torneos` · `ver` | C |
| `/torneos/:id/desarrollo` | Desarrollo del torneo | `torneos` · `ver` | C |

**Componentes que se incrustan en pantallas de otro (para no pisarse):**

| Componente | Dueño | Se muestra dentro de | Quién lo inserta |
|---|---|---|---|
| `EquipoDeportes` (asociar/retirar deportes) | A | `/equipos/:id` | A |
| `PlantillaEquipo` (asignar/retirar jugadores) | B | `/equipos/:id` | A pone `<PlantillaEquipo equipoId={id} />` |
| `TorneosDelEquipo` (torneos en los que está inscrito) | A | `/equipos/:id` | A |
| `InscripcionesTorneo` (inscribir/retirar equipos) | A | `/torneos/:id` | A |
| `PartidosTorneo` (lista + botón "nuevo partido") | B | `/torneos/:id` | A pone `<PartidosTorneo torneoId={id} />` |
| `HistorialEquiposJugador` | B | `/jugadores/:id` | B |
| `HabilidadesJugador` (agregar/retirar habilidades) | C | `/jugadores/:id` | B pone `<HabilidadesJugador jugadorId={id} />` |
| `AnotacionesPartido` (lista; con `soloLectura` no deja editar) | B | `/partidos/:id` y `/torneos/:id/desarrollo` | B y C (C con `soloLectura`) |

Además, `/torneos/:id` (A) tiene **enlaces** a `/torneos/:id/fase-final` y `/torneos/:id/desarrollo` (C), y `/jugadores/:id` (B) tiene un enlace a `/jugadores/:id/perfil` (C).

En la Fase 0 se crean estos componentes como archivos vacíos (que solo muestran "Pendiente"), para que nadie tenga que esperar a otro.

---

## 5. Convenciones de la API

### 5.1 Códigos HTTP

| Caso | Código | `errorCase` |
|---|---|---|
| Crear (POST) | `201 Created` + el recurso creado | |
| Consultar (GET) | `200 OK` | |
| Actualizar (PUT / PATCH) | `200 OK` + el recurso actualizado | |
| Eliminar o retirar una asociación (DELETE) | `204 No Content` | |
| Campos inválidos | `400 Bad Request` | (sin `errorCase`: objeto `{ campo: mensaje }`, ver 5.2) |
| Regla de negocio violada (estado no permite, fechas, etc.) | `400 Bad Request` | `INVALID_OPERATION` |
| Sin token, token inválido o sesión cerrada | `401 Unauthorized` | `UNAUTHORIZED` |
| El usuario no tiene el permiso (método + URL) | `403 Forbidden` | `FORBIDDEN` |
| No existe | `404 Not Found` | `NOT_FOUND` |
| Duplicado | `409 Conflict` | `ALREADY_EXISTS` |
| No se puede eliminar porque tiene datos asociados | `409 Conflict` | `HAS_ASSOCIATIONS` |
| `ms_security` no responde | `503 Service Unavailable` | `SERVICE_UNAVAILABLE` |
| Error no controlado | `500 Internal Server Error` | `INTERNAL_ERROR` |

### 5.2 Formato único de error (el mismo de `ms_security`)

```json
{ "errorCase": "ALREADY_EXISTS", "message": "Ya existe un torneo con el nombre 'Copa Caldas 2026'" }
```

Errores de validación (400): un objeto con **un mensaje por campo**:

```json
{ "nombre": "El nombre es obligatorio", "fechaInicio": "La fecha de inicio debe tener formato yyyy-MM-dd" }
```

**Por qué este formato:** es exactamente el que ya devuelve `ms_security` (`GlobalExceptionHandler`) y el que ya entiende el front: `getApiErrorMessage` muestra `message` y `getApiFieldErrors` pone cada error junto a su campo. Con otro formato habría que cambiar el front.

### 5.3 Errores en el código (en `common/errores/`)

Se copia el patrón de `ms_security`: el servicio lanza una excepción con un **caso de error** y un mensaje, y **no decide el código HTTP** (el servicio no sabe nada de HTTP). El filtro global lo traduce.

```ts
export enum ErrorCase {
  NOT_FOUND = 'NOT_FOUND',                     // 404
  ALREADY_EXISTS = 'ALREADY_EXISTS',           // 409
  HAS_ASSOCIATIONS = 'HAS_ASSOCIATIONS',       // 409
  INVALID_OPERATION = 'INVALID_OPERATION',     // 400
  UNAUTHORIZED = 'UNAUTHORIZED',               // 401
  FORBIDDEN = 'FORBIDDEN',                     // 403
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE', // 503
}

// En un servicio:
throw new ApplicationException(ErrorCase.NOT_FOUND, `No existe el torneo con id ${id}`);
```

`HttpExceptionFilter` (global, `@Catch()`):

| Llega | Responde |
|---|---|
| `ApplicationException` | el código de su `ErrorCase` + `{ errorCase, message }` |
| Error del `ValidationPipe` | 400 + `{ campo: mensaje }` |
| `HttpException` de Nest (las que lanza el `SecurityGuard`: `UnauthorizedException`, `ForbiddenException`, `ServiceUnavailableException`) | su código + el `errorCase` equivalente |
| `QueryFailedError` de TypeORM con código `ER_DUP_ENTRY` | 409 `ALREADY_EXISTS` (por si se escapa una validación) |
| `QueryFailedError` con código `ER_ROW_IS_REFERENCED_2` | 409 `HAS_ASSOCIATIONS` (MySQL impidió borrar algo con datos asociados) |
| Cualquier otro error | 500 `INTERNAL_ERROR` con "Ocurrió un error interno en el servidor" (el detalle solo va al `Logger`) |

En los servicios **no** se usan `NotFoundException`, `ConflictException`, etc. directamente (como en las guías): se usa `ApplicationException`, para que el `errorCase` sea el que espera el front.

El `ValidationPipe` global va con `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true` (como en `ms-cinema`) y un `exceptionFactory` que arma el objeto `{ campo: mensaje }` (el primer mensaje de cada campo, en español).

### 5.4 Reglas comunes

- **Nunca** se devuelven entidades de TypeORM. Los controladores devuelven DTOs de respuesta (`XxxResponseDto`) armados por el mapper; la entrada llega en DTOs de clase (`CrearXxxDto`, `ActualizarXxxDto`).
- Validación con decoradores (`@IsNotEmpty`, `@MaxLength`, `@IsInt`, `@IsDateString`, `@IsEnum`, etc.) y mensajes en español. Los parámetros de ruta se leen con `ParseIntPipe`.
- Los textos se guardan con `trim()`.
- **Los duplicados se revisan sin importar mayúsculas**: `findOneBy({ nombre })` genera `WHERE nombre = ?`, y con la collation por defecto de MySQL 8 (`utf8mb4_0900_ai_ci`) eso ya ignora mayúsculas y tildes.
- Las operaciones que tocan varias filas ("todo o nada") van en una **transacción** de TypeORM: `this.dataSource.transaction(async (manager) => { ... })`. Dentro de la transacción **todo** se hace con `manager` (`manager.getRepository(Inscripcion).save(...)`); si se usa el repositorio inyectado, esa operación queda por fuera de la transacción.
- **Desactivar ≠ eliminar** (para entidades con `activo`):
  - `PATCH /{id}/estado` con `{ "activo": false }` desactiva (o reactiva con `true`). Siempre se permite.
  - `DELETE /{id}` borra físicamente **solo si no tiene datos asociados**. Si tiene, responde `409 HAS_ASSOCIATIONS` con un mensaje que diga qué lo impide (ej.: *"No se puede eliminar el equipo porque está inscrito en 2 torneos. Puede desactivarlo."*).
- No se puede asociar nada a un registro **inactivo** → `400 INVALID_OPERATION`.
- Los listados aceptan filtros opcionales por query string. Si no se envían, devuelven todo, ordenado por `nombre` (o `apellidos`, o `fechaHora` en partidos) ascendente.
- Las acciones exitosas devuelven el recurso; **el front muestra un mensaje de confirmación** ("Inscripción realizada", "Jugador retirado", etc.).

### 5.5 Fechas en las respuestas

TypeORM se configura (en `TypeOrmModule.forRootAsync` y en `typeorm.config.ts`) con `dateStrings: true` y `timezone: '-05:00'` (opciones que TypeORM le pasa a `mysql2`), para que las fechas no se corran por zona horaria. En las entidades:

- Las columnas `DATE` se tipan como `string` y llegan como `"2026-12-05"`.
- Las columnas `DATETIME` se tipan como **`Date`**. TypeORM 1.1.2 las convierte siempre con `new Date(texto)`, aunque `dateStrings` esté activo (`node_modules/typeorm/driver/mysql/MysqlDriver.js`, `prepareHydratedValue`). Si se tipan como `string`, `fechaCreacion.replace(...)` da 500.
- Las `@CreateDateColumn` llevan `precision: 0` y `default: () => 'CURRENT_TIMESTAMP'`, para que sean `DATETIME` sin microsegundos. Sin eso, TypeORM pone `DATETIME(6)`.

En las respuestas:

- Las columnas `DATE` salen como `"2026-12-05"`.
- Las columnas `DATETIME` salen como `"2026-12-05T15:30:00"`. El mapper usa `aFechaHoraIso(valor: Date | string)` de `common/utils/`. **Tiene que aceptar `Date`**: arma el texto con los getters locales (`getFullYear`, `getMonth() + 1`, `getDate`, `getHours`…). Si llega un `string`, reemplaza el espacio por `T`.

### 5.6 DTOs compartidos (en `common/dto/`, Fase 0, no se modifican)

Los `*Resumen` son `interface` de TypeScript (solo salen en respuestas). `EstadoDto` es una clase con `@IsBoolean()`, porque es de entrada y la valida el `ValidationPipe`. Forma exacta:

```json
// EstadoRequest
{ "activo": false }

// DeporteResumen
{ "id": 1, "nombre": "Fútbol", "activo": true }

// EquipoResumen
{ "id": 4, "nombre": "Once Caldas", "activo": true }

// JugadorResumen
{ "id": 7, "tipoDocumento": "CC", "numeroDocumento": "1053000000", "nombreCompleto": "Juan Pérez", "activo": true }

// HabilidadResumen
{ "id": 2, "nombre": "Regate", "categoria": "TECNICA" }

// TorneoResumen
{ "id": 1, "nombre": "Copa Caldas 2026", "estado": "EN_CURSO" }

// FaseResumen
{ "id": 3, "nombre": "Grupo A", "tipo": "GRUPO", "orden": 1 }

// EscenarioResumen
{ "id": 1, "nombre": "Estadio Palogrande" }

// PartidoResumen
{
  "id": 20,
  "equipoLocal": { "id": 4, "nombre": "Once Caldas", "activo": true },
  "equipoVisitante": { "id": 9, "nombre": "Deportes Pereira", "activo": true },
  "fechaHora": "2026-12-05T15:30:00",
  "estado": "FINALIZADO",
  "marcadorLocal": 2,
  "marcadorVisitante": 1,
  "tieneResultado": true,
  "ronda": null,
  "numeroLlave": null
}
```

`tieneResultado` es `true` cuando `marcadorLocal` y `marcadorVisitante` no son `null`.

---

## 6. Modelo de datos

Basado en el diagrama de clases del equipo. Nombres de tablas y columnas **exactos**: cada tabla es una clase `@Entity('nombre_tabla')` y cada columna una propiedad en `camelCase` con `@Column({ name: 'nombre_columna' })`. Todas las tablas tienen `id` (`@PrimaryGeneratedColumn()`). Las subclases de `Fase` comparten la tabla `fase` (6.11).

Cómo se escribe cada cosa en TypeORM (mismo estilo que `Screening` en `ms-cinema`):

| En las tablas de abajo | En la entidad |
|---|---|
| `xxx_id` INT, FK → `xxx.id` | `@ManyToOne(() => Xxx, { nullable: false, onDelete: 'NO ACTION' })` + `@JoinColumn({ name: 'xxx_id' })` (si la columna es NULL: `nullable: true`) |
| `UNIQUE (a, b)` | `@Unique(['a', 'b'])` sobre la clase (con el nombre de la propiedad, también si es una relación) |
| `fecha_creacion`, `fecha_asociacion`, `fecha_registro`... DATETIME NOT NULL (se llena al crear) | `@CreateDateColumn({ name: 'fecha_creacion', type: 'datetime' })` |
| `activo` BOOLEAN, default `true` | `@Column({ type: 'boolean', default: true })` |
| Enum guardado como VARCHAR | `@Column({ type: 'varchar', length: 30 })` tipado con el `enum` |

### 6.1 `deporte` (A)

| Columna | Tipo | Restricciones |
|---|---|---|
| `nombre` | VARCHAR(100) | NOT NULL, UNIQUE |
| `descripcion` | VARCHAR(500) | NULL |
| `deporte_padre_id` | INT | NULL, FK → `deporte.id` |
| `activo` | BOOLEAN | NOT NULL, default `true` |
| `fecha_creacion` | DATETIME | NOT NULL |

- Un deporte con `deporte_padre_id` es un **subdeporte** (ej.: Fútbol → Fútbol de salón).
- **Solo dos niveles:** el padre debe ser un deporte principal (sin padre). Un deporte no puede ser su propio padre.
- Se puede eliminar solo si **no tiene subdeportes, equipos asociados ni torneos**.

### 6.2 `equipo` (A)

| Columna | Tipo | Restricciones |
|---|---|---|
| `nombre` | VARCHAR(100) | NOT NULL, UNIQUE |
| `ciudad` | VARCHAR(100) | NOT NULL |
| `fecha_fundacion` | DATE | NULL, no puede ser futura |
| `descripcion` | VARCHAR(500) | NULL |
| `activo` | BOOLEAN | NOT NULL, default `true` |
| `fecha_creacion` | DATETIME | NOT NULL |

Se puede eliminar solo si **no tiene deportes asociados, ningún registro en `equipo_jugador` ni inscripciones**.

### 6.3 `equipo_deporte` (A)

| Columna | Tipo | Restricciones |
|---|---|---|
| `equipo_id` | INT | NOT NULL, FK → `equipo.id` |
| `deporte_id` | INT | NOT NULL, FK → `deporte.id` |
| `fecha_asociacion` | DATETIME | NOT NULL |

UNIQUE (`equipo_id`, `deporte_id`). Retirar la asociación = borrar la fila. No se puede retirar si el equipo está inscrito en un torneo de ese deporte que no esté `FINALIZADO` ni `CANCELADO` → `400 INVALID_OPERATION`.

### 6.4 `jugador` (B)

| Columna | Tipo | Restricciones |
|---|---|---|
| `tipo_documento` | VARCHAR(20) | NOT NULL, enum `TipoDocumento`: `CC`, `TI`, `CE`, `PASAPORTE` |
| `numero_documento` | VARCHAR(20) | NOT NULL |
| `nombres` | VARCHAR(100) | NOT NULL |
| `apellidos` | VARCHAR(100) | NOT NULL |
| `fecha_nacimiento` | DATE | NOT NULL, debe ser pasada |
| `email` | VARCHAR(150) | NULL, formato email |
| `telefono` | VARCHAR(20) | NULL |
| `activo` | BOOLEAN | NOT NULL, default `true` |
| `fecha_creacion` | DATETIME | NOT NULL |

UNIQUE (`tipo_documento`, `numero_documento`): ese es el identificador único contra duplicados.
Se puede eliminar solo si **no tiene registros en `equipo_jugador`, `habilidad_jugador` ni `anotacion`**.

### 6.5 `equipo_jugador` (B): contratos e historial

| Columna | Tipo | Restricciones |
|---|---|---|
| `equipo_id` | INT | NOT NULL, FK → `equipo.id` |
| `jugador_id` | INT | NOT NULL, FK → `jugador.id` |
| `fecha_inicio` | DATE | NOT NULL |
| `fecha_fin` | DATE | NOT NULL, mayor que `fecha_inicio` |
| `fecha_retiro` | DATE | NULL (se llena al retirar) |
| `activo` | BOOLEAN | NOT NULL, default `true` |

- **Las filas nunca se borran.** Retirar un jugador = `activo = false` y `fecha_retiro = hoy` (o la fecha enviada). Así queda el **historial de traspasos**.
- No puede haber **dos contratos activos del mismo jugador con el mismo equipo** → `409 ALREADY_EXISTS`.
- Un jugador **sí** puede estar activo en varios equipos a la vez (por ejemplo, en deportes distintos).
- Un jugador retirado puede volver a firmar con el mismo equipo (se crea una fila nueva).

### 6.6 `habilidad` (B)

| Columna | Tipo | Restricciones |
|---|---|---|
| `nombre` | VARCHAR(100) | NOT NULL, UNIQUE |
| `descripcion` | VARCHAR(500) | NULL |
| `categoria` | VARCHAR(20) | NOT NULL, enum `CategoriaHabilidad`: `TECNICA`, `FISICA`, `TACTICA`, `MENTAL` |
| `fecha_creacion` | DATETIME | NOT NULL |

No tiene `activo`. Se puede eliminar solo si **ningún jugador la tiene asignada** (se revisa con el repositorio de C).

### 6.7 `habilidad_jugador` (C)

| Columna | Tipo | Restricciones |
|---|---|---|
| `habilidad_id` | INT | NOT NULL, FK → `habilidad.id` |
| `jugador_id` | INT | NOT NULL, FK → `jugador.id` |
| `fecha_asignacion` | DATETIME | NOT NULL |

UNIQUE (`habilidad_id`, `jugador_id`). Retirar = borrar la fila. La habilidad sigue existiendo.

### 6.8 `torneo` (A)

| Columna | Tipo | Restricciones |
|---|---|---|
| `nombre` | VARCHAR(150) | NOT NULL, UNIQUE |
| `deporte_id` | INT | NOT NULL, FK → `deporte.id` |
| `descripcion` | VARCHAR(500) | NULL |
| `fecha_inicio` | DATE | NOT NULL |
| `fecha_fin` | DATE | NOT NULL, ≥ `fecha_inicio` |
| `fecha_cierre_inscripciones` | DATE | NOT NULL, ≤ `fecha_inicio` |
| `max_equipos` | INT | NULL, ≥ 2 |
| `estado` | VARCHAR(30) | NOT NULL, enum `EstadoTorneo` |
| `fecha_creacion` | DATETIME | NOT NULL |

**`EstadoTorneo`** y transiciones permitidas (cualquier otra → `400 INVALID_OPERATION`):

| Estado | Puede pasar a |
|---|---|
| `INSCRIPCIONES_ABIERTAS` (inicial) | `INSCRIPCIONES_CERRADAS`, `CANCELADO` |
| `INSCRIPCIONES_CERRADAS` | `INSCRIPCIONES_ABIERTAS`, `EN_CURSO`, `CANCELADO` |
| `EN_CURSO` | `FINALIZADO`, `CANCELADO` |
| `FINALIZADO` | (ninguno) |
| `CANCELADO` | (ninguno) |

- El deporte debe existir y estar activo.
- **"Inscripciones abiertas"** significa `estado = INSCRIPCIONES_ABIERTAS` **y** hoy ≤ `fecha_cierre_inscripciones`.
- **Desactivar un torneo = pasarlo a `CANCELADO`.** No tiene columna `activo`.
- Solo se puede editar si no está `FINALIZADO` ni `CANCELADO`. No se puede cambiar el deporte si ya tiene inscripciones.
- Se puede eliminar solo si **no tiene fases ni inscripciones** (los partidos cuelgan de las fases).

### 6.9 `escenario` (A): solo lo mínimo

El CRUD de escenarios es del Anexo 4 (entrega 3). En esta entrega solo existe la tabla para que un partido pueda tener escenario (HU-GC-06: *"cuando corresponda"*). Los registros se insertan a mano con SQL.

| Columna | Tipo | Restricciones |
|---|---|---|
| `nombre` | VARCHAR(150) | NOT NULL, UNIQUE |
| `direccion` | VARCHAR(255) | NULL |
| `capacidad` | INT | NULL |
| `escenario_padre_id` | INT | NULL, FK → `escenario.id` |

`EscenarioTorneo` **no** se crea en esta entrega.

### 6.10 `inscripcion` (A)

| Columna | Tipo | Restricciones |
|---|---|---|
| `torneo_id` | INT | NOT NULL, FK → `torneo.id` |
| `equipo_id` | INT | NOT NULL, FK → `equipo.id` |
| `fecha_inscripcion` | DATETIME | NOT NULL |

UNIQUE (`torneo_id`, `equipo_id`).

**Para inscribir:**
- El torneo y el equipo deben existir. El equipo debe estar activo.
- Las inscripciones del torneo deben estar abiertas.
- El equipo debe estar asociado (`equipo_deporte`) **al deporte del torneo**.
- No se puede pasar de `max_equipos` (si está definido).

**Para retirar (borrar la fila):**
- Las inscripciones del torneo deben estar abiertas.
- El equipo no puede estar en ningún grupo del torneo ni tener partidos en el torneo.

### 6.11 Fases: herencia `Fase` → `Grupo` / `FaseFinal` (C)

En el diagrama, `Fase` es **abstracta** y tiene dos subclases: `Grupo` y `Final`. TypeORM no maneja la herencia "una tabla por subclase"; lo que trae es **herencia en una sola tabla** (*single table inheritance*): una tabla `fase` con las columnas de todas las subclases y una columna discriminadora `tipo` que dice de qué subclase es cada fila. Las columnas propias de `FaseFinal` quedan en `NULL` en los grupos.

En TypeScript (`fase/entities/`):

```ts
export enum TipoFase { GRUPO = 'GRUPO', FINAL = 'FINAL' }

@Entity('fase')
@TableInheritance({ column: { type: 'varchar', length: 20, name: 'tipo' } })
@Unique(['torneo', 'nombre'])
export abstract class Fase {   // "clase abstracta": nunca existe una Fase que no sea Grupo o FaseFinal
  @PrimaryGeneratedColumn() id!: number;

  @ManyToOne(() => Torneo, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'torneo_id' })
  torneo!: Torneo;

  @Column({ type: 'varchar', length: 100 }) nombre!: string;
  @Column({ type: 'int' }) orden!: number;
  @CreateDateColumn({ name: 'fecha_creacion', type: 'datetime', precision: 0, default: () => 'CURRENT_TIMESTAMP' }) fechaCreacion!: Date; // DATETIME llega como Date (5.5)
}

@ChildEntity(TipoFase.GRUPO)
export class Grupo extends Fase {}

@ChildEntity(TipoFase.FINAL)
export class FaseFinal extends Fase {
  @Column({ name: 'cantidad_equipos', type: 'int', nullable: true }) cantidadEquipos!: number;
  @Column({ name: 'tercer_puesto', type: 'boolean', nullable: true }) tercerPuesto!: boolean;
}
```

- `tipo` **no** se declara como propiedad: lo llena TypeORM al guardar con `Repository<Grupo>` o `Repository<FaseFinal>`.
- Un `Repository<Fase>` devuelve objetos `Grupo` o `FaseFinal`; el subtipo se pregunta con `fase instanceof FaseFinal`. El mapper pone `tipo` en las respuestas.

**`fase`** (clases `Fase`, `Grupo` y `FaseFinal`)

| Columna | Tipo | Restricciones |
|---|---|---|
| `torneo_id` | INT | NOT NULL, FK → `torneo.id` |
| `nombre` | VARCHAR(100) | NOT NULL |
| `orden` | INT | NOT NULL, ≥ 1 |
| `tipo` | VARCHAR(20) | NOT NULL, discriminador: `GRUPO` o `FINAL` |
| `cantidad_equipos` | INT | NULL. En `FINAL` es obligatorio y uno de: 2, 4, 8, 16, 32 (se valida en el DTO y el servicio) |
| `tercer_puesto` | BOOLEAN | NULL. En `FINAL` es obligatorio (si no se envía, `false`) |
| `fecha_creacion` | DATETIME | NOT NULL |

UNIQUE (`torneo_id`, `nombre`).

> `FaseFinal` es "Final" en el diagrama; se renombra para que no se confunda con la ronda `FINAL`.

**`grupo_equipo`** (equipos de cada grupo, clase `GrupoEquipo`)

| Columna | Tipo | Restricciones |
|---|---|---|
| `grupo_id` | INT | NOT NULL, FK → `fase.id` (`@ManyToOne(() => Grupo, { onDelete: 'CASCADE' })`) |
| `equipo_id` | INT | NOT NULL, FK → `equipo.id` |

UNIQUE (`grupo_id`, `equipo_id`).

> El diagrama dibuja Grupo 1—n Equipo. Se usa la tabla `grupo_equipo` porque un mismo equipo juega varios torneos y estará en grupos distintos de cada uno. Si se pusiera `grupo_id` en `equipo`, solo podría estar en un grupo en toda su vida.

Reglas:
- **Cómo se arma la estructura:** cada grupo es una fase (ej.: "Grupo A" y "Grupo B", ambos con `orden = 1`). **Los grupos que tienen el mismo `orden` forman la fase de grupos de esa etapa.** La fase final es otra fase con un `orden` mayor (ej.: `orden = 2`).
- Solo puede haber **una `FaseFinal` por torneo**, y su `orden` debe ser mayor que el de todos los grupos del torneo.
- Un equipo debe estar **inscrito en el torneo** para entrar a un grupo.
- **Un equipo no puede estar en dos grupos del mismo torneo con el mismo `orden`** → `409 ALREADY_EXISTS`.
- No se pueden crear ni modificar fases si el torneo está `FINALIZADO` o `CANCELADO`.
- Retirar un equipo de un grupo: solo si no tiene partidos en ese grupo.
- Eliminar una fase (grupo o final): solo si **no tiene partidos**. Al eliminar un grupo se borran sus filas de `grupo_equipo` (por el `CASCADE`), pero los equipos siguen existiendo.
- En la fase final, `cantidad_equipos` no se puede cambiar si ya tiene partidos.

**Rondas de la fase final** (enum `RondaFinal`), según `cantidad_equipos`:

| `cantidad_equipos` | Rondas (en orden) |
|---|---|
| 32 | `DIECISEISAVOS` → `OCTAVOS` → `CUARTOS` → `SEMIFINAL` → `FINAL` |
| 16 | `OCTAVOS` → `CUARTOS` → `SEMIFINAL` → `FINAL` |
| 8 | `CUARTOS` → `SEMIFINAL` → `FINAL` |
| 4 | `SEMIFINAL` → `FINAL` |
| 2 | `FINAL` |

Si `tercer_puesto = true`, existe también la ronda `TERCER_PUESTO` (1 llave). Cada ronda tiene `equipos_de_la_ronda / 2` llaves, numeradas desde 1.

### 6.12 `partido` (B)

En el diagrama, `Partido` es la clase de asociación entre dos equipos, pertenece a una `Fase` y puede tener un `Escenario`.

| Columna | Tipo | Restricciones |
|---|---|---|
| `fase_id` | INT | NOT NULL, FK → `fase.id` |
| `equipo_local_id` | INT | NOT NULL, FK → `equipo.id` |
| `equipo_visitante_id` | INT | NOT NULL, FK → `equipo.id` |
| `fecha_hora` | DATETIME | NOT NULL, dentro de las fechas del torneo |
| `escenario_id` | INT | NULL, FK → `escenario.id` |
| `ronda` | VARCHAR(20) | NULL, enum `RondaFinal` (obligatorio si la fase es `FINAL`) |
| `numero_llave` | INT | NULL (obligatorio si la fase es `FINAL`) |
| `estado` | VARCHAR(20) | NOT NULL, enum `EstadoPartido` |
| `marcador_local` | INT | NULL, ≥ 0 |
| `marcador_visitante` | INT | NULL, ≥ 0 |
| `fecha_creacion` | DATETIME | NOT NULL |

**`EstadoPartido`** y transiciones:

| Estado | Puede pasar a |
|---|---|
| `PROGRAMADO` (inicial) | `EN_JUEGO`, `CANCELADO` |
| `EN_JUEGO` | `FINALIZADO`, `CANCELADO` |
| `FINALIZADO` | (ninguno) |
| `CANCELADO` | (ninguno) |

Reglas:
- `equipo_local_id` ≠ `equipo_visitante_id` → si no, `400 INVALID_OPERATION` ("un equipo no puede competir contra sí mismo").
- **Equipos habilitados:** ambos activos e inscritos en el torneo de la fase. Si la fase es un `Grupo`, ambos deben pertenecer a ese grupo.
- Si la fase es `FINAL`: `ronda` debe ser válida para su `cantidad_equipos`, `numero_llave` debe estar en rango, y no puede haber dos partidos no cancelados en la misma (`fase_id`, `ronda`, `numero_llave`). Si la fase es `GRUPO`, `ronda` y `numero_llave` deben ir en `null`.
- Solo se pueden crear partidos si el torneo está `INSCRIPCIONES_CERRADAS` o `EN_CURSO`.
- **Editar** (equipos, fecha, escenario, ronda): solo en `PROGRAMADO`.
- **Eliminar:** solo en `PROGRAMADO` y sin anotaciones.
- **Resultado** (`marcador_local`, `marcador_visitante`): se registra o modifica en `EN_JUEGO` o `FINALIZADO`, mientras el torneo no esté `FINALIZADO`.
- Pasar a `FINALIZADO` exige que el resultado esté registrado.
- El marcador **no** se calcula a partir de las anotaciones: son datos independientes que registra el administrador.

### 6.13 `anotacion` (B)

| Columna | Tipo | Restricciones |
|---|---|---|
| `partido_id` | INT | NOT NULL, FK → `partido.id` |
| `jugador_id` | INT | NOT NULL, FK → `jugador.id` |
| `minuto` | INT | NULL, ≥ 0 |
| `valor` | INT | NOT NULL, default 1, ≥ 1 (puntos de la anotación: 1 gol, 3 un triple, etc.) |
| `descripcion` | VARCHAR(255) | NULL |
| `fecha_registro` | DATETIME | NOT NULL |

- Solo se registran en partidos `EN_JUEGO` o `FINALIZADO`.
- El jugador debe tener **contrato activo** (`equipo_jugador.activo = true`) con el equipo local o con el visitante. El equipo de la anotación se deduce de ese contrato y se devuelve en la respuesta.
- Eliminar una anotación no afecta al jugador ni al partido.

### 6.14 Entidades (clases de TypeORM)

Cada tabla tiene una clase `@Entity` en la carpeta `entities/` de su dueño. Las llaves foráneas son **relaciones** (`@ManyToOne`), no ids sueltos: por ejemplo, `Partido` tiene `fase: Fase`, `equipoLocal: Equipo`, `equipoVisitante: Equipo` y `escenario: Escenario | null`. Para traer una relación se pide en la consulta (`relations: { equipoLocal: true }`); para filtrar por id basta `where: { fase: { id: faseId } }`.

- La relación se declara en la entidad que **tiene la columna FK** (el lado "muchos"). **No se agregan `@OneToMany` en entidades ajenas**: si de verdad te hace falta el lado inverso en una entidad de otro, pídeselo al dueño (casi siempre basta con `existsBy` o `countBy` desde tu lado).
- Las entidades de otros se importan para declarar relaciones y para leer (sección 7). Los nombres de sus propiedades son contrato: no se renombran después de la Fase 0b sin acuerdo.

| Tabla | Clase | Archivo |
|---|---|---|
| `deporte` | `Deporte` | `deporte/entities/deporte.entity.ts` |
| `equipo` | `Equipo` | `equipo/entities/equipo.entity.ts` |
| `equipo_deporte` | `EquipoDeporte` | `equipo/entities/equipo-deporte.entity.ts` |
| `torneo` | `Torneo` | `torneo/entities/torneo.entity.ts` |
| `inscripcion` | `Inscripcion` | `torneo/entities/inscripcion.entity.ts` |
| `escenario` | `Escenario` | `escenario/entities/escenario.entity.ts` |
| `jugador` | `Jugador` | `jugador/entities/jugador.entity.ts` |
| `equipo_jugador` | `EquipoJugador` | `jugador/entities/equipo-jugador.entity.ts` |
| `habilidad` | `Habilidad` | `habilidad/entities/habilidad.entity.ts` |
| `partido` | `Partido` | `partido/entities/partido.entity.ts` |
| `anotacion` | `Anotacion` | `partido/entities/anotacion.entity.ts` |
| `habilidad_jugador` | `HabilidadJugador` | `habilidad-jugador/entities/habilidad-jugador.entity.ts` |
| `fase` | `Fase` (abstracta), `Grupo`, `FaseFinal` | `fase/entities/fase.entity.ts` |
| `grupo_equipo` | `GrupoEquipo` | `fase/entities/grupo-equipo.entity.ts` |

Enums (archivo `*.enum.ts` en `entities/` del dueño): `EstadoTorneo` (A), `TipoDocumento`, `CategoriaHabilidad`, `EstadoPartido` (B), `TipoFase`, `RondaFinal` (C).

### 6.15 Migraciones

Las tablas se crean con **migraciones de TypeORM**, igual que en las guías 2 a 4 de `ms-cinema`. Scripts de `package.json` (los pone A):

```bash
npm run migration:generate -- src/migrations/BJugadoresHabilidades   # typeorm-ts-node-commonjs migration:generate -d ./typeorm.config.ts
npm run migration:run                                                # typeorm-ts-node-commonjs migration:run -d ./typeorm.config.ts
```

- `synchronize: false` siempre, también en local: así la BD de los tres queda igual y las migraciones son lo que se entrega.
- **Orden de la Fase 0b** (hay llaves foráneas entre personas):

| # | Migración | Dueño | Tablas |
|---|---|---|---|
| 1 | `AInicial` | A | `deporte`, `equipo`, `equipo_deporte`, `escenario`, `torneo`, `inscripcion` |
| 2 | `BJugadoresHabilidades` | B | `jugador`, `equipo_jugador`, `habilidad` |
| 3 | `CFasesHabilidadJugador` | C | `fase`, `grupo_equipo`, `habilidad_jugador` |
| 4 | `BPartidosAnotaciones` | B | `partido`, `anotacion` |

- Antes de generar una migración: `git pull` + `npm run migration:run` (tu BD al día con `main`). Después **revisa el archivo generado**: debe tocar solo tus tablas. Si trae cambios de tablas ajenas, tu BD local no estaba al día; bórralo, ponte al día y genera otra vez.
- Una migración que ya está en `main` **no se edita**: si hay que cambiar una tabla, se crea otra migración (y se avisa en el grupo, porque los demás pueden estar leyendo esa tabla).
- Las FK van con `onDelete: 'NO ACTION'`, salvo `grupo_equipo.grupo_id` (`CASCADE`). Así MySQL también impide borrar cosas con datos asociados.
- Resultado esperado: **14 tablas** + la tabla `migrations` de TypeORM.

---

---

## 7. Puntos de integración entre personas

Hay dos formas permitidas de usar datos de otra persona:

1. **Leer con el repositorio de TypeORM de su entidad:** en tu módulo agregas la entidad ajena a `TypeOrmModule.forFeature([...])` y en tu servicio inyectas `@InjectRepository(Equipo) private readonly equipoRepository: Repository<Equipo>`. Solo métodos de lectura: `findOneBy`, `findOne`, `find`, `existsBy`, `exists`, `countBy`.
2. **Leer sus tablas desde tu propio repositorio** (`repositories/`, con `dataSource.query` o `createQueryBuilder`) con `SELECT`/`JOIN`, por ejemplo para la tabla de posiciones. Solo las columnas de la sección 6.

**Nunca** `save`, `insert`, `update`, `delete` ni `remove` (ni SQL `INSERT`/`UPDATE`/`DELETE`) sobre tablas ajenas.

Consultas que se esperan entre personas. Si necesitas otra consulta de solo lectura, puedes hacerla; si necesitas que el dueño cambie su entidad, pídeselo.

| Entidad (dueño) | Consulta | La usa | Para qué |
|---|---|---|---|
| `Equipo` (A) | `findOneBy({ id })` | B, C | Validar equipos |
| `Torneo` (A) | `findOne({ where: { id }, relations: { deporte: true } })` | B, C | Fases, partidos, desarrollo |
| `Inscripcion` (A) | `existsBy({ torneo: { id: torneoId }, equipo: { id: equipoId } })` | B, C | Equipo habilitado en el torneo |
| `Inscripcion` (A) | `find({ where: { torneo: { id: torneoId } }, relations: { equipo: true } })` | C | Desarrollo del torneo |
| `Escenario` (A) | `findOneBy({ id })` | B | Escenario del partido |
| `Jugador` (B) | `findOneBy({ id })` | C | Asignar habilidad, perfil |
| `Habilidad` (B) | `findOneBy({ id })` | C | Asignar habilidad |
| `EquipoJugador` (B) | `existsBy({ equipo: { id: equipoId } })` | A | Eliminar equipo |
| `EquipoJugador` (B) | `find({ where: { jugador: { id } }, relations: { equipo: true }, order: { fechaInicio: 'DESC' } })` | C | Perfil |
| `Partido` (B) | `existsBy({ fase: { id: faseId } })` | C | Eliminar fase / cambiar cantidad de equipos |
| `Partido` (B) | `find({ where: { fase: { id: faseId } }, relations: { equipoLocal: true, equipoVisitante: true }, order: { fechaHora: 'ASC' } })` | C | Llaves, tabla de posiciones, desarrollo |
| `Partido` (B) | `exists({ where: [{ fase: { id: faseId }, equipoLocal: { id: equipoId } }, { fase: { id: faseId }, equipoVisitante: { id: equipoId } }] })` | C | Retirar equipo de un grupo |
| `Partido` (B) | lo mismo con `fase: { torneo: { id: torneoId } }` | A | Retirar inscripción |
| `Anotacion` (B) | `find({ where: { partido: { id } }, relations: { jugador: true }, order: { minuto: 'ASC' } })` | C | Desarrollo |
| `HabilidadJugador` (C) | `existsBy({ jugador: { id } })` / `existsBy({ habilidad: { id } })` | B | Eliminar jugador / eliminar habilidad |
| `Fase` (C) | `findOne({ where: { id }, relations: { torneo: true } })` → `instanceof Grupo` o `FaseFinal` | B | Crear partido |
| `Fase` (C) | `existsBy({ torneo: { id: torneoId } })` | A | Eliminar torneo |
| `GrupoEquipo` (C) | `existsBy({ grupo: { id: grupoId }, equipo: { id: equipoId } })` | B | Partido de grupo |
| `GrupoEquipo` (C) | `existsBy({ equipo: { id: equipoId }, grupo: { torneo: { id: torneoId } } })` | A | Retirar inscripción |

Ejemplo:

```ts
// inscripcion.service.ts (A): ¿el equipo ya está en algún grupo del torneo? GrupoEquipo es de C.
const estaEnUnGrupo = await this.grupoEquipoRepository.existsBy({
  equipo: { id: equipoId },
  grupo: { torneo: { id: torneoId } },
});
```

---

## 8. Notificaciones por correo (en `common/notificacion/`, de A)

Las HU-GC-06 y HU-GC-07 piden enviar correos a **aficionados**. Pero `Aficionado`, `Boleto` y `Apuesta` son de la entrega 3, así que en esta entrega **todavía no hay a quién buscar**. Para no bloquear a nadie:

```ts
// CorreoService: cliente HTTP (axios) de ms-notifications.
// No se usa await al llamarlo: envía en segundo plano. Si falla, registra el error con Logger y NO rompe la petición.
enviar(destinatarios: string[], asunto: string, cuerpoHtml: string): void;

// DestinatariosService
aficionadosDeEquipos(equipoLocalId: number, equipoVisitanteId: number): Promise<string[]>; // partido creado
aficionadosDelPartido(partidoId: number): Promise<string[]>;                               // anotación y partido finalizado
```

**Cómo se envía (igual que en la entrega 1):** `ms_security` ya manda correos llamando a `ms-notifications` (`HttpEmailClient` → `POST {EMAIL_SERVICE_URL}/api/2fa/send` y `/api/password-reset/send`, con el encabezado `X-Service-Key`). Este microservicio hace lo mismo desde `CorreoService`.

**Lo que falta en `ms-notifications` (Fase 0):** hoy solo tiene `POST /api/2fa/send` y `POST /api/password-reset/send`, con cuerpos y plantillas fijos. Hay que agregarle un endpoint genérico (Python/Flask, con las mismas validaciones que los otros dos: `X-Service-Key`, formato de los correos, tamaños y límite de envíos):

```
POST /api/notifications/send
X-Service-Key: <EMAIL_SERVICE_API_KEY>
{ "to": ["correo1@gmail.com", "correo2@gmail.com"], "subject": "Nuevo partido: Once Caldas vs Deportes Pereira", "html": "<p>...</p>" }

→ 200 { "message": "Correo enviado." }
→ 400 datos inválidos · 401 clave de servicio inválida · 429 demasiadas solicitudes · 502 Gmail no pudo enviar
```

- **Implementación en esta entrega:** los dos métodos de `DestinatariosService` devuelven la lista de la variable `NOTIFICACIONES_CORREOS_PRUEBA` (correos del equipo, separados por coma). Así se demuestra que el correo funciona.
- **En la entrega 3** se cambia solo la implementación de `DestinatariosService` para que consulte boletos y apuestas. Los demás no cambian nada.
- `ms-notifications` envía con la API de Gmail usando credenciales OAuth propias (`credentials/` y su `.env`, que **no se suben**). Para la demo basta con que **una persona** lo tenga configurado y corriendo (en la entrega 1 lo dejó funcionando Adrián con su proyecto de Google Cloud).
- **Límite de envíos:** por defecto `ms-notifications` acepta 5 correos por destinatario cada 10 minutos (`EMAIL_RATE_PER_RECIPIENT`, `EMAIL_RATE_WINDOW_SECONDS`). Con varias anotaciones seguidas a los mismos correos de prueba se llega al 429: para la demo, súbanlo en el `.env` de `ms-notifications`. Como `CorreoService` no rompe la petición, la anotación se guarda igual.
- El correo se envía **después** de que la operación quedó guardada (y la transacción confirmada), nunca antes.

**Quién llama qué (B):**

| Evento | Destinatarios | Asunto |
|---|---|---|
| Se crea un partido | `aficionadosDeEquipos(local, visitante)` | `Nuevo partido: {local} vs {visitante}` (torneo, fase, fecha, escenario) |
| Se registra una anotación | `aficionadosDelPartido(id)` | `¡Anotación en {local} vs {visitante}!` (jugador, minuto, marcador actual) |
| El partido pasa a `FINALIZADO` | `aficionadosDelPartido(id)` | `Resumen: {local} {m1} - {m2} {visitante}` (marcador final y lista de anotaciones) |

---

## 9. Endpoints

Todos con el prefijo `/api` y protegidos por el `SecurityGuard` (sección 10). **Cada fila de estas tablas es también un permiso en `ms_security`** (10.4): si no está registrado y asignado al rol, la ruta responde 403.

**Nombres de los cuerpos:** en las tablas, `XxxRequest` es la forma del JSON de entrada y `XxxResponse` la de salida. En NestJS se implementan como clases DTO: `XxxRequest` → `CrearXxxDto` (y `ActualizarXxxDto` para el PUT) y `XxxResponse` → `XxxResponseDto`. `EstadoRequest` es el `EstadoDto` de `common/dto/`.

La ruta no define al dueño: **el dueño es el del controlador** (ej.: `/api/equipos/{id}/jugadores` está bajo `equipos`, pero es de B).

### 9.1 Deportes: A (`DeporteController`) · HU-GD-01 · Solo Postman

| Método | Ruta | Body | Respuesta |
|---|---|---|---|
| POST | `/api/deportes` | `DeporteRequest` | 201 `DeporteResponse` |
| GET | `/api/deportes?nombre=&activo=&soloPrincipales=` | | 200 `DeporteResponse[]` |
| GET | `/api/deportes/{id}` | | 200 `DeporteResponse` |
| GET | `/api/deportes/{id}/subdeportes` | | 200 `DeporteResumen[]` |
| PUT | `/api/deportes/{id}` | `DeporteRequest` | 200 `DeporteResponse` |
| PATCH | `/api/deportes/{id}/estado` | `EstadoRequest` | 200 `DeporteResponse` |
| DELETE | `/api/deportes/{id}` | | 204 / 409 `HAS_ASSOCIATIONS` |

```json
// DeporteRequest
{ "nombre": "Fútbol de salón", "descripcion": "Variante en cancha cubierta", "deportePadreId": 1 }

// DeporteResponse
{
  "id": 3,
  "nombre": "Fútbol de salón",
  "descripcion": "Variante en cancha cubierta",
  "activo": true,
  "deportePadre": { "id": 1, "nombre": "Fútbol", "activo": true },
  "subdeportes": [],
  "fechaCreacion": "2026-11-20T10:00:00"
}
```

### 9.2 Equipos: A (`EquipoController`) · HU-GD-02

| Método | Ruta | Body | Respuesta |
|---|---|---|---|
| POST | `/api/equipos` | `EquipoRequest` | 201 `EquipoResponse` |
| GET | `/api/equipos?nombre=&ciudad=&activo=` | | 200 `EquipoResponse[]` |
| GET | `/api/equipos/{id}` | | 200 `EquipoResponse` |
| PUT | `/api/equipos/{id}` | `EquipoRequest` | 200 `EquipoResponse` |
| PATCH | `/api/equipos/{id}/estado` | `EstadoRequest` | 200 `EquipoResponse` |
| DELETE | `/api/equipos/{id}` | | 204 / 409 `HAS_ASSOCIATIONS` |

```json
// EquipoRequest
{ "nombre": "Once Caldas", "ciudad": "Manizales", "fechaFundacion": "1961-01-16", "descripcion": "..." }

// EquipoResponse
{
  "id": 4,
  "nombre": "Once Caldas",
  "ciudad": "Manizales",
  "fechaFundacion": "1961-01-16",
  "descripcion": "...",
  "activo": true,
  "fechaCreacion": "2026-11-20T10:00:00"
}
```

### 9.3 Equipo ↔ Deporte: A (`EquipoDeporteController`) · HU-GD-03

| Método | Ruta | Body | Respuesta |
|---|---|---|---|
| POST | `/api/equipos/{equipoId}/deportes` | `{ "deporteId": 1 }` | 201 `DeporteResumen` |
| GET | `/api/equipos/{equipoId}/deportes` | | 200 `DeporteResumen[]` |
| GET | `/api/deportes/{deporteId}/equipos` | | 200 `EquipoResumen[]` |
| DELETE | `/api/equipos/{equipoId}/deportes/{deporteId}` | | 204 |

Errores: no existe → 404 · asociación repetida → 409 `ALREADY_EXISTS` · equipo o deporte inactivo → 400 · la asociación no existe → 404.

### 9.4 Escenarios: A (`EscenarioController`) · solo lectura

| Método | Ruta | Respuesta |
|---|---|---|
| GET | `/api/escenarios` | 200 `EscenarioResumen[]` |

Lo usa B para la lista desplegable del formulario de partido.

### 9.5 Torneos: A (`TorneoController`) · HU-GC-01

| Método | Ruta | Body | Respuesta |
|---|---|---|---|
| POST | `/api/torneos` | `TorneoRequest` | 201 `TorneoResponse` |
| GET | `/api/torneos?nombre=&deporteId=&estado=` | | 200 `TorneoResponse[]` |
| GET | `/api/torneos/{id}` | | 200 `TorneoResponse` |
| PUT | `/api/torneos/{id}` | `TorneoRequest` | 200 `TorneoResponse` |
| PATCH | `/api/torneos/{id}/estado` | `{ "estado": "EN_CURSO" }` | 200 `TorneoResponse` |
| DELETE | `/api/torneos/{id}` | | 204 / 409 `HAS_ASSOCIATIONS` |

```json
// TorneoRequest
{
  "nombre": "Copa Caldas 2026",
  "deporteId": 1,
  "descripcion": "Torneo departamental",
  "fechaInicio": "2026-12-01",
  "fechaFin": "2026-12-20",
  "fechaCierreInscripciones": "2026-11-28",
  "maxEquipos": 8
}

// TorneoResponse
{
  "id": 1,
  "nombre": "Copa Caldas 2026",
  "deporte": { "id": 1, "nombre": "Fútbol", "activo": true },
  "descripcion": "Torneo departamental",
  "fechaInicio": "2026-12-01",
  "fechaFin": "2026-12-20",
  "fechaCierreInscripciones": "2026-11-28",
  "maxEquipos": 8,
  "estado": "INSCRIPCIONES_ABIERTAS",
  "inscripcionesAbiertas": true,
  "cantidadInscritos": 3,
  "fechaCreacion": "2026-11-20T10:00:00"
}
```

### 9.6 Inscripciones: A (`InscripcionController`) · HU-GC-02

| Método | Ruta | Body | Respuesta |
|---|---|---|---|
| POST | `/api/torneos/{torneoId}/inscripciones` | `{ "equipoIds": [4, 9] }` | 201 `InscripcionResponse[]` |
| GET | `/api/torneos/{torneoId}/inscripciones` | | 200 `InscripcionResponse[]` |
| GET | `/api/equipos/{equipoId}/torneos` | | 200 `InscripcionResponse[]` |
| DELETE | `/api/torneos/{torneoId}/inscripciones/{equipoId}` | | 204 |

```json
// InscripcionResponse
{
  "id": 30,
  "torneo": { "id": 1, "nombre": "Copa Caldas 2026", "estado": "INSCRIPCIONES_ABIERTAS" },
  "equipo": { "id": 4, "nombre": "Once Caldas", "activo": true },
  "fechaInscripcion": "2026-11-20T10:00:00"
}
```

- Inscribir varios es **todo o nada** (en una transacción con `dataSource.transaction()`): si un equipo falla, no se inscribe ninguno y el `mensaje` dice cuál falló y por qué.
- Errores: no existe → 404 · ya inscrito → 409 `ALREADY_EXISTS` · inscripciones cerradas, equipo inactivo, equipo sin el deporte del torneo o cupo lleno → 400 `INVALID_OPERATION` · retirar con grupos o partidos → 400 `INVALID_OPERATION`.

### 9.7 Jugadores: B (`JugadorController`) · HU-GD-04

| Método | Ruta | Body | Respuesta |
|---|---|---|---|
| POST | `/api/jugadores` | `JugadorRequest` | 201 `JugadorResponse` |
| GET | `/api/jugadores?busqueda=&activo=` | | 200 `JugadorResponse[]` |
| GET | `/api/jugadores/{id}` | | 200 `JugadorResponse` |
| PUT | `/api/jugadores/{id}` | `JugadorRequest` | 200 `JugadorResponse` |
| PATCH | `/api/jugadores/{id}/estado` | `EstadoRequest` | 200 `JugadorResponse` |
| DELETE | `/api/jugadores/{id}` | | 204 / 409 `HAS_ASSOCIATIONS` |

`busqueda` filtra por nombres, apellidos o número de documento (contiene, sin importar mayúsculas). **C la usa en la pantalla del perfil** para buscar jugadores.

```json
// JugadorRequest
{
  "tipoDocumento": "CC",
  "numeroDocumento": "1053000000",
  "nombres": "Juan",
  "apellidos": "Pérez",
  "fechaNacimiento": "2002-05-10",
  "email": "juan@correo.com",
  "telefono": "3001234567"
}

// JugadorResponse
{
  "id": 7,
  "tipoDocumento": "CC",
  "numeroDocumento": "1053000000",
  "nombres": "Juan",
  "apellidos": "Pérez",
  "nombreCompleto": "Juan Pérez",
  "fechaNacimiento": "2002-05-10",
  "edad": 24,
  "email": "juan@correo.com",
  "telefono": "3001234567",
  "activo": true,
  "fechaCreacion": "2026-11-20T10:00:00"
}
```

### 9.8 Equipo ↔ Jugador (contratos): B (`EquipoJugadorController`) · HU-GD-05

| Método | Ruta | Body | Respuesta |
|---|---|---|---|
| POST | `/api/equipos/{equipoId}/jugadores` | `ContratoRequest` | 201 `ContratoResponse` |
| GET | `/api/equipos/{equipoId}/jugadores?incluirHistorial=false` | | 200 `ContratoResponse[]` |
| GET | `/api/jugadores/{jugadorId}/equipos?incluirHistorial=false` | | 200 `ContratoResponse[]` |
| PATCH | `/api/equipos/{equipoId}/jugadores/{jugadorId}/retiro` | `{ "fechaRetiro": "2026-12-01" }` (opcional; si no viene, es hoy) | 200 `ContratoResponse` |

Por defecto solo devuelve contratos activos. Con `incluirHistorial=true` devuelve todos, del más reciente al más antiguo.

```json
// ContratoRequest
{ "jugadorId": 7, "fechaInicio": "2026-01-01", "fechaFin": "2027-12-31" }

// ContratoResponse
{
  "id": 15,
  "jugador": { "id": 7, "tipoDocumento": "CC", "numeroDocumento": "1053000000", "nombreCompleto": "Juan Pérez", "activo": true },
  "equipo": { "id": 4, "nombre": "Once Caldas", "activo": true },
  "fechaInicio": "2026-01-01",
  "fechaFin": "2027-12-31",
  "fechaRetiro": null,
  "activo": true
}
```

Errores: no existe → 404 · ya tiene contrato activo con ese equipo → 409 · `fechaFin` ≤ `fechaInicio` o jugador/equipo inactivo → 400 · no hay contrato activo para retirar → 404.

### 9.9 Habilidades: B (`HabilidadController`) · HU-GD-06 · Solo Postman

| Método | Ruta | Body | Respuesta |
|---|---|---|---|
| POST | `/api/habilidades` | `HabilidadRequest` | 201 `HabilidadResponse` |
| GET | `/api/habilidades?nombre=&categoria=` | | 200 `HabilidadResponse[]` |
| GET | `/api/habilidades/{id}` | | 200 `HabilidadResponse` |
| PUT | `/api/habilidades/{id}` | `HabilidadRequest` | 200 `HabilidadResponse` |
| DELETE | `/api/habilidades/{id}` | | 204 / 409 `HAS_ASSOCIATIONS` |

```json
// HabilidadRequest
{ "nombre": "Regate", "descripcion": "Capacidad de eludir rivales", "categoria": "TECNICA" }

// HabilidadResponse
{ "id": 2, "nombre": "Regate", "descripcion": "Capacidad de eludir rivales", "categoria": "TECNICA", "fechaCreacion": "2026-11-20T10:00:00" }
```

### 9.10 Partidos: B (`PartidoController`) · HU-GC-06

| Método | Ruta | Body | Respuesta |
|---|---|---|---|
| POST | `/api/fases/{faseId}/partidos` | `PartidoRequest` | 201 `PartidoResponse` |
| GET | `/api/fases/{faseId}/partidos?estado=` | | 200 `PartidoResponse[]` |
| GET | `/api/partidos?torneoId=&equipoId=&estado=` | | 200 `PartidoResponse[]` |
| GET | `/api/partidos/{id}` | | 200 `PartidoResponse` |
| PUT | `/api/partidos/{id}` | `PartidoRequest` | 200 `PartidoResponse` |
| PATCH | `/api/partidos/{id}/estado` | `{ "estado": "EN_JUEGO" }` | 200 `PartidoResponse` |
| DELETE | `/api/partidos/{id}` | | 204 / 409 `HAS_ASSOCIATIONS` |

```json
// PartidoRequest
{
  "equipoLocalId": 4,
  "equipoVisitanteId": 9,
  "fechaHora": "2026-12-05T15:30:00",
  "escenarioId": 1,
  "ronda": null,
  "numeroLlave": null
}

// PartidoResponse
{
  "id": 20,
  "torneo": { "id": 1, "nombre": "Copa Caldas 2026", "estado": "EN_CURSO" },
  "fase": { "id": 3, "nombre": "Grupo A", "tipo": "GRUPO", "orden": 1 },
  "equipoLocal": { "id": 4, "nombre": "Once Caldas", "activo": true },
  "equipoVisitante": { "id": 9, "nombre": "Deportes Pereira", "activo": true },
  "fechaHora": "2026-12-05T15:30:00",
  "escenario": { "id": 1, "nombre": "Estadio Palogrande" },
  "ronda": null,
  "numeroLlave": null,
  "estado": "PROGRAMADO",
  "marcadorLocal": null,
  "marcadorVisitante": null,
  "tieneResultado": false,
  "cantidadAnotaciones": 0
}
```

Al crear un partido se envía el correo de la sección 8.

### 9.11 Resultados y anotaciones: B (`ResultadoController`, `AnotacionController`) · HU-GC-07

| Método | Ruta | Body | Respuesta |
|---|---|---|---|
| PUT | `/api/partidos/{id}/resultado` | `{ "marcadorLocal": 2, "marcadorVisitante": 1 }` | 200 `PartidoResponse` |
| POST | `/api/partidos/{partidoId}/anotaciones` | `AnotacionRequest` | 201 `AnotacionResponse` |
| GET | `/api/partidos/{partidoId}/anotaciones` | | 200 `AnotacionResponse[]` (por minuto) |
| PUT | `/api/anotaciones/{id}` | `AnotacionRequest` | 200 `AnotacionResponse` |
| DELETE | `/api/anotaciones/{id}` | | 204 |

Finalizar el partido es `PATCH /api/partidos/{id}/estado` con `{ "estado": "FINALIZADO" }` (9.10). Exige resultado registrado y envía el correo de resumen.

```json
// AnotacionRequest
{ "jugadorId": 7, "minuto": 34, "valor": 1, "descripcion": "Gol de cabeza" }

// AnotacionResponse
{
  "id": 50,
  "partidoId": 20,
  "jugador": { "id": 7, "tipoDocumento": "CC", "numeroDocumento": "1053000000", "nombreCompleto": "Juan Pérez", "activo": true },
  "equipo": { "id": 4, "nombre": "Once Caldas", "activo": true },
  "minuto": 34,
  "valor": 1,
  "descripcion": "Gol de cabeza",
  "fechaRegistro": "2026-12-05T16:05:00"
}
```

Para el formulario de anotación, el front lista los jugadores de cada equipo con `GET /api/equipos/{equipoId}/jugadores` (9.8).

### 9.12 Habilidad ↔ Jugador: C (`HabilidadJugadorController`) · HU-GD-07

| Método | Ruta | Body | Respuesta |
|---|---|---|---|
| POST | `/api/jugadores/{jugadorId}/habilidades` | `{ "habilidadId": 2 }` | 201 `HabilidadResumen` |
| GET | `/api/jugadores/{jugadorId}/habilidades` | | 200 `HabilidadResumen[]` |
| GET | `/api/habilidades/{habilidadId}/jugadores` | | 200 `JugadorResumen[]` |
| DELETE | `/api/jugadores/{jugadorId}/habilidades/{habilidadId}` | | 204 |

Errores: no existe → 404 · ya la tiene → 409 · jugador inactivo → 400 · la asignación no existe → 404.

### 9.13 Perfil deportivo: C (`PerfilController`) · HU-GD-08

| Método | Ruta | Respuesta |
|---|---|---|
| GET | `/api/jugadores/{jugadorId}/perfil` | 200 `PerfilJugadorResponse` |

```json
// PerfilJugadorResponse
{
  "jugador": {
    "id": 7, "tipoDocumento": "CC", "numeroDocumento": "1053000000", "nombreCompleto": "Juan Pérez",
    "fechaNacimiento": "2002-05-10", "edad": 24, "email": "juan@correo.com", "telefono": "3001234567", "activo": true
  },
  "equiposActuales": [
    { "equipo": { "id": 4, "nombre": "Once Caldas", "activo": true }, "fechaInicio": "2026-01-01", "fechaFin": "2027-12-31" }
  ],
  "historialEquipos": [
    { "equipo": { "id": 9, "nombre": "Deportes Pereira", "activo": true }, "fechaInicio": "2024-01-01", "fechaFin": "2025-12-31", "fechaRetiro": "2025-06-30" }
  ],
  "habilidades": [ { "id": 2, "nombre": "Regate", "categoria": "TECNICA" } ],
  "tieneEquipos": true,
  "tieneHabilidades": true,
  "mensajes": []
}
```

Si no tiene equipos activos: `tieneEquipos: false` y en `mensajes` va `"El jugador no tiene equipos asociados"`. Igual con habilidades: `"El jugador no tiene habilidades registradas"`. Los DTOs del perfil los define C en `perfil/dto/` (no reutiliza los de B).

### 9.14 Fases (genérico): C (`FaseController`) · HU-GC-03 · Solo Postman

`Fase` es abstracta: **se crea a través de su subtipo** (grupo en 9.15 o fase final en 9.16). Aquí va lo común a todas las fases.

| Método | Ruta | Body | Respuesta |
|---|---|---|---|
| GET | `/api/torneos/{torneoId}/fases` | | 200 `FaseResponse[]` (por `orden`, luego `nombre`) |
| GET | `/api/fases/{id}` | | 200 `FaseResponse` |
| PATCH | `/api/fases/{id}` | `{ "nombre": "Grupo A", "orden": 1 }` | 200 `FaseResponse` |
| DELETE | `/api/fases/{id}` | | 204 / 409 `HAS_ASSOCIATIONS` |

```json
// FaseResponse
{
  "id": 3,
  "torneo": { "id": 1, "nombre": "Copa Caldas 2026", "estado": "EN_CURSO" },
  "nombre": "Grupo A",
  "tipo": "GRUPO",
  "orden": 1,
  "cantidadEquipos": null,
  "tercerPuesto": null,
  "cantidadPartidos": 6
}
```

En un `GRUPO`, `cantidadEquipos` es cuántos equipos tiene asignados y `tercerPuesto` va en `null`.

### 9.15 Grupos: C (`GrupoController`) · HU-GC-04 · Solo Postman

| Método | Ruta | Body | Respuesta |
|---|---|---|---|
| POST | `/api/torneos/{torneoId}/grupos` | `{ "nombre": "Grupo A", "orden": 1 }` | 201 `GrupoResponse` |
| GET | `/api/torneos/{torneoId}/grupos?orden=` | | 200 `GrupoResponse[]` |
| GET | `/api/grupos/{id}` | | 200 `GrupoResponse` |
| PUT | `/api/grupos/{id}` | `{ "nombre": "Grupo A", "orden": 1 }` | 200 `GrupoResponse` |
| DELETE | `/api/grupos/{id}` | | 204 / 409 `HAS_ASSOCIATIONS` |
| POST | `/api/grupos/{grupoId}/equipos` | `{ "equipoIds": [4, 9, 11] }` | 201 `EquipoResumen[]` |
| GET | `/api/grupos/{grupoId}/equipos` | | 200 `EquipoResumen[]` |
| DELETE | `/api/grupos/{grupoId}/equipos/{equipoId}` | | 204 |
| GET | `/api/grupos/{grupoId}/tabla-posiciones` | | 200 `FilaPosicion[]` (lo usa HU-GC-08) |

```json
// GrupoResponse
{
  "id": 3,
  "torneo": { "id": 1, "nombre": "Copa Caldas 2026", "estado": "EN_CURSO" },
  "nombre": "Grupo A",
  "orden": 1,
  "equipos": [ { "id": 4, "nombre": "Once Caldas", "activo": true } ]
}

// FilaPosicion
{
  "posicion": 1,
  "equipo": { "id": 4, "nombre": "Once Caldas", "activo": true },
  "jugados": 3, "ganados": 2, "empatados": 1, "perdidos": 0,
  "aFavor": 5, "enContra": 2, "diferencia": 3, "puntos": 7
}
```

- Asignar varios equipos es **todo o nada**. Errores: equipo no inscrito → 400 · ya está en otro grupo del mismo torneo y `orden` → 409 · ya está en este grupo → 409.
- **Tabla de posiciones:** se calcula con los partidos `FINALIZADO` del grupo. Ganar = 3 puntos, empatar = 1, perder = 0. Se ordena por puntos, diferencia y a favor (de mayor a menor), y luego por nombre. Los equipos sin partidos jugados aparecen en ceros.

### 9.16 Fase final: C (`FaseFinalController`) · HU-GC-05

| Método | Ruta | Body | Respuesta |
|---|---|---|---|
| POST | `/api/torneos/{torneoId}/fase-final` | `FaseFinalRequest` | 201 `FaseResponse` |
| GET | `/api/torneos/{torneoId}/fase-final` | | 200 `FaseResponse` / 404 si no tiene |
| PUT | `/api/fases-finales/{id}` | `FaseFinalRequest` | 200 `FaseResponse` |
| DELETE | `/api/fases-finales/{id}` | | 204 / 409 `HAS_ASSOCIATIONS` |
| GET | `/api/fases-finales/{id}/llaves` | | 200 `LlavesResponse` |

```json
// FaseFinalRequest
{ "nombre": "Fase final", "orden": 2, "cantidadEquipos": 4, "tercerPuesto": true }

// LlavesResponse
{
  "fase": { "id": 8, "nombre": "Fase final", "tipo": "FINAL", "orden": 2 },
  "cantidadEquipos": 4,
  "tercerPuesto": true,
  "rondas": [
    {
      "ronda": "SEMIFINAL",
      "llaves": [
        { "numeroLlave": 1, "partido": { "...": "PartidoResumen" }, "ganador": { "id": 4, "nombre": "Once Caldas", "activo": true } },
        { "numeroLlave": 2, "partido": null, "ganador": null }
      ]
    },
    { "ronda": "FINAL", "llaves": [ { "numeroLlave": 1, "partido": null, "ganador": null } ] },
    { "ronda": "TERCER_PUESTO", "llaves": [ { "numeroLlave": 1, "partido": null, "ganador": null } ] }
  ]
}
```

- `rondas` siempre trae **todas** las rondas y llaves según `cantidadEquipos`, aunque no tengan partido (`partido: null`). Así el front dibuja el cuadro completo.
- `ganador` es el equipo con mayor marcador si el partido está `FINALIZADO`. Si empataron o no ha terminado, va en `null`.
- Los partidos de la fase final los crea B con `POST /api/fases/{faseId}/partidos` enviando `ronda` y `numeroLlave`. **Avanzar al ganador a la siguiente ronda es manual**: el administrador crea el partido de la siguiente ronda.

### 9.17 Desarrollo del torneo: C (`DesarrolloController`) · HU-GC-08

| Método | Ruta | Respuesta |
|---|---|---|
| GET | `/api/torneos/{torneoId}/desarrollo` | 200 `DesarrolloTorneoResponse` |

```json
// DesarrolloTorneoResponse
{
  "torneo": {
    "id": 1, "nombre": "Copa Caldas 2026",
    "deporte": { "id": 1, "nombre": "Fútbol", "activo": true },
    "fechaInicio": "2026-12-01", "fechaFin": "2026-12-20",
    "estado": "EN_CURSO", "cantidadInscritos": 8
  },
  "resumen": { "totalPartidos": 14, "conResultado": 9, "pendientes": 5 },
  "fases": [
    {
      "id": 3, "nombre": "Grupo A", "tipo": "GRUPO", "orden": 1,
      "equipos": [ { "id": 4, "nombre": "Once Caldas", "activo": true } ],
      "tablaPosiciones": [ { "...": "FilaPosicion" } ],
      "llaves": null,
      "partidos": [ { "...": "PartidoResumen" } ]
    },
    {
      "id": 8, "nombre": "Fase final", "tipo": "FINAL", "orden": 2,
      "equipos": null,
      "tablaPosiciones": null,
      "llaves": [ { "...": "rondas, igual que en LlavesResponse" } ],
      "partidos": [ { "...": "PartidoResumen" } ]
    }
  ]
}
```

- Fases ordenadas por `orden` y luego por `nombre`. **Solo trae datos del torneo pedido.**
- Las anotaciones de cada partido **no** vienen aquí. El front las pide al abrir un partido con `GET /api/partidos/{id}/anotaciones` (usando el componente `AnotacionesPartido` en modo `soloLectura`).
- En el front, los partidos se marcan como "Con resultado" o "Pendiente" según `tieneResultado`.

---

## 10. Seguridad

### 10.1 Cómo funciona hoy `ms_security` (entrega 1, ya en `main`)

- El login (`POST /api/auth/login`, y también OAuth y 2FA) devuelve un JWT **HS256** firmado con `security.jwt.secret` (variable `JWT_SECRET`: texto plano UTF-8 de mínimo 32 bytes, **no** Base64). Dura **15 minutos**.
- Claims: `iss = "ms-security"`, `sub` = id del usuario, `jti` = id de la sesión, `email`, `iat`, `exp`. **No trae roles ni permisos.**
- Cada token corresponde a una **sesión** guardada en la BD (`ActiveSessionValidator`): al cerrar sesión, cambiar la contraseña o desactivar al usuario, el token deja de servir aunque la firma siga siendo válida.
- La autorización es **dinámica, por permisos**: un permiso es `método + URL` (ej.: `GET /api/users/{id}`); los permisos se asignan a roles y los roles a usuarios. `DynamicAuthorizationManager` llama a `PermissionService.hasPermission(userId, método, URL)`, que cambia cada segmento numérico de la URL por `{id}` antes de buscar.
- Roles que crea el `DatabaseSeeder`: `ADMIN` (los permisos del módulo de seguridad), `CONSULTOR` y `USUARIO INICIAL`. Usuario administrador local: `admin@uc.edu.co`.

**Consecuencia:** validar el JWT localmente en Nest (con el `JWT_SECRET`) **no sirve**: no sabría si la sesión sigue activa ni qué permisos tiene el usuario. Por eso se usa el guard de la guía 5, que le pregunta a `ms_security`.

### 10.2 `SecurityGuard` en `ms-gestion-deportiva` (guía 5, de A)

- Es el guard de `ms-cinema` (`common/seguridad/security.guard.ts`), registrado global como `APP_GUARD` en `app.module.ts`. **Nadie pone guards en sus controladores.**
- En cada petición: lee `Authorization: Bearer <token>` → `POST {MS_SECURITY}/api/internal/security/permissions-validation` con `{ url: request.path, method: request.method }` y el mismo token → si la respuesta es `{ "allowed": true }`, sigue al controlador.
- `request.path` incluye el prefijo `/api` y no incluye el query string (`GET /api/torneos/5?x=1` → `/api/torneos/5`).
- Sin token o con formato inválido → 401 · `ms_security` responde 401 → 401 · `{ "allowed": false }` o 403 → 403 · `ms_security` no responde → 503. El filtro (5.3) los devuelve con el formato `{ errorCase, message }`.
- `@Public()` existe, pero en esta entrega **no hay rutas públicas**.
- Para probar en local sin `ms_security`: `SEGURIDAD_HABILITADA=false` en tu `.env` (el guard deja pasar todo). **En `.env.example` va en `true`**, y en la demo también.

### 10.3 Lo que falta en `ms_security` (Fase 0)

`ms_security` **todavía no tiene** el endpoint que usa el guard (la guía 5 lo da por hecho). Hay que agregarlo en Spring Boot, respetando sus capas:

```
POST /api/internal/security/permissions-validation
Authorization: Bearer <token del usuario>
{ "url": "/api/torneos/5", "method": "GET" }

→ 200 { "allowed": true }   o   200 { "allowed": false }
→ 401 si el token no es válido, expiró o la sesión se cerró
```

- Controller nuevo + `PermissionValidationRequestDTO` (`@NotBlank url`, `@NotBlank method`) y `PermissionValidationResponseDTO` (`allowed`). Reutiliza `PermissionService.hasPermission(userId, method, url)`, que ya normaliza los números a `{id}` (no se duplica lógica). `userId` = `authentication.getName()` (el `sub` del JWT).
- En `SecurityConfig` esa ruta va con `.authenticated()` (token válido + sesión activa) y **no** pasa por `DynamicAuthorizationManager`: si pasara, habría que tener permiso para preguntar por permisos.
- `SecurityConfig` es un archivo compartido de `ms_security`: se avisa en el grupo y va en un PR propio a `main` de `ProyectoDesarrolloBackend`.

### 10.4 Permisos y rol para esta entrega

- Se crea el rol **`ADMINISTRADOR DEPORTIVO`** (el "administrador deportivo" de las HU) desde la pantalla Roles del front y se asigna a los usuarios de prueba.
- **Cada fila de las tablas de la sección 9 es un permiso** en `ms_security`: `method` + `url` con el prefijo `/api`, `{id}` en cada segmento numérico y sin query string. Ejemplos: `GET /api/torneos`, `GET /api/torneos/{id}`, `DELETE /api/equipos/{id}/deportes/{id}`, `PATCH /api/equipos/{id}/jugadores/{id}/retiro`, `GET /api/fases-finales/{id}/llaves`.
- `model` del permiso = el recurso del primer segmento de la URL, para que el front lo agrupe bien en `constants/permissions.js`:

| URL empieza por | `model` | Recurso del front (`key`) |
|---|---|---|
| `/api/deportes` | `Deporte` | `deportes` |
| `/api/equipos` | `Equipo` | `equipos` |
| `/api/torneos` | `Torneo` | `torneos` |
| `/api/escenarios` | `Escenario` | `escenarios` |
| `/api/jugadores` | `Jugador` | `jugadores` |
| `/api/habilidades` | `Habilidad` | `habilidades` |
| `/api/partidos`, `/api/anotaciones` | `Partido` | `partidos` |
| `/api/fases`, `/api/grupos`, `/api/fases-finales` | `Fase` | `fases` |

- Cada persona registra los permisos de **sus** endpoints (pantalla Permisos del front o `POST /api/permissions`) y los asigna al rol (pantalla "Asignar Permisos a Roles"). Los `GET` que se usan para listas desplegables (deportes, habilidades, escenarios) también necesitan permiso.
- Para no perderlos al crear una BD nueva: o se guardan como una carpeta "Permisos" en la colección de Postman, o se agregan al `DatabaseSeeder` de `ms_security` (archivo compartido: solo con acuerdo).

### 10.5 CORS

`main.ts` habilita `app.enableCors({ origin: CORS_ORIGIN })` con `http://localhost:5173`, el mismo origen que ya permite `ms_security` (`CORS_ALLOWED_ORIGINS`).

### 10.6 Variables de `.env.example`

```
PORT=8182
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=
DB_DATABASE=gestion_deportiva_db
DB_SYNCHRONIZE=false
MS_SECURITY=http://localhost:8181
SEGURIDAD_HABILITADA=true
CORS_ORIGIN=http://localhost:5173
MS_NOTIFICATIONS=http://localhost:5000
EMAIL_SERVICE_API_KEY=
NOTIFICACIONES_CORREOS_PRUEBA=correo1@gmail.com,correo2@gmail.com
```

- Los nombres `DB_*` y `MS_SECURITY` son los mismos de `ms-cinema` (ahí `MS_SECURITY` apuntaba a 8080; aquí es **8181**).
- `EMAIL_SERVICE_API_KEY` es el mismo valor que está en el `.env` de `ms-notifications` (y el que usa `ms_security`). Nunca se sube.

---

## 11. Plan de trabajo

**Calendario propuesto** (entrega el lunes 24/11; ajústenlo en el grupo):

| Día | Fase |
|---|---|
| Mié 19/11 | Fase 0a: repo, esqueleto, endpoints en `ms_security` y `ms-notifications`, base del front |
| Jue 20/11 | Fase 0b: entidades, migraciones y permisos. Empieza la Fase 1 |
| Vie 21 – Sáb 22/11 | Fase 1: cada uno sus HU (backend + pantallas) |
| Dom 23/11 | Fase 2: integración, recorrido completo, correos, colección de Postman |
| Lun 24/11 | Correcciones y **entrega** |

### Fase 0a: esqueleto. Nadie empieza sus HU hasta que esté en `main`.

**Repo (Adrián, B): se parte de `ms-cinema`**
- [x] Copiar la carpeta **local** de `ms-cinema` de Adrián (la de GitHub no tiene el `SecurityGuard` ni las guías 4 a 6), **sin** `.git`, `node_modules`, `dist` ni `.env`.
- [x] Borrar todo lo del cine: módulos `theaters`, `projectors`, `seats`, `movies`, `screenings`, `src/migrations/` (si no, se crearían las tablas del cine), `src/gateways/`, `clientSocket.py`, `AGENTS.md`, `app.controller*`, `app.service.ts` y `test/app.e2e-spec.ts`. Las guías se dejan en `docs/guias/` como referencia.
- [x] Renombrar a `ms-gestion-deportiva` (`package.json` y `package-lock.json`), base `gestion_deportiva_db` en `typeorm.config.ts` y `.env.example` (10.6), y dejar `app.module.ts` solo con `ConfigModule`, `TypeOrmModule` y el `SecurityGuard`.
- [x] Mover `ACUERDOS.md` y `HISTORIAS_USUARIO.md` a la raíz, comprobar que `npm run build` compila y arranca contra `gestion_deportiva_db`, y subirlo a GitHub (19/11, commit `08ac59c`).
- [ ] Agregar a Nicolás y Andrei como colaboradores. Desde ahí A completa el esqueleto.

**`ms-gestion-deportiva` (A)**
- [ ] Las dependencias ya vienen de `ms-cinema` (`@nestjs/config`, `@nestjs/typeorm`, `typeorm`, `mysql2`, `class-validator`, `class-transformer`, `axios`). Sobran `@nestjs/websockets`, `@nestjs/platform-socket.io` y `socket.io` (se pueden quitar o dejar para la entrega 3).
- [ ] `app.module.ts`: `ConfigModule.forRoot({ isGlobal: true })`, `TypeOrmModule.forRootAsync` (como `ms-cinema`, más `dateStrings` y `timezone` de 5.5) y `SecurityGuard` como `APP_GUARD`.
- [ ] `typeorm.config.ts`, scripts `migration:generate` y `migration:run`, `.env.example` (10.6) y `.gitignore` con `.env`.
- [ ] `main.ts`: `setGlobalPrefix('api')`, `ValidationPipe` (5.3), `HttpExceptionFilter`, CORS y puerto.
- [ ] `common/errores/`, `common/dto/` (5.6), `common/utils/`, `common/seguridad/` (guard de la guía 5 + `SEGURIDAD_HABILITADA`) y `common/notificacion/` (sección 8).
- [ ] Todas las carpetas de 4.1, cada una con su `*.module.ts` vacío e importado en `app.module.ts`.

**`ms_security` (Andrei, C — propuesto)**
- [ ] Endpoint `POST /api/internal/security/permissions-validation` (10.3), probado en Postman con un token real.
- [ ] Rol `ADMINISTRADOR DEPORTIVO` creado y asignado a los usuarios de prueba.

**`ms-notifications` (Nicolás, A — propuesto)**
- [ ] Endpoint `POST /api/notifications/send` (sección 8), probado con un correo real.

**Frontend (A)**
- [ ] `api/gestionClient.js`, `gestionApiUrl` en `config/env.js` y `VITE_GESTION_API_URL` en `.env.example`.
- [ ] `constants/permissions.js`: módulo "Gestión Deportiva" con los recursos reales (10.4) en lugar de los de ejemplo.
- [ ] Rutas, menú y carpetas de 4.2, con los componentes vacíos de la tabla de 4.2 (solo muestran "Pendiente").

### Fase 0b: entidades y migraciones (cada uno las suyas)
- [ ] Cada persona escribe **sus** entidades y enums (6.14) en un PR pequeño.
- [ ] Migraciones en el orden de 6.15: A → B (jugadores) → C → B (partidos).
- [ ] Verificar que `npm run migration:run` crea las 14 tablas sin errores y que `npm run start:dev` arranca.
- [ ] Cada persona registra en `ms_security` los permisos de sus endpoints y los asigna al rol (10.4).

### Fase 1: trabajo en paralelo

| Persona | Orden sugerido |
|---|---|
| A | GD-01 (Postman) → GD-02 → GD-03 → GC-01 → GC-02 |
| B | GD-04 → GD-05 → GD-06 (Postman) → GC-06 → GC-07 |
| C | GD-07 → GD-08 → GC-03 (Postman) → GC-04 (Postman) → GC-05 → GC-08 (al final, cuando ya haya partidos) |

**Para no esperar a nadie:** si necesitas datos de otra persona que aún no tiene su CRUD (ej.: C necesita partidos), insértalos a mano con SQL en **tu** base de datos local. No subas scripts de datos de prueba al repo sin acuerdo.

**Colección de Postman:** una sola colección compartida, con una carpeta por HU (y una de permisos, 10.4). Cada uno agrega las peticiones de sus HU, sobre todo las de "Solo Postman" (GD-01, GD-06, GC-03, GC-04), que son la única forma de mostrarlas. El token se saca con `POST http://localhost:8181/api/auth/login`.

### Fase 2: integración

Se levantan los cinco procesos:

| Servicio | Puerto | Cómo se arranca |
|---|---|---|
| MySQL | 3306 | BDs `proyecto_db` (seguridad) y `gestion_deportiva_db` |
| `ms_security` | 8181 | `.\mvnw.cmd spring-boot:run`, con `$env:SPRING_DATASOURCE_PASSWORD` y `$env:EMAIL_SERVICE_API_KEY` |
| `ms-notifications` | 5000 | `python app.py` (con su `.env` y `credentials/`) |
| `ms-gestion-deportiva` | 8182 | `npm run migration:run` y `npm run start:dev` |
| `frontend-app` | 5173 | `npm run dev`, con `VITE_USE_MOCKS=false` |

- [ ] Cada persona prueba sus endpoints con token real y con un usuario **sin** el rol (debe dar 403).
- [ ] Recorrido completo: deporte (Postman) → equipos → asociar deporte → jugadores → contratos → habilidades (Postman) → asignar habilidades → perfil → torneo → inscripciones → grupos (Postman) → partidos de grupo → resultados y anotaciones → tabla de posiciones → fase final → partidos de llaves → desarrollo del torneo.
- [ ] Revisar que lleguen los correos de partido creado, anotación y resumen.

---

## 12. Git

**Repositorios**

| Proyecto | Repo |
|---|---|
| `ms_security` | `Kippie01PW/ProyectoDesarrolloBackend` |
| `frontend-app` | `zdv01/frontend-app` |
| `ms-notifications` | `zdv01/ms-notifications` |
| `ms-gestion-deportiva` | [`AdrianSanpedroDev/ms-gestion-deportiva`](https://github.com/AdrianSanpedroDev/ms-gestion-deportiva) (creado por Adrián el 19/11) |

- Como en la entrega 1: `main` es lo que se entrega y **solo se cambia por Pull Request**. Cada persona trabaja en su rama `feature/<letra>-<tema>` (ej.: `feature/B-partidos`) y otra persona le da una mirada rápida al PR antes del merge.
- Antes de empezar cada día: `git pull origin main` en tu rama.
- PRs pequeños (una HU o menos).
- **Prohibido:** `git push --force` a `main`, `git reset` sobre ramas compartidas, borrar o "limpiar" archivos de otra persona, y subir `.env`, `credentials/` o contraseñas.
- Commits: `tipo(zona): descripción`, por ejemplo `feat(partido): validar equipos del grupo` o `fix(torneo): cierre de inscripciones`.

**Lo que salió mal en la entrega 1 (que no se repita):**
- El 03/11 `main` se reescribió con un commit de 127 archivos hecho desde una copia vieja, y se perdió o se duplicó trabajo de otros → siempre `pull` antes de subir, PRs pequeños, y nunca subir una carpeta "completa" encima de `main`.
- Registro y recuperación de contraseña quedaron implementados dos veces, por dos personas, con rutas distintas a las del front → cada HU tiene un solo dueño (sección 1) y las rutas son las de la sección 9.
- El `pom.xml` cambió de versión de Java sin avisar y la contraseña de MySQL quedó escrita en `application.properties` → dependencias y configuración solo con acuerdo; los secretos solo en `.env` o variables de entorno.

### Cómo cambiar este acuerdo
1. Quien necesite el cambio lo propone en el grupo, explicando qué y por qué.
2. Si los tres están de acuerdo, **una sola persona** edita este archivo en un PR que solo cambie `ACUERDOS.md`.
3. Se anota en la tabla de abajo y todos hacen `pull`.

| Fecha | Cambio | Quién |
|---|---|---|
| | Versión inicial (16 HU: Anexos 2 y 3) | |
| 18/11/2026 | Ajuste a lo que ya existe: NestJS + TypeORM con migraciones (guías del curso), herencia de `Fase` en una sola tabla, formato de error y `errorCase` de `ms_security`, `SecurityGuard` de la guía 5 + endpoint de validación en `ms_security`, correo por `ms-notifications`, estructura real del front, Git sin `develop`. **TypeORM confirmado (18/11)** | Adrián |
| 18/11/2026 | A = Nicolás, B = Adrián, C = Andrei · Adrián crea el repo · entrega el 24/11 · calendario propuesto | Adrián |
| 21/11/2026 | 5.5: las columnas DATETIME se tipan como `Date` y `aFechaHoraIso` acepta `Date \| string`. Nueva sección 13 con lo que el código de B ya usa (archivos de `common/` y enums con nombre, configuración de `app.module.ts` y `main.ts`, reglas sobre las entidades de B) | Adrián |

---

## 13. Lo que el código de B ya usa (para no romperlo)

B (Adrián) ya tiene escritos jugadores, contratos, habilidades, partidos y resultados contra este contrato (rama `feature/B-habilidades`). No compilan hasta que existan los archivos de A y C. Esta lista dice **exactamente** qué espera ese código. Si alguno de estos nombres no les sirve, avisen antes de cambiarlo.

### 13.1 Archivos y nombres que B importa

**De A:**

| Archivo | Exporta | Qué usa B |
|---|---|---|
| `common/errores/application.exception.ts` | `ApplicationException` | `new ApplicationException(ErrorCase.X, mensaje)` |
| `common/errores/error-case.enum.ts` | `ErrorCase` | `NOT_FOUND`, `ALREADY_EXISTS`, `INVALID_OPERATION`, `HAS_ASSOCIATIONS` |
| `common/dto/estado.dto.ts` | `EstadoDto` | `PATCH .../estado` |
| `common/dto/equipo-resumen.dto.ts` | `EquipoResumen` | `{ id, nombre, activo }` (5.6) |
| `common/dto/jugador-resumen.dto.ts` | `JugadorResumen` | 5.6 |
| `common/dto/torneo-resumen.dto.ts` | `TorneoResumen` | `{ id, nombre, estado }` (9.10) |
| `common/dto/fase-resumen.dto.ts` | `FaseResumen` | `{ id, nombre, tipo, orden }` (9.10) |
| `common/dto/escenario-resumen.dto.ts` | `EscenarioResumen` | `{ id, nombre }` (9.10) |
| `common/notificacion/correo.service.ts` | `CorreoService` | `enviar(destinatarios, asunto, html): void` (8) |
| `common/notificacion/destinatarios.service.ts` | `DestinatariosService` | `aficionadosDeEquipos(localId, visitanteId)` y `aficionadosDelPartido(partidoId)` (8) |
| `equipo/entities/equipo.entity.ts` | `Equipo` | `id`, `nombre`, `activo` |
| `torneo/entities/torneo.entity.ts` | `Torneo` | `id`, `nombre`, `estado`, `fechaInicio`, `fechaFin` (DATE, `string`) |
| `torneo/entities/estado-torneo.enum.ts` | `EstadoTorneo` | `INSCRIPCIONES_CERRADAS`, `EN_CURSO`, `FINALIZADO` |
| `torneo/entities/inscripcion.entity.ts` | `Inscripcion` | relaciones `torneo` y `equipo` |
| `escenario/entities/escenario.entity.ts` | `Escenario` | `id`, `nombre` |

**De C:**

| Archivo | Exporta | Qué usa B |
|---|---|---|
| `fase/entities/fase.entity.ts` | `Fase` (abstracta), `Grupo`, `FaseFinal` | `id`, `nombre`, `orden`, relación `torneo`. `instanceof Grupo` y `FaseFinal`. En `FaseFinal`: `cantidadEquipos`, `tercerPuesto` |
| `fase/entities/tipo-fase.enum.ts` | `TipoFase` | `GRUPO`, `FINAL` |
| `fase/entities/ronda-final.enum.ts` | `RondaFinal` | `DIECISEISAVOS`, `OCTAVOS`, `CUARTOS`, `SEMIFINAL`, `TERCER_PUESTO`, `FINAL` |
| `fase/entities/grupo-equipo.entity.ts` | `GrupoEquipo` | relaciones `grupo` y `equipo` |
| `habilidad-jugador/entities/habilidad-jugador.entity.ts` | `HabilidadJugador` | relaciones `jugador` y `habilidad` |

Las rutas de entidades son las de 6.14. Las de `common/` y los enums completan 4.1 y 6.14, que nombraban las clases pero no los archivos.

### 13.2 Lo que A debe configurar para que lo de B funcione

- **`app.module.ts`:**
  - importar `JugadorModule`, `HabilidadModule` y `PartidoModule`;
  - TypeORM con `dateStrings: true` y `timezone: '-05:00'` (5.5);
  - `autoLoadEntities` o las entidades registradas.
- **`main.ts`:**
  - `setGlobalPrefix('api')`;
  - `ValidationPipe` global con `whitelist`, `forbidNonWhitelisted` y `transform`;
  - un `exceptionFactory` que devuelva **el primer mensaje de cada campo** (5.2). Ojo: `class-validator` reporta primero el decorador **más cercano a la propiedad**.
- **`NotificacionModule`:** `@Global()` y que exporte `CorreoService` y `DestinatariosService`. B no los registra en sus módulos. `enviar` nunca lanza: si falla, solo registra el error con `Logger`.
- **`common/utils`:** `hoyBogota()` y `aFechaHoraIso(Date | string)` (5.5). Mientras no existan, B usa copias temporales en `src/jugador/utils/fechas.ts`, con un TODO para reemplazarlas.
- **El filtro de errores:** traduce `ApplicationException` al formato de 5.1.

### 13.3 Lo que A y C no deben hacer con las entidades de B

Las entidades de B son `Jugador`, `EquipoJugador`, `Habilidad`, `Partido` y `Anotacion` (6.14).

- Solo **leer** con las consultas de la sección 7: nada de `save`, `update` ni `delete`.
- No agregar `@OneToMany` en ellas (6.14).
- Los nombres de sus propiedades son contrato. `Partido` tiene `fase`, `equipoLocal`, `equipoVisitante`, `escenario`, `fechaHora`, `ronda`, `numeroLlave`, `estado`, `marcadorLocal` y `marcadorVisitante`.
- `Partido.fechaHora` es un `Date` (ver 5.5).
- Los `Resumen` de jugador y equipo ya los arma B con `JugadorMapper.aResumen()` y `EquipoResumenMapper.aResumen()` (en `src/jugador/mappers/`). Se pueden importar desde ahí en lugar de repetirlos.

### 13.4 Migraciones

El orden es el de 6.15. `BJugadoresHabilidades` se genera **después** de que `AInicial` esté en `main`, y `BPartidosAnotaciones` después de `CFasesHabilidadJugador`.
