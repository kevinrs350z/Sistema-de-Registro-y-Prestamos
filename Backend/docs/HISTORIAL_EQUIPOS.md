# Historial de equipos (auditoría)

Este módulo registra las acciones administrativas sobre equipos, especialmente la acción **Dar de baja**.

## ¿Qué se registra?
- `equipo_id`: ID del equipo afectado.
- `admin_id`: ID del administrador que ejecutó la acción.
- `accion`: Tipo de acción (por ahora: `BAJA`).
- `detalle`: JSON con información adicional (estado anterior y estado nuevo).
- `created_at`: Fecha y hora de la acción.

## Endpoint
**GET** `/api/equipos/{idEquipo}/historial`

### Requisitos
- Autenticación con Sanctum.
- Rol **ADMIN**.

### Respuesta (200)
```json
[
  {
    "id": 1,
    "equipo_id": 10,
    "accion": "BAJA",
    "detalle": {
      "estado_anterior": "DISPONIBLE",
      "estado_nuevo": "BAJA"
    },
    "admin_id": 3,
    "admin_email": "admin@correo.com",
    "created_at": "2026-02-02T15:22:10.000000Z"
  }
]
```

## Lógica de baja
La acción de **Dar de baja**:
- Cambia el estado del equipo a `BAJA`.
- No elimina el registro (auditoría).
- Evita mostrar el equipo en catálogo (filtros ya excluyen `BAJA`).

## Tabla
`equipo_historials`

Campos:
- `id`
- `equipo_id`
- `admin_id`
- `accion`
- `detalle` (JSON)
- `created_at`, `updated_at`
