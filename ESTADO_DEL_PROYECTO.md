# Estado del proyecto: Entrega 2 (`ms-gestion-deportiva`)

> Tablero de avance **del equipo**. El contrato (rutas, tablas, reglas, dueños) está en [`ACUERDOS.md`](./ACUERDOS.md); aquí solo se marca **qué está hecho y qué bloquea a quién**.
> **Entrega y sustentación individual: lunes 24/11/2026.** · A = Nicolás · B = Adrián · C = Andrei

**Última actualización:** 24/11/2026 · por Andrei (auditoría e integración final autorizada por A, B y C)

**Leyenda:** ✅ hecho · 🔀 en PR · 🟡 en curso (rama o local) · ⬜ pendiente · ⛔ bloqueado

---

## 1. Resumen rápido

| Fase | Plan (ACUERDOS 11) | Estado real |
|---|---|---|
| 0a: esqueleto | Mié 19/11 | ✅ Completo en los 4 repos (`ms-gestion-deportiva`, `ms_security`, `ms-notifications`, `frontend-app`) |
| 0b: entidades y migraciones | Jue 20/11 | ✅ 4 migraciones en orden (`AInicial`, `BJugadoresHabilidades`, `CFasesHabilidadJugador`, `BPartidosAnotaciones`) → 14 tablas + 79 permisos en `DatabaseSeeder` |
| 1: HU en paralelo | Vie 21 – Sáb 22/11 | ✅ Las 16 HU implementadas (backend + frontend donde aplica) |
| 2: integración | Dom 23/11 | ✅ Auditoría integral, correcciones cruzadas, 60 suites Jest (971 tests), JUnit `ms_security`, Pytest/Flask `ms-notifications`, ESLint/Vite build y colección Postman unificada listos |
| Entrega + sustentación | Lun 24/11 | ✅ Listo para commit/PR y demostración en vivo |

---

## 2. Fase 0a: esqueleto

### Repo `ms-gestion-deportiva` (A + B + C)
- ✅ Esqueleto NestJS + TypeORM, BD `gestion_deportiva_db`, `ACUERDOS.md` e `HISTORIAS_USUARIO.md`
- ✅ `app.module.ts`: `ConfigModule`, `TypeOrmModule` con `dateStrings: true` y `timezone: '-05:00'`, los 11 módulos importados y **`SecurityGuard` registrado globalmente como `APP_GUARD`**
- ✅ `typeorm.config.ts` con `dateStrings: true` y `timezone: '-05:00'` + scripts `migration:generate` / `migration:run`
- ✅ `main.ts`: prefijo `/api`, `ValidationPipe` con `exceptionFactory` (`400 { campo: mensaje }`), `HttpExceptionFilter` (400/401/403/404/409/500/503), CORS (`http://localhost:5173` por defecto), puerto `8182`
- ✅ `common/errores/` (`ErrorCase`, `ApplicationException`, `HttpExceptionFilter` + spec)
- ✅ `common/dto/` completo (`EstadoDto`, `DeporteResumen`, `EquipoResumen`, `JugadorResumen`, `HabilidadResumen`, `TorneoResumen`, `FaseResumen`, `EscenarioResumen`, `PartidoResumen`)
- ✅ `common/utils/` (`aFechaHoraIso`, `hoyBogota`)
- ✅ `common/seguridad/` (`SecurityGuard` con `SEGURIDAD_HABILITADA` + `@Public()` + spec)
- ✅ `common/notificacion/` (`CorreoService` con timeout 10s, `DestinatariosService` con deduplicación)
- ✅ `.env.example` con `SEGURIDAD_HABILITADA=true` y `MS_NOTIFICATIONS=http://127.0.0.1:5000`

### `ms_security` (`ProyectoDesarrolloBackend`)
- ✅ `POST /api/internal/security/permissions-validation` + `SecurityConfig` (`PATCH` incluido en CORS) + `GlobalExceptionHandler` (`400` en JSON inválido)
- ✅ Rol `ADMINISTRADOR DEPORTIVO` con los **79 permisos HTTP exactos** (28 A + 27 B + 24 C) sembrados en `DatabaseSeeder.java` y asignados a `admin@uc.edu.co`
- ✅ `application.properties` limpio con placeholders de entorno (sin secretos ni puerto fijo hardcodeado)

### `ms-notifications`
- ✅ `POST /api/notifications/send` con `X-Service-Key`, validaciones, cuota atómica multi-destinatario y `MAX_SUBJECT_LENGTH=255`
- ✅ `.env.example` restaurado con las 8 variables de configuración (incluyendo rate limits)

### Frontend (`frontend-app`)
- ✅ `api/gestionClient.js`, `env.js` (con normalización `/api` en `gestionApiUrl`), `constants/permissions.js`
- ✅ `authService.js` conserva roles de `/auth/me` ante `403` en `/user-roles/users/{id}` para `ADMINISTRADOR DEPORTIVO`
- ✅ `PermissionFormModal` (unicidad por `method + url`) y `RolePermissionsPage` (soporte multi-endpoint desplegable por recurso)
- ✅ Todas las pantallas e integraciones cruzadas de `ACUERDOS.md` §4.2 completas (incluyendo `<PartidosTorneo />` en `TournamentDetail`, filtro por deporte en `TeamsList`, soporte de equipos inactivos y layouts a ancho completo)

---

## 3. Fase 0b: entidades y migraciones

| # | Migración | Dueño | Tablas | Estado |
|---|---|---|---|---|
| 1 | `1795300000000-AInicial.ts` | A | `deporte`, `equipo`, `equipo_deporte`, `escenario`, `torneo`, `inscripcion` | ✅ |
| 2 | `1795400000000-BJugadoresHabilidades.ts` | B | `jugador`, `equipo_jugador`, `habilidad` | ✅ |
| 3 | `1795450000000-CFasesHabilidadJugador.ts` | C | `fase`, `grupo_equipo`, `habilidad_jugador` | ✅ |
| 4 | `1795500000000-BPartidosAnotaciones.ts` | B | `partido`, `anotacion` | ✅ |

- ✅ Las 14 tablas + `migrations` alineadas 100% con `ACUERDOS.md` §6 y §6.15
- ✅ Los 79 permisos registrados en `DatabaseSeeder.java` y asignados al rol `ADMINISTRADOR DEPORTIVO`

---

## 4. Avance por HU

| HU | Nombre | Dueño | Ent | API | Front | Perm | PM |
|---|---|---|---|---|---|---|---|
| GD-01 | Deportes | A | ✅ | ✅ 7 endpoints + spec (`IsNull()`, 2 niveles al editar, 409 detallado) | — *(Solo Postman)* | ✅ 7/7 en Seeder | ✅ |
| GD-02 | Equipos | A | ✅ | ✅ 6 endpoints + spec (validación español, 409 detallado) | ✅ `/equipos`, `/equipos/:id` | ✅ 6/6 en Seeder | ✅ |
| GD-03 | Equipo ↔ Deporte | A | ✅ | ✅ 4 endpoints + `AsociarDeporteDto` + `GET` en inactivos + spec | ✅ `TeamSports` + filtro por deporte en `TeamsList` | ✅ 4/4 en Seeder | ✅ |
| GD-04 | Jugadores | B | ✅ | ✅ 6 endpoints + pruebas | ✅ `/jugadores`, `/jugadores/:id` | ✅ 6/6 en Seeder | ✅ |
| GD-05 | Equipo ↔ Jugador | B | ✅ | ✅ 4 endpoints + pruebas | ✅ `PlantillaEquipo` + `HistorialEquiposJugador` | ✅ 4/4 en Seeder | ✅ |
| GD-06 | Habilidades | B | ✅ | ✅ 5 endpoints + pruebas | — *(Solo Postman)* | ✅ 5/5 en Seeder | ✅ |
| GD-07 | Habilidad ↔ Jugador | C | ✅ | ✅ 4 endpoints + pruebas | ✅ `HabilidadesJugador` | ✅ 4/4 en Seeder | ✅ |
| GD-08 | Perfil deportivo | C | — | ✅ 1 endpoint + pruebas | ✅ `/jugadores/:id/perfil` | ✅ 1/1 en Seeder | ✅ |
| GC-01 | Torneos | A | ✅ | ✅ 6 endpoints + validar `Fase` al eliminar + `maxEquipos >= inscritos` + spec | ✅ `/torneos`, `/torneos/:id` + `TournamentStatusModal` | ✅ 6/6 en Seeder | ✅ |
| GC-02 | Inscripciones | A | ✅ | ✅ 4 endpoints + transacción + validar `GrupoEquipo`/`Partido` al retirar + spec | ✅ `TournamentInscriptions` (filtrado por deporte + contador en vivo) | ✅ 4/4 en Seeder | ✅ |
| GC-03 | Fases | C | ✅ | ✅ 4 endpoints + pruebas | — *(Solo Postman)* | ✅ 4/4 en Seeder | ✅ |
| GC-04 | Grupos | C | ✅ | ✅ 9 endpoints + `?orden=` vacío + tabla de posiciones + pruebas | — *(Solo Postman)* | ✅ 9/9 en Seeder | ✅ |
| GC-05 | Fase final | C | ✅ | ✅ 5 endpoints + llaves + pruebas | ✅ `/torneos/:id/fase-final` | ✅ 5/5 en Seeder | ✅ |
| GC-06 | Partidos | B | ✅ | ✅ 7 endpoints + correo nuevo partido + pruebas | ✅ `/partidos`, `/partidos/:id`, `PartidosTorneo` en `/torneos/:id` | ✅ 7/7 en Seeder | ✅ |
| GC-07 | Resultados y anotaciones | B | ✅ | ✅ 5 endpoints + correos anotación/resumen + pruebas | ✅ `PartidoDetail` + `AnotacionesPartido` | ✅ 5/5 en Seeder | ✅ |
| GC-08 | Desarrollo del torneo | C | — | ✅ 1 endpoint + pruebas | ✅ `/torneos/:id/desarrollo` | ✅ 1/1 en Seeder | ✅ |

*(Más `GET /api/escenarios`: refactorizado a `EscenarioController → EscenarioService → EscenarioMapper` + spec + permiso en Seeder).*

---

## 5. Bloqueos entre personas

Sin bloqueos abiertos. Todas las dependencias de `common/`, entidades, migraciones, permisos, correos y pantallas cruzadas quedaron cerradas e integradas.

---

## 6. Fase 2: integración

- ✅ Compilación y pruebas unitarias/integración en los 4 repositorios (`ms_security`, `ms-notifications`, `ms-gestion-deportiva` y `frontend-app`)
- ✅ Colección de Postman unificada v2.1 (`postman/ms-gestion-deportiva-completa.postman_collection.json` + environment sin secretos)
- 🟡 Pendiente solo levantar los 5 procesos locales durante la demostración y ejecutar el recorrido manual/Postman en vivo

---

## 7. Bitácora

| Fecha | Quién | Avance |
|---|---|---|
| 24/11 | Andrei | **Cierre e integración total (autorizado por A, B y C):** (1) `ms_security`: sembrados los **79 permisos** en `DatabaseSeeder.java`, agregado handler `400` en `GlobalExceptionHandler`, `PATCH` en CORS, limpiado `application.properties` (placeholders sin secretos) y pruebas JUnit en verde; (2) `ms-notifications`: restaurado `.env.example`, rate limit atómico multi-destinatario, `MAX_SUBJECT_LENGTH=255`, 22/22 pruebas en verde; (3) `ms-gestion-deportiva`: registrado `SecurityGuard` como `APP_GUARD` en `common/seguridad/`, `.env.example` con `SEGURIDAD_HABILITADA=true`, corregido `HttpExceptionFilter`, completado `common/dto/`, corregidos bugs críticos de A (`IsNull()` en `soloPrincipales`, 3 niveles en `Deporte`, `AsociarDeporteDto`, `GET` de deportes en equipos inactivos, `EscenarioService`/`Mapper`, validación de `Fase` al eliminar torneo, validación de `GrupoEquipo`/`Partido` al retirar inscripción), corregido `?orden=` vacío en `FiltrosGrupoDto`, `CANCELADO` en `DesarrolloService`, consistencia de `AnotacionService`, agregadas 7 suites Jest nuevas (**60/60 suites, 971/971 tests OK**, `tsc`/`nest build`/`oxlint` 0 errores) y creada colección Postman unificada (`postman/ms-gestion-deportiva-completa.postman_collection.json`); (4) `frontend-app`: integrado `<PartidosTorneo />` en `TournamentDetail`, corregido `authService` para `ADMINISTRADOR DEPORTIVO`, soporte multi-endpoint en `RolePermissionsPage`/`PermissionFormModal`, filtro por deporte en `TeamsList`, `maxEquipos` en `TournamentFormModal`, soporte de inactivos y layouts completos (**ESLint 0 errores, Vite build OK**). |
| 24/11 | Adrián | **Front de B terminado** en `frontend-app` (`feature/B-front`, mergeado en PR #3): jugadores, plantilla de equipo (GD-05), partidos y resultado/anotaciones. |
| 24/11 | Adrián | **Correos reales OK:** implementado `POST /api/notifications/send` en `ms-notifications`. |
| 23/11 | Andrei | Deudas técnicas DT-C2, DT-C3, DT-C4 y DT-C5 saldadas (`ms_security` `permissions-validation`, migración C, 24 endpoints de C). |
| 19/11 | Adrián | Repo `ms-gestion-deportiva` creado a partir de `ms-cinema` y subido a GitHub. |
