# ms-gestion-deportiva

Microservicio de **Gestión Deportiva** (Anexo 2) y **Gestión de Competencias** (Anexo 3) de SportManager, entrega 2.
NestJS + TypeORM + MySQL, puerto **8182**.

> **Antes de escribir código, lee [`ACUERDOS.md`](./ACUERDOS.md)** (contrato del equipo: dueños, rutas, tablas, errores, seguridad)
> y [`HISTORIAS_USUARIO.md`](./HISTORIAS_USUARIO.md). Las guías del curso en las que se basa están en [`docs/guias/`](./docs/guias/).

## Requisitos

- Node.js y npm
- MySQL con la base creada: `CREATE DATABASE gestion_deportiva_db;`
- `ms_security` corriendo en el puerto 8181 (valida token y permisos de cada petición)
- `ms-notifications` corriendo en el puerto 5000 (solo para los correos de partidos y anotaciones)

## Puesta en marcha

```bash
npm install
cp .env.example .env        # en PowerShell: Copy-Item .env.example .env  → y llena DB_PASSWORD
npm run start:dev
```

Sin token, cualquier ruta **que exista** responde `401`: así funciona el `SecurityGuard` (guía 5).
Una ruta que no existe responde `404`, porque Nest solo ejecuta los guards cuando encuentra un controlador para la ruta.
