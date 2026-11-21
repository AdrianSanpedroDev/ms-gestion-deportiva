# Manifiesto de Desarrollo - Módulo Gestión Deportiva (Nico)

## 1. Responsabilidades Asignadas
- **Fase 0:** Esqueleto NestJS, base del frontend, configuración de escenarios mínimos.
- **Integraciones:** Módulo de Seguridad (Autenticación/Autorización) y Módulo de Notificaciones (`ms-notifications`).
- **Historias de Usuario:**
  - **HU-GD-01:** Gestionar deportes (Backend - *Entidad Roja*).
  - **HU-GD-02:** Gestionar equipos (Backend & Frontend - *Entidad Verde*).
  - **HU-GD-03:** Asociar equipos con deportes (Relación N:M).
  - **HU-GC-01:** Gestionar torneos (Backend & Frontend - *Entidad Verde*).
  - **HU-GC-02/08:** Gestionar inscripciones/fases básicas (Backend & Frontend - *Entidad Verde*).

## 2. Arquitectura Base (Inspirada en `ms-cinema`)
Para mantener el código limpio y escalable (cumpliendo principios SOLID), cada módulo del dominio (Deportes, Equipos, Torneos) debe tener la siguiente estructura interna:

```text
src/
└── modules/
    └── nombre_modulo/
        ├── controllers/       # Controladores (Ruteo HTTP, Swagger)
        ├── services/          # Lógica de negocio (Casos de uso)
        ├── repositories/      # Capa de acceso a datos (Patrón Repositorio)
        ├── entities/          # Entidades TypeORM / Mongoose
        ├── dtos/              # Data Transfer Objects (Validaciones class-validator)
        └── mappers/           # Transformación entre Entidades y DTOs
```

### Principios SOLID a aplicar:
- **Single Responsibility (SRP):** Un controlador solo maneja peticiones HTTP. Un servicio solo maneja la lógica de la HU. Un repositorio interactúa con la BD.
- **Dependency Inversion (DIP):** Inyectar dependencias a través del constructor en los servicios y controladores. Usar interfaces para los repositorios si es posible.

## 3. Guía de Implementación por Historia de Usuario

### Fase 0: Configuración Inicial (NestJS)
1. **Bootstrap:** Crear el proyecto NestJS.
2. **Database:** Configurar la conexión a la base de datos central en `app.module.ts`.
3. **Seguridad:** Crear un `AuthGuard` global o por controlador que valide los tokens JWT emitidos por el repositorio de seguridad.
4. **Notificaciones:** Crear un servicio compartido `NotificationService` que haga peticiones HTTP (axios/fetch) o publique eventos (RabbitMQ) hacia `ms-notifications`.

### HU-GD-01: Gestionar Deportes (Backend Only)
- **Entidad (`Deporte`):** `id`, `nombre`, `descripcion`, `estado` (activo/inactivo).
- **Validaciones:** El nombre debe ser único. Evitar borrado físico si tiene torneos asociados; usar borrado lógico (`estado = inactivo`).
- **Frontend:** No requiere vistas. Se probará 100% con Postman.

### HU-GD-02: Gestionar Equipos (Fullstack)
- **Entidad (`Equipo`):** `id`, `nombre`, `fecha_fundacion`, `estado`.
- **Validaciones:** Nombre obligatorio y único.
- **Frontend:** Crear el componente CRUD en React para Equipos.

### HU-GD-03: Asociar Equipos con Deportes (Relación N:M)
- **Implementación TypeORM:** Crear una entidad intermedia explícita `EquipoDeporte` o usar el decorador `@ManyToMany` con `@JoinTable()`. Se recomienda entidad intermedia si van a guardar datos adicionales de la asociación (ej. fecha de asociación).
- **Controlador:** Crear endpoints en `EquipoController` o `DeporteController` (ej. `POST /equipos/:id/deportes/:idDeporte`).
- **Lógica:** Validar que ambos existan antes de asociar. Evitar duplicados.

### HU-GC-01: Gestionar Torneos (Fullstack)
- **Entidad (`Torneo`):** `id`, `nombre`, `fecha_inicio`, `fecha_fin`, `deporte_id`.
- **Relación:** 1:N (Un Deporte tiene muchos Torneos). Un torneo pertenece a UN deporte.
- **Frontend:** CRUD de torneos asociándolos a un deporte existente en un select/dropdown.

## 4. Estándares de Código
- Usar `class-validator` y `class-transformer` en los DTOs.
- Estandarizar respuestas: Todo controlador debe retornar un objeto con formato `{ statusCode, message, data }`.
- Usar `try-catch` y lanzar excepciones de NestJS (`NotFoundException`, `BadRequestException`).