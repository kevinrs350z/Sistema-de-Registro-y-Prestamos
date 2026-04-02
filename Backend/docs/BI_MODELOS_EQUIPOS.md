# Módulo de BI para Decisiones de Compra de Equipos

## Objetivo

Este módulo proporciona métricas e indicadores para tomar decisiones informadas sobre:
1. **Qué modelos comprar** y en qué cantidad
2. **Qué marcas/modelos evitar** por alta tasa de fallas
3. **Modelos saturados** vs subutilizados
4. **Demanda insatisfecha** (rechazos por falta de stock)
5. **Fallas predominantes** por modelo y categoría

---

## Arquitectura

```
┌────────────────────────────────────────────────────────────────┐
│                    DashboardModelosController                   │
│  (Endpoints REST para consultar métricas BI por tipo_equipo)  │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                   EstadisticasModeloService                    │
│  (Cálculos de métricas normalizadas, percentiles, scores)     │
└────────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   tipo_equipos  │  │    prestamos    │  │ equipo_estado_  │
│    (modelos)    │  │  prestamo_equipo│  │    eventos      │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## Endpoints Disponibles

### Base URL: `/api/estadisticas-modelos`
### Autenticación: `Bearer Token` + rol `admin`

---

### 1. Resumen Ejecutivo
```
GET /resumen?desde=2024-01-01&hasta=2024-12-31
```

**Respuesta:**
```json
{
  "fecha_generacion": "2024-06-15T10:30:00",
  "periodo": {
    "desde": "2024-01-01",
    "hasta": "2024-06-15"
  },
  "kpis": {
    "total_modelos": 25,
    "total_equipos": 150,
    "tasa_utilizacion_global": 72.5,
    "modelos_saturados": 8,
    "modelos_subutilizados": 5,
    "total_rechazos_stock": 45,
    "tasa_rechazo_global": 3.2,
    "total_incidentes_mantenimiento": 23,
    "downtime_total_horas": 480
  },
  "modelos_criticos": [
    {
      "tipo_equipo_id": 5,
      "modelo": "Canon EOS R5",
      "score": 92,
      "recomendacion": "COMPRAR"
    }
  ],
  "marcas_problematicas": [
    {
      "marca": "GenericBrand",
      "incidentes_1000d": 15.2
    }
  ]
}
```

---

### 2. Ranking de Modelos (Score de Prioridad)
```
GET /ranking?desde=2024-01-01&hasta=2024-12-31&recomendacion=COMPRAR&limite=20
```

**Fórmula del Score (0-100):**
```
Score = (35% × Presión_Uso_Normalizada) 
      + (25% × Demanda_Insatisfecha_Normalizada)
      + (20% × Tendencia_Crecimiento)
      + (10% × (1 - Riesgo_Downtime_Normalizado))
      + (10% × (1 - Tasa_Incidentes_Normalizada))
```

**Respuesta:**
```json
{
  "ranking": [
    {
      "tipo_equipo_id": 5,
      "modelo": "Canon EOS R5",
      "marca": "Canon",
      "categoria": "Cámaras",
      "total_equipos": 3,
      "score": 92,
      "recomendacion": "COMPRAR",
      "explicacion": [
        "P75 de uso (85%) supera umbral alto (75%)",
        "Tasa de rechazo (8.5%) supera umbral (5%)",
        "Tendencia de uso creciente (+2.3% mensual)"
      ],
      "componentes": {
        "presion_uso": { "valor": 0.85, "contribucion": 29.75 },
        "demanda_insatisfecha": { "valor": 0.085, "contribucion": 21.25 },
        "tendencia": { "direccion": "CRECIENTE", "pendiente": 0.023, "contribucion": 20 },
        "riesgo_downtime": { "valor": 0.12, "contribucion": 8.8 },
        "fiabilidad": { "valor": 2.5, "contribucion": 9.5 }
      }
    }
  ],
  "total": 25,
  "filtros": { "desde": "2024-01-01", "hasta": "2024-12-31" }
}
```

**Recomendaciones según Score:**
- `COMPRAR`: Score ≥ 70
- `MONITOREAR`: 40 ≤ Score < 70
- `NO_COMPRAR`: Score < 40

---

### 3. Uso Mensual Normalizado
```
GET /uso-mensual?tipo_equipo_id=5&desde=2024-01-01&hasta=2024-06-30
```

**Concepto:**
- `uso_normalizado` = días_prestados / (total_equipos × días_del_mes)
- Valor entre 0 y 1 (0% a 100%)

---

### 4. Percentiles de Uso (P50, P75, P90)
```
GET /percentiles?desde=2024-01-01&hasta=2024-12-31
```

**Por qué percentiles:**
- **P50 (Mediana)**: Uso típico
- **P75**: El 25% de los equipos está más ocupado que esto
- **P90**: Detecta equipos con uso extremo

---

### 5. Tendencia P75 Mensual
```
GET /tendencia-p75?tipo_equipo_id=5&meses=12
```

**Clasificación:**
- `CRECIENTE`: pendiente > 0.01
- `ESTABLE`: -0.01 ≤ pendiente ≤ 0.01
- `DECRECIENTE`: pendiente < -0.01

---

### 6. Demanda Insatisfecha
```
GET /demanda-insatisfecha?desde=2024-01-01&hasta=2024-12-31
```

**Concepto:**
Solo cuenta rechazos por `SIN_STOCK` o `CONFLICTO_HORARIO` (demanda real no atendida).

---

### 7. Tiempo de Espera Promedio
```
GET /tiempo-espera?desde=2024-01-01&hasta=2024-12-31
```

**Concepto:**
- Tiempo desde `created_at` hasta primera transición a `APROBADO`

---

### 8. Mantenimientos por Tipo de Falla
```
GET /mantenimientos?tipo_equipo_id=5&desde=2024-01-01&hasta=2024-12-31
```

**Agrupación por categorías de falla:**
- `CAM`: Fallas de cámara
- `AUD`: Fallas de audio
- `IT`: Problemas de software/conectividad
- `MECH`: Daños mecánicos
- `PWR`: Problemas de energía
- `USR`: Error de usuario
- `INV`: Inventario/documentación

---

### 9. Downtime por Modelo
```
GET /downtime?desde=2024-01-01&hasta=2024-12-31
```

**Concepto:**
- Horas totales fuera de servicio por mantenimiento
- Calculado desde `equipo_estado_eventos`

---

### 10. Tasa de Incidentes por Exposición
```
GET /incidentes?desde=2024-01-01&hasta=2024-12-31
```

**Fórmula:**
```
incidentes_por_1000_dias = (total_incidentes / dias_uso_total) × 1000
```

**Interpretación:**
- < 5: Excelente fiabilidad
- 5-10: Aceptable
- > 10: Problemático

---

### 11. Distribución de Fallas por Categoría
```
GET /fallas-categoria?tipo_equipo_id=5
```

---

### 12. Ranking de Marcas
```
GET /marcas?desde=2024-01-01&hasta=2024-12-31
```

**Métricas por marca:**
- Total modelos
- Uso promedio
- Incidentes por 1000 días
- Downtime promedio

---

### 13. Datos para Gráficos

#### Boxplot de Uso
```
GET /graficos/boxplot-uso?limite=15
```

#### Serie Temporal P75
```
GET /graficos/serie-p75?tipo_equipo_id=5&meses=12
```

---

### 14. Tabla de Recomendaciones
```
GET /recomendaciones?desde=2024-01-01&hasta=2024-12-31
```

**Respuesta agrupada por recomendación:**
```json
{
  "tabla": [...],
  "agrupado": {
    "COMPRAR": [...],
    "MONITOREAR": [...],
    "NO_COMPRAR": [...]
  },
  "resumen": {
    "comprar": 8,
    "monitorear": 12,
    "no_comprar": 5
  }
}
```

---

## Nuevos Campos en Tabla `prestamos`

La migración `2026_02_09_110000_add_estadisticas_fields_to_prestamos_table.php` agrega:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `motivo_rechazo` | VARCHAR(50) | Enum MotivoRechazo: SIN_STOCK, CONFLICTO_HORARIO, etc. |
| `fecha_entrega_real` | TIMESTAMP | Fecha/hora real de entrega física |
| `fecha_devolucion_real` | TIMESTAMP | Fecha/hora real de devolución física |

---

## Nuevo Enum: MotivoRechazo

```php
namespace App\Enums;

class MotivoRechazo
{
    public const SIN_STOCK = 'SIN_STOCK';
    public const CONFLICTO_HORARIO = 'CONFLICTO_HORARIO';
    public const SANCION_USUARIO = 'SANCION_USUARIO';
    public const DOCUMENTACION = 'DOCUMENTACION';
    public const LIMITE_PRESTAMOS = 'LIMITE_PRESTAMOS';
    public const OTRO = 'OTRO';

    // Estos motivos representan demanda real no atendida
    public static function demandaInsatisfecha(): array
    {
        return [self::SIN_STOCK, self::CONFLICTO_HORARIO];
    }
}
```

---

## Umbrales Configurables

Los umbrales están definidos como constantes en `EstadisticasModeloService`:

```php
// Umbrales de uso
const UMBRAL_USO_ALTO = 0.75;      // P75 > 75% = saturado
const UMBRAL_USO_BAJO = 0.25;      // P75 < 25% = subutilizado

// Umbrales de rechazo
const UMBRAL_RECHAZO_ALTO = 0.10;  // > 10% rechazos = demanda insatisfecha alta
const UMBRAL_RECHAZO_BAJO = 0.02;  // < 2% = demanda bien atendida

// Umbrales de fiabilidad
const UMBRAL_INCIDENTES_ALTO = 10; // > 10 incidentes/1000 días = problemático
const UMBRAL_INCIDENTES_BAJO = 3;  // < 3 = excelente
const UMBRAL_DOWNTIME_ALTO = 5;    // > 5% tiempo inactivo = alto downtime
```

---

## Pesos del Score de Compra

```php
const PESO_PRESION_USO = 0.35;         // 35%
const PESO_DEMANDA_INSATISFECHA = 0.25; // 25%
const PESO_TENDENCIA = 0.20;           // 20%
const PESO_RIESGO_DOWNTIME = 0.10;     // 10%
const PESO_FIABILIDAD = 0.10;          // 10%
```

---

## Migraciones Requeridas

Ejecutar en orden:
```bash
php artisan migrate
```

Migraciones incluidas:
1. `2026_02_09_100000_create_tipos_falla_table.php`
2. `2026_02_09_100001_create_equipo_estado_eventos_table.php`
3. `2026_02_09_110000_add_estadisticas_fields_to_prestamos_table.php`

Seeders:
```bash
php artisan db:seed --class=TiposFallaSeeder
```

---

## Casos de Uso

### 1. Preparar presupuesto de compra anual
```
GET /estadisticas-modelos/recomendaciones?desde=2024-01-01&hasta=2024-12-31
```
→ Obtener lista de modelos con recomendación `COMPRAR`

### 2. Evaluar si reemplazar marca problemática
```
GET /estadisticas-modelos/marcas
```
→ Comparar incidentes_por_1000_dias entre marcas

### 3. Identificar modelos saturados
```
GET /estadisticas-modelos/percentiles
```
→ Filtrar modelos con P75 > 75%

### 4. Ver tendencia de demanda
```
GET /estadisticas-modelos/tendencia-p75?meses=12
```
→ Identificar modelos con tendencia CRECIENTE

---

## Mantenimiento

### Registrar motivo de rechazo
Al rechazar un préstamo, incluir `motivo_rechazo`:
```php
$prestamo->update([
    'estado' => EstadoPrestamo::RECHAZADO,
    'motivo_rechazo' => MotivoRechazo::SIN_STOCK,
]);
```

### Registrar entrega/devolución real
```php
$prestamo->update([
    'fecha_entrega_real' => now(),
]);

// Al devolver
$prestamo->update([
    'fecha_devolucion_real' => now(),
]);
```

---

## Consideraciones Técnicas

1. **MariaDB**: No soporta funciones PERCENTILE nativas; los percentiles se calculan en PHP
2. **Performance**: Las consultas usan índices en `tipo_equipo_id`, `estado`, fechas
3. **Normalización**: Todas las métricas de uso se expresan por equipo para comparar modelos con diferente cantidad de unidades
