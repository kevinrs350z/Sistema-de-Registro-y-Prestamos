# Sistema de Auditoría y Registro de Fallas para Equipos

## Resumen de Implementación

Se ha implementado un sistema completo de auditoría (audit trail) y registro de fallas para el inventario de equipos audiovisuales y computación.

---

## Archivos Creados/Modificados

### 1. Enum Actualizado
- **[EstadoEquipo.php](../app/Enums/EstadoEquipo.php)**
  - Nuevos estados: `RESERVADO`, `MANTENIMIENTO`, `BAJA_TEMPORAL`, `DADO_DE_BAJA`
  - Métodos helper: `all()`, `isValid()`, `fueraDeServicio()`, `operativos()`
  - ⚠️ Los estados `DISPONIBLE` y `PRESTADO` NO fueron modificados

### 2. Migraciones
- **[2026_02_09_100000_create_tipos_falla_table.php](../database/migrations/2026_02_09_100000_create_tipos_falla_table.php)**
  - Catálogo de tipos de falla con categorías
  
- **[2026_02_09_100001_create_equipo_estado_eventos_table.php](../database/migrations/2026_02_09_100001_create_equipo_estado_eventos_table.php)**
  - Tabla de auditoría con índices optimizados

### 3. Seeders
- **[TiposFallaSeeder.php](../database/seeders/TiposFallaSeeder.php)**
  - 30+ tipos de falla organizados por categoría

### 4. Modelos Eloquent
- **[TipoFalla.php](../app/Models/TipoFalla.php)**
- **[EquipoEstadoEvento.php](../app/Models/EquipoEstadoEvento.php)**
- **[Equipo.php](../app/Models/Equipo.php)** (relaciones agregadas)

### 5. Servicios
- **[EquipoEstadoService.php](../app/Services/EquipoEstadoService.php)** - Lógica de cambio de estado con transacción
- **[EquipoEstadisticasService.php](../app/Services/EquipoEstadisticasService.php)** - Queries para dashboard

### 6. Controladores
- **[EquipoEstadoController.php](../app/Http/Controllers/EquipoEstadoController.php)**
- **[EquipoEstadisticasController.php](../app/Http/Controllers/EquipoEstadisticasController.php)**

### 7. Form Request
- **[CambiarEstadoEquipoRequest.php](../app/Http/Requests/Equipo/CambiarEstadoEquipoRequest.php)**

---

## Endpoints de la API

### Gestión de Estados (requieren auth:sanctum + admin)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| PATCH | `/api/equipos/{id}/estado` | Cambiar estado de un equipo |
| GET | `/api/equipos/{id}/historial-estados` | Historial de estados (paginado) |
| GET | `/api/tipos-falla` | Catálogo de tipos de falla |
| GET | `/api/tipos-falla/categorias` | Categorías disponibles |

### Estadísticas (requieren auth:sanctum + admin)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/estadisticas/dashboard` | Dashboard completo |
| GET | `/api/estadisticas/mantenimientos` | Mantenimientos por tipo y falla |
| GET | `/api/estadisticas/top-modelos-fallas` | Top modelos con más fallas |
| GET | `/api/estadisticas/downtime` | Tiempo fuera de servicio |
| GET | `/api/estadisticas/fallas-frecuentes` | Fallas más frecuentes |
| GET | `/api/estadisticas/evolucion-mantenimientos` | Evolución mensual |
| GET | `/api/estadisticas/equipos-mantenimiento` | Equipos actualmente en mantenimiento |
| GET | `/api/estadisticas/resumen-estados` | Resumen de estados del inventario |

---

## Ejemplos de Uso

### Enviar equipo a mantenimiento
```http
PATCH /api/equipos/123/estado
Content-Type: application/json
Authorization: Bearer {token}

{
  "estado": "MANTENIMIENTO",
  "motivo": "No enciende / falla de carga",
  "tipoFallaId": 4,
  "observacion": "Se detecta falso contacto en puerto de carga",
  "origen": "admin"
}
```

### Dar de baja un equipo
```http
PATCH /api/equipos/123/estado
Content-Type: application/json
Authorization: Bearer {token}

{
  "estado": "DADO_DE_BAJA",
  "motivo": "Equipo obsoleto, vida útil agotada",
  "observacion": "Reemplazo programado para Q2 2026"
}
```

### Finalizar mantenimiento
```http
PATCH /api/equipos/123/estado
Content-Type: application/json
Authorization: Bearer {token}

{
  "estado": "DISPONIBLE",
  "motivo": "Reparación completada",
  "observacion": "Se reemplazó el puerto de carga",
  "origen": "mantenimiento"
}
```

### Obtener historial de estados
```http
GET /api/equipos/123/historial-estados?per_page=10
Authorization: Bearer {token}
```

### Obtener tipos de falla por categoría
```http
GET /api/tipos-falla?categoria=CAM
Authorization: Bearer {token}
```

### Dashboard de estadísticas
```http
GET /api/estadisticas/dashboard?desde=2026-01-01&hasta=2026-02-09
Authorization: Bearer {token}
```

---

## Categorías de Fallas

| Código | Descripción |
|--------|-------------|
| CAM | Cámaras y Video |
| AUD | Audio y Grabación |
| IT | Computación (Notebooks, Tablets) |
| MECH | Equipos Mecánicos (Trípodes) |
| PWR | Energía y Cables |
| USR | Uso Inadecuado |
| INV | Inventario/Administrativas |

---

## Validaciones Implementadas

1. **MANTENIMIENTO** → Requiere `tipoFallaId`
2. **DADO_DE_BAJA** → Requiere `motivo`
3. El tipo de falla debe existir y estar activo
4. El origen debe ser válido: `admin`, `sistema`, `prestamo`, `mantenimiento`
5. Transacción atómica: el cambio de estado y el registro de auditoría ocurren juntos

---

## Comandos para Ejecutar

```bash
# Ejecutar migraciones
php artisan migrate

# Ejecutar seeder de tipos de falla
php artisan db:seed --class=TiposFallaSeeder

# O ejecutar todos los seeders
php artisan db:seed
```

---

## Compatibilidad

✅ Los enums existentes `EstadoEquipo::DISPONIBLE` y `EstadoEquipo::PRESTADO` NO fueron modificados
✅ El flujo de préstamos existente sigue funcionando sin cambios
✅ `EstadoPrestamo` no fue tocado

---

## Estructura de la Tabla de Auditoría

```sql
CREATE TABLE equipo_estado_eventos (
    id BIGINT PRIMARY KEY,
    equipo_id BIGINT NOT NULL,       -- FK a equipos
    usuario_id BIGINT NOT NULL,       -- FK a users (quién hizo el cambio)
    estado_anterior VARCHAR(50),      -- NULL para primer registro
    estado_nuevo VARCHAR(50) NOT NULL,
    fecha_evento TIMESTAMP DEFAULT NOW(),
    motivo VARCHAR(500),
    observacion TEXT,
    tipo_falla_id BIGINT,             -- FK a tipos_falla (si aplica)
    origen VARCHAR(30) DEFAULT 'admin',
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    -- Índices
    INDEX idx_equipo_fecha (equipo_id, fecha_evento),
    INDEX idx_estado_nuevo (estado_nuevo),
    INDEX idx_usuario (usuario_id),
    INDEX idx_tipo_falla (tipo_falla_id),
    INDEX idx_origen (origen)
);
```
