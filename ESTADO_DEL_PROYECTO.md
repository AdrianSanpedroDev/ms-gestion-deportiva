# Estado del proyecto: Entrega 2 (`ms-gestion-deportiva`)

> Tablero de avance **del equipo**. El contrato (rutas, tablas, reglas, dueños) está en [`ACUERDOS.md`](./ACUERDOS.md); aquí solo se marca **qué está hecho y qué bloquea a quién**.
> **Entrega y sustentación individual: lunes 24/11/2026.** · A = Nicolás · B = Adrián · C = Andrei

**Última actualización:** 20/11/2026 · por Adrián

**Leyenda:** ✅ hecho y en `main` · 🔀 en PR · 🟡 en curso (rama o local) · ⬜ pendiente · ⛔ bloqueado (ver dependencia)

### Cómo usar este archivo
1. Cada persona actualiza **solo sus filas** (sus HU, sus tareas de Fase 0 y sus bloqueos).
2. Al terminar algo, agrega **una línea en la Bitácora** (fecha · quién · qué · PR o commit).
3. Antes de editar: `git pull`. Los cambios a este archivo van en un commit `docs(estado): ...` aparte, no mezclados con código.
4. Si algo te bloquea, anótalo en la sección 5 para que el dueño lo vea.

---

## 1. Resumen rápido

| Fase | Plan (ACUERDOS 11) | Estado real |
|---|---|---|
| 0a: esqueleto | Mié 19/11 | 🟡 Solo la parte de B (repo) está hecha. Nada de A ni C en `main` todavía |
| 0b: entidades y migraciones | Jue 20/11 | ⬜ Sin empezar en `main` (B tiene la entidad `Jugador` en su rama) |
| 1: HU en paralelo | Vie 21 – Sáb 22/11 | 🟡 B empezó (GD-04 en rama) |
| 2: integración | Dom 23/11 | ⬜ |
| Entrega + sustentación | Lun 24/11 | ⬜ |

**⚠️ Riesgo actual:** vamos un día atrasados. `main` solo tiene el esqueleto de `ms-cinema` (2 commits). Lo que más bloquea a todos: `common/` de A (errores, DTOs compartidos, utilidades, notificación), los `*.module.ts` en `app.module.ts` y la migración `AInicial`.

---

## 2. Fase 0a: esqueleto

### Repo `ms-gestion-deportiva` (B · Adrián)
- ✅ Copiar `ms-cinema` local sin `.git`, `node_modules`, `dist`, `.env`
- ✅ Borrar módulos y migraciones del cine
- ✅ Renombrar a `ms-gestion-deportiva`, BD `gestion_deportiva_db`
- ✅ `ACUERDOS.md` e `HISTORIAS_USUARIO.md` en la raíz, compila y subido (commit `08ac59c`, 19/11)
- ⬜ Agregar a Nicolás y Andrei como colaboradores en GitHub *(confirmar en Settings → Collaborators)*

### `ms-gestion-deportiva` (A · Nicolás)
- ⬜ Dependencias (quitar o dejar websockets)
- ⬜ `app.module.ts`: `dateStrings: true`, `timezone: '-05:00'`, `SecurityGuard` como `APP_GUARD` *(hoy tiene ConfigModule + TypeORM + guard; faltan `dateStrings`/`timezone`)*
- ⬜ `typeorm.config.ts` + scripts `migration:generate` / `migration:run` *(no están en `package.json`)*
- ⬜ `main.ts`: prefijo `/api`, `ValidationPipe` con `exceptionFactory`, `HttpExceptionFilter`, CORS, puerto 8182 *(hoy: sin prefijo, sin filtro, sin CORS, puerto 3000)*
- ⬜ `common/errores/` (`ErrorCase`, `ApplicationException`, `HttpExceptionFilter`)
- ⬜ `common/dto/` (`*Resumen`, `EstadoDto`)
- ⬜ `common/utils/` (`aFechaHoraIso`, `hoyBogota`, etc.)
- ⬜ `common/seguridad/` *(hoy el guard está en `common/guards/` y el decorador en `common/decorators/`; falta `SEGURIDAD_HABILITADA`)*
- ⬜ `common/notificacion/` (`CorreoService`, `DestinatariosService`)
- ⬜ Importar los módulos de cada uno en `app.module.ts`

### `ms_security` (C · Andrei)
- ⬜ `POST /api/internal/security/permissions-validation` *(no existe aún en `ProyectoDesarrolloBackend`)*
- ⬜ Rol `ADMINISTRADOR DEPORTIVO` creado y asignado

### `ms-notifications` (A · Nicolás)
- ⬜ `POST /api/notifications/send` *(último commit del repo: 02/11)*

### Frontend (A · Nicolás)
- ⬜ `api/gestionClient.js`, `gestionApiUrl`, `VITE_GESTION_API_URL`
- ⬜ `constants/permissions.js` con recursos reales
- ⬜ Rutas, menú y componentes vacíos ("Pendiente") de ACUERDOS 4.2

---

## 3. Fase 0b: entidades y migraciones

| # | Migración | Dueño | Tablas | Estado |
|---|---|---|---|---|
| 1 | `AInicial` | A | `deporte`, `equipo`, `equipo_deporte`, `escenario`, `torneo`, `inscripcion` | ⬜ |
| 2 | `BJugadoresHabilidades` | B | `jugador`, `equipo_jugador`, `habilidad` | ⛔ espera #1 |
| 3 | `CFasesHabilidadJugador` | C | `fase`, `grupo_equipo`, `habilidad_jugador` | ⛔ espera #2 |
| 4 | `BPartidosAnotaciones` | B | `partido`, `anotacion` | ⛔ espera #3 |

- ⬜ Las 14 tablas se crean con `npm run migration:run`
- ⬜ Permisos de cada persona registrados en `ms_security` y asignados al rol

---

## 4. Avance por HU

Columnas: **Ent** = entidad/migración · **API** = endpoints backend · **Front** = pantallas · **Perm** = permisos en `ms_security` · **PM** = peticiones en la colección de Postman · **Rama/PR**

| HU | Nombre | Dueño | Ent | API | Front | Perm | PM | Rama/PR |
|---|---|---|---|---|---|---|---|---|
| GD-01 | Deportes | A | ⬜ | ⬜ | — | ⬜ | ⬜ | |
| GD-02 | Equipos | A | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| GD-03 | Equipo ↔ Deporte | A | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| GD-04 | Jugadores | B | 🟡 entidad lista, falta migración | ✅ en `main` + correcciones y chequeos de `eliminar` en `feature/B-habilidades` · ⚠️ no compila hasta que A suba `common/` | ⬜ | ⬜ | ⬜ | PR #1 ✅ |
| GD-05 | Equipo ↔ Jugador | B | 🟡 entidad lista (importa `Equipo` de A), falta migración | ✅ 4 endpoints + pruebas + revisión · no compila sin `common/` y `Equipo` | ⬜ | ⬜ | ⬜ | `feature/B-habilidades` (sin PR) |
| GD-06 | Habilidades | B | 🟡 entidad lista, falta migración | ✅ 5 endpoints + pruebas + revisión (incluye 409 por `HabilidadJugador`) · no compila sin `common/` y `HabilidadJugador` (C) | — | ⬜ | ⬜ | `feature/B-habilidades` (sin PR) |
| GD-07 | Habilidad ↔ Jugador | C | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| GD-08 | Perfil deportivo | C | — | ⬜ | ⬜ | ⬜ | ⬜ | |
| GC-01 | Torneos | A | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| GC-02 | Inscripciones | A | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| GC-03 | Fases | C | ⬜ | ⬜ | — | ⬜ | ⬜ | |
| GC-04 | Grupos | C | ⬜ | ⬜ | — | ⬜ | ⬜ | |
| GC-05 | Fase final | C | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| GC-06 | Partidos | B | 🟡 `Partido` y `Anotacion` escritas contra el contrato, falta migración `BPartidosAnotaciones` | ✅ 7 endpoints + reglas + correo + pruebas + revisión · no compila sin A (`common/`, `Equipo`, `Torneo`, `Inscripcion`, `Escenario`) y C (`Fase`, `GrupoEquipo`, `RondaFinal`, `TipoFase`) | ⬜ | ⬜ | ⬜ | `feature/B-habilidades` (sin PR) |
| GC-07 | Resultados y anotaciones | B | 🟡 `Anotacion` lista, falta migración | ✅ 5 endpoints + correos de anotación y resumen + pruebas + revisión · mismas dependencias que GC-06 | ⬜ | ⬜ | ⬜ | `feature/B-habilidades` (sin PR) |
| GC-08 | Desarrollo del torneo | C | — | ⬜ | ⬜ | ⬜ | ⬜ | |

---

## 5. Bloqueos entre personas

Qué necesita cada uno de otro. El dueño marca ✅ cuando lo sube a `main`.

| Quién lo necesita | Qué | De | Para | Estado |
|---|---|---|---|---|
| Todos | `ApplicationException`, `ErrorCase`, `HttpExceptionFilter` (archivos `common/errores/application.exception.ts` y `error-case.enum.ts`) | A | Que compile cualquier service · **hoy `main` no compila sin esto** | ⬜ |
| Todos | `EstadoDto` en `common/dto/estado.dto.ts` | A | `PATCH .../estado` · **`main` no compila sin esto** | ⬜ |
| Todos | `EstadoDto` y `*Resumen` en `common/dto` | A | DTOs de respuesta y `PATCH .../estado` | ⬜ |
| Todos | `aFechaHoraIso()`, `hoyBogota()` en `common/utils` | A | Mappers y reglas con "hoy" | ⬜ |
| Todos | `dateStrings: true` + `timezone` en `app.module.ts` | A | Fechas como texto (ACUERDOS 5.5) | ⬜ |
| Todos | Importar cada `*.module.ts` en `app.module.ts` | A | Que las rutas existan | ⬜ |
| B | Entidad `Equipo` + migración `AInicial` | A | `EquipoJugador` (GD-05), `Partido` | ⬜ |
| B | Entidades `Torneo`, `Inscripcion`, `Escenario` | A | Validar partidos (GC-06) | ⬜ |
| B | `CorreoService` + `DestinatariosService` + `/api/notifications/send` | A | Correos de GC-06 y GC-07 | ⬜ |
| B, C | Base del front (`gestionClient`, rutas, componentes vacíos) | A | Pantallas | ⬜ |
| B | `Fase`/`Grupo`/`FaseFinal`, `GrupoEquipo` + migración C | C | `Partido` (GC-06) | ⬜ |
| B | Entidad `HabilidadJugador` | C | Eliminar jugador / habilidad | ⬜ |
| B | Confirmar archivos: A → `common/notificacion/correo.service.ts` y `destinatarios.service.ts`, `common/errores/*`, `common/dto/*-resumen.dto.ts` · C → `fase/entities/ronda-final.enum.ts` y `tipo-fase.enum.ts` (B los importa con esos nombres) | A, C | GC-06, GC-07 | ⬜ |
| Todos | ⚠️ En TypeORM 1.1.2 las columnas **DATETIME llegan como `Date`**, aunque `dateStrings` esté activo (`MysqlDriver.js:533-535`). Contradice ACUERDOS 5.5: `aFechaHoraIso()` debe aceptar `Date \| string` | A | Mappers de todos (si no, da 500) | ⬜ |
| C | Entidades `Jugador`, `Habilidad` | B | GD-07, GD-08 | 🟡 `Jugador` en `main` · `Habilidad` en `feature/B-habilidades` |
| C | `Partido`, `Anotacion` | B | GC-05, GC-08 | 🟡 escritas en `feature/B-habilidades` (rutas de 6.14) |
| Todos | Endpoint `permissions-validation` en `ms_security` | C | Probar con seguridad activada | ⬜ |

**Acuerdo pendiente de confirmar:** B crea sus propios `jugador.module.ts`, `habilidad.module.ts` y `partido.module.ts`; A solo los importa en `app.module.ts` (para no chocar en el merge).

---

## 6. Fase 2: integración

- ⬜ Los 5 procesos levantan juntos (MySQL, `ms_security`, `ms-notifications`, `ms-gestion-deportiva`, front)
- ⬜ Cada persona prueba con token real y con usuario **sin** el rol (403)
- ⬜ Recorrido completo (ACUERDOS 11, Fase 2)
- ⬜ Llegan los 3 correos (partido creado, anotación, resumen)
- ⬜ Colección de Postman completa (carpeta por HU + carpeta de permisos)

---

## 7. Bitácora

Lo más reciente arriba. Una línea por avance: fecha · quién · qué (con PR o commit si hay).

| Fecha | Quién | Avance |
|---|---|---|
| 21/11 | Adrián | `feature/B-habilidades` (sin PR): **backend de GC-06 y GC-07 completo** (partidos, resultado, anotaciones, 3 correos), y chequeos de `eliminar` en jugador y habilidad. **753 pruebas OK.** Compila cuando A y C suban sus entidades y `common/` (ver bloqueos). ⚠️ El manifiesto de `docs/husNico` contradice ACUERDOS (carpetas `modules/`, `NotFoundException`, `{statusCode, data}`, `Equipo.estado`): seguir ACUERDOS 4.1, 5.1, 6.2 y 6.14 |
| 20/11 noche | Adrián | En `feature/B-habilidades` (sin PR):<br>• GD-06 habilidades completa;<br>• GD-05 contratos completa;<br>• GC-06: enum de transiciones, entidad y DTOs.<br>Son 396 pruebas OK. Solo compila con `common/` y `Equipo` de A, y `Fase`, `RondaFinal` y `Escenario` de C.<br>⚠️ Las columnas DATETIME llegan como `Date` (ver bloqueos). |
| 20/11 noche | Adrián | PR #1 (GD-04 jugadores) y PR #2 (este tablero) mergeados a `main`. ⚠️ **`main` no compila** hasta que A suba `common/errores/application.exception.ts`, `common/errores/error-case.enum.ts` y `common/dto/estado.dto.ts` (son los imports que usa `src/jugador`). Mientras tanto, para que compile local: esperar a `common/` o ignorar `src/jugador` |
| 20/11 noche | Adrián | GD-04 backend completo en `feature/B-jugadores` (sin PR): entidad, DTOs, mapper, service, controller, module, 51 pruebas OK. No compila en `main` hasta que A suba `common/errores` y `common/dto`. Pruebas con `npm test -- src/<modulo>` (no `npx jest`: Nest 12 es ESM) |
| 20/11 | Adrián | Se crea este archivo. En `main` solo está el esqueleto (`08ac59c`, `84db547`); sin ramas ni PRs de A o C. `ms_security` sin endpoint de validación, `ms-notifications` sin `/api/notifications/send`, front sin cambios de la entrega 2 |
| 19/11 | Adrián | Repo creado a partir de `ms-cinema` y subido a GitHub (`08ac59c`), link en `ACUERDOS.md` sección 12 (`84db547`) |
