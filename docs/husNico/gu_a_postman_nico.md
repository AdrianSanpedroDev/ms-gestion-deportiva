# Guía de Pruebas Postman - Historias de Nico

Este documento define la estructura de las peticiones para importar o replicar en Postman. Asegúrate de configurar una variable de entorno `{{baseUrl}}` (ej. `http://localhost:3000/api`) y `{{token}}` (obtenido del microservicio de seguridad).

## Autorización
Todas las peticiones asumen un header:
`Authorization: Bearer {{token}}`

---

## 1. Deportes (HU-GD-01) - *Testing Exclusivo Backend*

### 1.1 Crear Deporte
- **Método:** `POST`
- **URL:** `{{baseUrl}}/deportes`
- **Body (JSON):**
  ```json
  {
    "nombre": "Fútbol Sala",
    "descripcion": "Fútbol jugado en cancha de suelo duro con 5 jugadores."
  }
  ```

### 1.2 Obtener Todos los Deportes
- **Método:** `GET`
- **URL:** `{{baseUrl}}/deportes`

### 1.3 Obtener Deporte por ID
- **Método:** `GET`
- **URL:** `{{baseUrl}}/deportes/1`

### 1.4 Actualizar Deporte
- **Método:** `PATCH`
- **URL:** `{{baseUrl}}/deportes/1`
- **Body (JSON):**
  ```json
  {
    "descripcion": "Fútbol jugado en cancha de suelo duro."
  }
  ```

### 1.5 Eliminar (Desactivar) Deporte
- **Método:** `DELETE`
- **URL:** `{{baseUrl}}/deportes/1`

---

## 2. Equipos (HU-GD-02)

### 2.1 Crear Equipo
- **Método:** `POST`
- **URL:** `{{baseUrl}}/equipos`
- **Body (JSON):**
  ```json
  {
    "nombre": "Los Galácticos",
    "fecha_fundacion": "2023-01-15"
  }
  ```

*(Los demás endpoints GET, PATCH, DELETE siguen el mismo patrón que Deportes).*

---

## 3. Asociar Equipo y Deporte (HU-GD-03)

### 3.1 Asociar Deporte a un Equipo
- **Método:** `POST`
- **URL:** `{{baseUrl}}/equipos/1/deportes/1`
- **Descripción:** Asocia el equipo con ID 1 al deporte con ID 1. No lleva body, la relación se infiere por la URL.

### 3.2 Listar Deportes de un Equipo
- **Método:** `GET`
- **URL:** `{{baseUrl}}/equipos/1/deportes`

### 3.3 Retirar Asociación
- **Método:** `DELETE`
- **URL:** `{{baseUrl}}/equipos/1/deportes/1`

---

## 4. Torneos (HU-GC-01)

### 4.1 Crear Torneo
- **Método:** `POST`
- **URL:** `{{baseUrl}}/torneos`
- **Body (JSON):**
  ```json
  {
    "nombre": "Copa de Verano 2024",
    "fecha_inicio": "2024-06-01",
    "fecha_fin": "2024-07-15",
    "deporte_id": 1 
  }
  ```
  *Nota:* Se valida que el `deporte_id` exista previamente.

### 4.2 Eliminar Torneo (Validación de Dependencias)
- **Método:** `DELETE`
- **URL:** `{{baseUrl}}/torneos/1`
- **Comportamiento Esperado:** Si el torneo ya tiene fases o equipos inscritos, el backend debe retornar un `400 Bad Request` indicando que no se puede eliminar.