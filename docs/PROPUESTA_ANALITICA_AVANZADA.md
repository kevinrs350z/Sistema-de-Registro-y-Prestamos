# PROPUESTA ANALÍTICA AVANZADA — Sistema de Préstamo de Equipos
## Consultoría en Ciencia de Datos, Analítica y Estadística Aplicada

**Fecha:** 2026-02-23  
**Alcance:** Auditoría completa + 30 nuevas métricas + analítica avanzada + plan de implementación

---

## A) AUDITORÍA DE LO EXISTENTE

### A.1) Reportes/KPIs Operativos Actuales (Integrados)

| # | Servicio | Métrica | Filtros Actuales | Gráfico Actual |
|---|----------|---------|------------------|----------------|
| 1 | `DashboardReportesService` | Préstamos del mes / mes anterior | Mes fijo (current/prev) | Tarjeta KPI |
| 2 | `DashboardReportesService` | Equipos disponibles | Ninguno | Tarjeta KPI |
| 3 | `DashboardReportesService` | Usuarios activos | Ninguno | Tarjeta KPI |
| 4 | `DashboardReportesService` | Sanciones activas | Ninguno | Tarjeta KPI |
| 5 | `DashboardReportesService` | Solicitudes por día | Ninguno | Línea |
| 6 | `DashboardReportesService` | Uso interno/externo | Ninguno | Pie/Dona |
| 7 | `DashboardReportesService` | Top 5 categorías | Ninguno | Barras |
| 8 | `DashboardReportesService` | Sanciones y rechazos (conteo) | Ninguno | Tarjeta |
| 9 | `DashboardReportesService` | Top 10 alumnos | Ninguno | Tabla |
| 10 | `DashboardOperationalService` | KPIs operativos (activos, próximos, vencidos, disponibilidad%) | Ninguno | Tarjetas |
| 11 | `DashboardOperationalService` | Estado inventario | Ninguno | Dona |
| 12 | `DashboardOperationalService` | Equipos críticos | Filtro por estado | Tabla |
| 13 | `DashboardOperationalService` | Alertas por profesor | idUser | Tabla |
| 14 | `ReporteProfesorService` | Préstamos por profesor (TOP) | from/to | Barras |
| 15 | `ReporteProfesorService` | Tendencia mensual por profesor | from/to | Líneas |
| 16 | `ReporteProfesorService` | Equipos por profesor (paginado) | Paginación | Tabla |
| 17 | `ReportesAlumnosAdminService` | KPIs alumnos (11+ tarjetas) | from/to, uso, añoIngreso | Tarjetas |
| 18 | `ReportesAlumnosAdminService` | Préstamos por carrera | from/to, uso, añoIngreso | Barras |
| 19 | `ReportesAlumnosAdminService` | Evolución préstamos | from/to, uso, granularity | Línea |
| 20 | `ReportesAlumnosAdminService` | Ranking alumnos | from/to, uso | Tabla |
| 21 | `ReportesAlumnosAdminService` | Workflow estados | from/to | Funnel/Sankey |
| 22 | `ReportesAlumnosAdminService` | Heatmap | from/to | Heatmap |
| 23 | `ReportesAlumnosAdminService` | Riesgo | from/to | Scatter |
| 24 | `ReportesAsignaturasService` | Uso por asignatura | from/to | Barras |
| 25 | `ReportesAsignaturasService` | Equipos por asignatura (paginado) | from/to, search | Tabla |
| 26 | `ReportesAsignaturasService` | Tendencia por año | from/to (36 meses) | Línea |
| 27 | `ReportesInventarioService` | Estado inventario | Ninguno | Dona |
| 28 | `ReportesInventarioService` | Equipos por categoría | Ninguno | Barras |
| 29 | `ReportesInventarioService` | Antigüedad | Ninguno | Barras agrupadas |
| 30 | `ReportesInventarioService` | Top utilizados | from/to, limit | Barras |
| 31 | `ReportesInventarioService` | Sub-utilizados | from/to, limit | Barras |
| 32 | `ReportesInventarioService` | Demanda vs Disponibilidad | from/to, granularity, tipoUso, tipoEquipoId | Barras + línea |
| 33 | `ReportesSancionesService` | KPIs sanciones | Ninguno | Tarjetas |
| 34 | `ReportesSancionesService` | Motivos frecuentes | from/to | Barras |
| 35 | `ReportesSancionesService` | Reincidencia | from/to | Tabla |
| 36 | `ReportesSancionesService` | Bloqueos activos | Ninguno | Tabla |
| 37 | `ReportesSancionesService` | Relación atrasos-sanciones | Ninguno | Scatter |
| 38 | `ReportesMantenimientosService` | Atrasos | Ninguno (vencidos hoy) | Tabla |
| 39 | `ReportesMantenimientosService` | Incidentes por tipo | from/to | Barras |
| 40 | `ReportesMantenimientosService` | Incidentes por equipo | from/to | Barras |
| 41 | `ReportesMantenimientosService` | Equipos en mantenimiento | Ninguno | Tabla |
| 42 | `ReportesEquiposNormalizadosService` | KPIs normalizados | from/to, uso | Tarjetas |
| 43 | `ReportesEquiposNormalizadosService` | Equipos normalizados (% utilización) | from/to, uso | Tabla |
| 44 | `ReportesEquiposNormalizadosService` | Top por mes | from/to, uso, granularity | Barras |
| 45 | `ReportesEquiposNormalizadosService` | Evolución tipo equipo | from/to, uso, granularity | Líneas |
| 46 | `EstadisticasModeloService` | Uso mensual por modelo | tipoEquipoId, desde/hasta | Líneas |
| 47 | `EstadisticasModeloService` | Percentiles P50/P75/P90 | tipoEquipoId, desde/hasta | Boxplot |
| 48 | `EstadisticasModeloService` | Score prioridad de compra | tipoEquipoId, desde/hasta | Tabla/Radar |
| 49 | `DemandAnalyticsService` | 12 KPIs ejecutivos | tipo(FUERA/DENTRO), from/to | Tarjetas |
| 50 | `DemandAnalyticsService` | Timeseries demanda | tipo, from/to, bucket, categoriaId, tipoEquipoId | Líneas |
| 51 | `DemandAnalyticsService` | Distribución duración préstamo | tipo, from/to, categoriaId | Histograma |
| 52 | `DemandAnalyticsService` | Demanda vs Duración | tipo, from/to | Scatter |
| 53 | `DemandAnalyticsService` | Demanda vs Stock | tipo, from/to | Barras+Línea |
| 54 | `DemandAnalyticsService` | Top solicitados | tipo, from/to, groupBy, topN | Barras |
| 55 | `DemandAnalyticsService` | Heatmap demanda | tipo, from/to | Heatmap |
| 56 | `DemandAnalyticsService` | Rechazos y estados | tipo, from/to | Funnel/Sankey |
| 57 | `DemandAnalyticsService` | Forecast demanda | tipo, from/to, horizon | Línea con banda |
| 58 | `DemandAnalyticsService` | Flujo de estados | tipo, from/to | Sankey |
| 59 | `StockoutAnalyticsService` | Stockout Rate KPI | tipo, from/to, categoriaId | Tarjeta + alertas |
| 60 | `StockoutAnalyticsService` | Timeseries stockout | tipo, from/to, bucket | Líneas dual |
| 61 | `StockoutAnalyticsService` | Ranking stockout | tipo, from/to, groupBy, topN | Tabla |
| 62 | `StockoutAnalyticsService` | Scatter demanda vs rechazos | tipo, from/to | Scatter |
| 63 | `StockoutAnalyticsService` | Score prioridad compra | tipo, from/to | Tabla/Ranking |
| 64 | `EquipoEstadisticasService` | Mantenimientos por tipo y falla | desde/hasta | Heatmap/Tabla |
| 65 | `EquipoEstadisticasService` | Top modelos con fallas | desde/hasta, limit | Barras |
| 66 | `EquipoEstadisticasService` | Downtime por modelo | desde/hasta | Barras |

### A.2) Reportes que Existían pero NO Están Integrados

| # | Señal Detectada | Evidencia |
|---|----------------|-----------|
| 1 | **Tendencias (préstamos/mes, categorías, uso por tipo usuario)** | Rutas en `api.php` comentadas: `ReportesTendenciasController` (3 endpoints desactivados) |
| 2 | **Reportes legacy** en `ReportesController` | Equipos más solicitados, uso I/E, sanciones/rechazos, equipos baja, préstamos/periodo, categorías demandadas — duplicados parciales con `DashboardReportesService` |
| 3 | **Evolución mantenimientos** | `EquipoEstadisticasController@evolucionMantenimientos` — ruta activa pero servicio no explorado a fondo; posible sub-uso |
| 4 | **Comparación antigüedad** (endpoint `comparacion-antiguedad`) | Existe en ruta pero dato de antigüedad depende de `created_at` del equipo, no de un campo dedicado `fecha_adquisicion` |

### A.3) GAPS: Preguntas de Negocio Sin Respuesta

| # | Pregunta Clave | ¿Existe data? | Gap |
|---|---------------|----------------|-----|
| G1 | ¿Cuántas solicitudes se rechazaron POR MODELO / MARCA específica? | Parcial (`prestamo_historial` + `motivos_rechazo`) | Falta JOIN directo motivo → tipo_equipo en rechazo |
| G2 | ¿Cuál es el **MTBF** (Mean Time Between Failures) por modelo? | Sí (equipo_estado_eventos) | No se calcula ni expone |
| G3 | ¿Cuál es el **MTTR** (Mean Time To Repair) por modelo? | Parcial (eventos MANTENIMIENTO → DISPONIBLE) | No se calcula |
| G4 | ¿Qué asignatura genera más rechazos por stock? | No | bloque_prestamos no se cruza con motivo_rechazo |
| G5 | ¿A qué hora del día hay mayor demanda insatisfecha? | Parcial | Heatmap existente no cruza con rechazos |
| G6 | ¿Cuántas unidades debo comprar para cubrir pico de demanda? | Parcial (demanda vs stock) | No genera recomendación numérica automática |
| G7 | ¿Qué **carrera** tiene mayor tasa de atraso/incumplimiento? | Parcial (`persona.carrera` existe) | No se cruza con atrasos |
| G8 | ¿Cuál es la vida útil esperada por modelo/marca? | No | Falta `fecha_adquisicion` y `costo_adquisicion` |
| G9 | ¿Cuánto cuesta el downtime por modelo (costo oportunidad)? | No | Falta dato de costo |
| G10 | ¿Cuál es la tasa de rotación de equipos por semestre? | Parcial | No se calcula altas vs bajas por periodo |
| G11 | ¿Hay estacionalidad intra-semestral (semana 1-16)? | Sí (fechas) | No se modela explícitamente |
| G12 | ¿Qué equipos son candidatos a BAJA por edad + fallas? | Parcial | No hay score compuesto |

### A.4) Matriz de Cobertura

| Pregunta Decisional | ¿Métrica? | ¿Gráfico? | ¿Filtro tipo/equipo? | ¿Filtro fecha? | ¿Falta algo? |
|---------------------|-----------|-----------|----------------------|----------------|-------------|
| ¿Qué comprar? | ✅ Score prioridad | ✅ Tabla | ✅ tipo_equipo | ✅ desde/hasta | Falta: recomendación nº unidades automática |
| ¿Cuánto se usa cada modelo? | ✅ Uso normalizado | ✅ Líneas | ✅ | ✅ | Falta: boxplot comparativo entre modelos |
| ¿Qué se rechaza por stock? | ✅ Stockout rate | ✅ Timeseries | ✅ categoría | ✅ | Falta: cruce con asignatura/bloque |
| ¿Qué modelos fallan más? | ✅ Top fallas | ✅ Barras | ✅ | ✅ | Falta: MTBF/MTTR |
| ¿Cuánto tiempo en mantenimiento? | ✅ Downtime | ✅ Barras | ✅ | ✅ | Falta: tendencia downtime + alertas |
| ¿Qué asignaturas demandan más? | ✅ Uso asignatura | ✅ Barras | ❌ tipo equipo | ✅ | Falta: cruce asignatura × tipo equipo |
| ¿Qué profesor usa más? | ✅ Top prof | ✅ Barras | ❌ tipo equipo | ✅ | Falta: filtro por tipo equipo |
| ¿Qué alumno incumple más? | ✅ Reincidencia | ✅ Tabla | ❌ | Parcial | Falta: cruce con tipo equipo |
| ¿Peak demand por hora? | ✅ Heatmap | ✅ | ❌ tipo equipo | ✅ | Falta: filtro por tipo equipo |
| ¿Tendencia semestral? | Parcial | Parcial | ❌ | Parcial | Falta: granularity semester nativa |

---

## B) MAPA DE PREGUNTAS DE DECISIÓN (Decision Questions)

### B.1) Compras / Reposición

| # | Pregunta | Dimensiones Requeridas |
|---|----------|----------------------|
| C1 | ¿Qué modelo/marca comprar prioritariamente? | fecha, tipo_equipo, marca, modelo |
| C2 | ¿Cuántas unidades comprar por modelo? | fecha, tipo_equipo, periodo, interno/externo |
| C3 | ¿Qué modelos retirar del inventario (baja por obsolescencia)? | tipo_equipo, equipo_id, antigüedad, fallas |
| C4 | ¿Qué marca es más confiable? | marca, período, tipo_falla |
| C5 | ¿Cuál es el costo-beneficio de reparar vs reemplazar? | equipo_id, tipo_equipo, downtime, fallas |
| C6 | ¿En qué periodo del año conviene comprar (antes de pico)? | mes/semestre, tipo_equipo |

### B.2) Demanda y Uso Académico

| # | Pregunta | Dimensiones Requeridas |
|---|----------|----------------------|
| D1 | ¿Qué asignatura genera más demanda por tipo equipo? | asignatura, tipo_equipo, fecha, período |
| D2 | ¿Qué carrera tiene mayor consumo? | carrera, tipo_equipo, fecha |
| D3 | ¿Hay estacionalidad dentro del semestre? | semana_semestre, tipo_equipo |
| D4 | ¿Los profesores de qué asignaturas generan rechazos por stock? | asignatura, docente, motivo_rechazo |
| D5 | ¿Cuál es la demanda en periodos de exámenes vs clase normal? | semana_semestre, tipo_equipo |
| D6 | ¿Grupos o individuales? ¿Qué modalidad demanda más? | grupo/individual, tipo_equipo, fecha |

### B.3) Mantenimiento / Confiabilidad

| # | Pregunta | Dimensiones Requeridas |
|---|----------|----------------------|
| M1 | ¿Cuál es el MTBF de cada modelo? | tipo_equipo, equipo_id, fecha |
| M2 | ¿Cuál es el MTTR por modelo y tipo de falla? | tipo_equipo, tipo_falla, fecha |
| M3 | ¿Qué equipos individuales están en zona de riesgo? | equipo_id, fallas_acumuladas, edad |
| M4 | ¿Cuándo programar mantenimiento preventivo? | tipo_equipo, ultimo_mantenimiento, MTBF |
| M5 | ¿Qué tipo de falla es la más costosa (en downtime)? | tipo_falla, tipo_equipo, downtime_horas |
| M6 | ¿La tasa de fallas está aumentando o disminuyendo? | tipo_equipo, mes, tendencia |

### B.4) Operación / Servicio

| # | Pregunta | Dimensiones Requeridas |
|---|----------|----------------------|
| O1 | ¿Cuál es el fill rate (% solicitudes satisfechas)? | fecha, tipo_equipo, interno/externo |
| O2 | ¿Cuál es el tiempo medio solicitud → aprobación? | fecha, tipo_equipo |
| O3 | ¿Cuál es la tasa de atrasos por tipo equipo? | tipo_equipo, fecha, docente/alumno |
| O4 | ¿Qué porcentaje de préstamos se cancelan? | fecha, tipo_equipo, motivo |
| O5 | ¿Cuál es el throughput diario del sistema? | fecha, bloque_horario |
| O6 | ¿El SLA de aprobación se cumple? | fecha, tipo_equipo |

---

## C) NUEVAS MÉTRICAS / KPIs (30 métricas, ordenadas por impacto)

---

### KPI-01: MTBF — Mean Time Between Failures
**Impacto: 🔴 ALTO**

- **Definición:** Tiempo promedio de operación de un equipo entre fallas sucesivas. Mide confiabilidad.
- **Fórmula:**
```sql
-- Para cada equipo: calcular intervalos entre eventos MANTENIMIENTO consecutivos
SELECT
    e.id AS equipo_id,
    te.nombre AS modelo,
    te.marca,
    AVG(TIMESTAMPDIFF(HOUR, eee_prev.fecha_evento, eee.fecha_evento)) AS mtbf_horas
FROM equipo_estado_eventos eee
JOIN equipo_estado_eventos eee_prev 
    ON eee_prev.equipo_id = eee.equipo_id
    AND eee_prev.estado_nuevo = 'MANTENIMIENTO'
    AND eee_prev.fecha_evento < eee.fecha_evento
    AND NOT EXISTS (
        SELECT 1 FROM equipo_estado_eventos eee_mid
        WHERE eee_mid.equipo_id = eee.equipo_id
        AND eee_mid.estado_nuevo = 'MANTENIMIENTO'
        AND eee_mid.fecha_evento > eee_prev.fecha_evento
        AND eee_mid.fecha_evento < eee.fecha_evento
    )
JOIN equipos e ON e.id = eee.equipo_id
JOIN tipo_equipos te ON te.id = e.tipo_equipo_id
WHERE eee.estado_nuevo = 'MANTENIMIENTO'
AND eee.fecha_evento BETWEEN :start AND :end
GROUP BY e.id, te.nombre, te.marca;

-- Luego agregar por modelo:
-- AVG(mtbf_horas) AS mtbf_modelo, PERCENTILE(50, mtbf_horas), PERCENTILE(90, mtbf_horas)
```
- **Dimensiones:** Fecha/periodo ✅ | Tipo equipo ✅ | Equipo específico ✅ | Marca/modelo ✅ | Interno/externo N/A
- **Promedios:** MTBF promedio por modelo, por marca, por categoría; P50/P75/P90
- **Comparativas:** MTBF actual vs semestre anterior; tendencia trimestral
- **Alertas:** Si MTBF < 720 horas (30 días) → equipo problemático; si MTBF modelo < 50% del promedio global → modelo a retirar
- **Visualización:** **Boxplot** (distribución de MTBF por modelo). Boxplot es el gráfico correcto porque muestra dispersión, mediana, outliers: permite comparar la confiabilidad entre modelos de un vistazo.
- **Decisión habilitada:** Identificar modelos/marcas no confiables → evitar recompra, planificar reposición.

---

### KPI-02: MTTR — Mean Time To Repair
**Impacto: 🔴 ALTO**

- **Definición:** Tiempo promedio entre que un equipo entra en MANTENIMIENTO y vuelve a DISPONIBLE.
- **Fórmula:**
```sql
SELECT
    te.id AS tipo_equipo_id,
    te.nombre AS modelo,
    te.marca,
    tf.nombre AS tipo_falla,
    AVG(TIMESTAMPDIFF(HOUR, eee_in.fecha_evento, eee_out.fecha_evento)) AS mttr_horas,
    COUNT(*) AS eventos
FROM equipo_estado_eventos eee_in
JOIN equipo_estado_eventos eee_out 
    ON eee_out.equipo_id = eee_in.equipo_id
    AND eee_out.estado_anterior = 'MANTENIMIENTO'
    AND eee_out.estado_nuevo IN ('DISPONIBLE','PRESTADO')
    AND eee_out.fecha_evento > eee_in.fecha_evento
    AND eee_out.id = (
        SELECT MIN(id) FROM equipo_estado_eventos 
        WHERE equipo_id = eee_in.equipo_id 
        AND estado_anterior = 'MANTENIMIENTO'
        AND id > eee_in.id
    )
JOIN equipos e ON e.id = eee_in.equipo_id
JOIN tipo_equipos te ON te.id = e.tipo_equipo_id
LEFT JOIN tipos_falla tf ON tf.id = eee_in.tipo_falla_id
WHERE eee_in.estado_nuevo = 'MANTENIMIENTO'
AND eee_in.fecha_evento BETWEEN :start AND :end
GROUP BY te.id, te.nombre, te.marca, tf.nombre;
```
- **Dimensiones:** Fecha/periodo ✅ | Tipo equipo ✅ | Equipo específico ✅ | Marca ✅ | Tipo falla ✅
- **Promedios:** MTTR P50/P90 por modelo; MTTR por tipo_falla
- **Comparativas:** vs promedio histórico; vs SLA interno (e.g., 48h objetivo)
- **Alertas:** MTTR > 168 horas (7 días) → reparación lenta; MTTR creciente → problema proveedor/repuestos
- **Visualización:** **Barras horizontales agrupadas** (modelo × tipo_falla → MTTR). Barras permiten comparar rápidamente la velocidad de reparación entre modelos.
- **Decisión habilitada:** Negociar SLA con proveedores, decidir reparar vs reemplazar, dimensionar stock de respaldo.

---

### KPI-03: Tasa de Rotación de Inventario
**Impacto: 🔴 ALTO**

- **Definición:** Cuántas veces "rota" (se presta) el inventario de un modelo en un período, normalizado por unidades.
- **Fórmula:**
```sql
SELECT
    te.id, te.nombre AS modelo, te.marca,
    COUNT(DISTINCT pe.idPrestamo) AS prestamos_periodo,
    COUNT(DISTINCT e.id) AS unidades_activas,
    ROUND(COUNT(DISTINCT pe.idPrestamo) / NULLIF(COUNT(DISTINCT e.id), 0), 2) AS rotacion
FROM tipo_equipos te
JOIN equipos e ON e.tipo_equipo_id = te.id AND e.deleted_at IS NULL
LEFT JOIN prestamo_equipo pe ON pe.idEquipo = e.id
LEFT JOIN prestamos p ON p.idPrestamo = pe.idPrestamo
    AND p.fecha_inicio BETWEEN :start AND :end
    AND p.estado IN ('APROBADO','ENTREGADO','DEVUELTO','PENDIENTE_ENTREGA')
GROUP BY te.id, te.nombre, te.marca
ORDER BY rotacion DESC;
```
- **Dimensiones:** Fecha/periodo ✅ | Tipo equipo ✅ | Marca ✅ | Interno/externo ✅
- **Promedios:** Rotación promedio global; por categoría
- **Comparativas:** MoM, semestre vs semestre anterior
- **Alertas:** Rotación < 0.5 → sub-utilización; Rotación > 10 → sobre-explotación
- **Visualización:** **Barras + línea promedio** (barras por modelo, línea de promedio global). Barras permiten ranking + línea da referencia.
- **Decisión habilitada:** Redistribuir equipos sub-utilizados, comprar más de los high-rotation.

---

### KPI-04: Fill Rate por Tipo de Equipo  
**Impacto: 🔴 ALTO**

- **Definición:** % de solicitudes que resultan en préstamo aprobado vs total solicitado, desglosado por tipo equipo.
- **Fórmula:**
```sql
SELECT
    te.id, te.nombre AS modelo,
    COUNT(DISTINCT p.idPrestamo) AS total_solicitudes,
    COUNT(DISTINCT CASE WHEN p.estado IN ('APROBADO','ENTREGADO','DEVUELTO','PENDIENTE_ENTREGA') 
          THEN p.idPrestamo END) AS aprobadas,
    ROUND(
        COUNT(DISTINCT CASE WHEN p.estado IN ('APROBADO','ENTREGADO','DEVUELTO','PENDIENTE_ENTREGA') 
              THEN p.idPrestamo END) * 100.0 
        / NULLIF(COUNT(DISTINCT p.idPrestamo), 0), 1
    ) AS fill_rate
FROM prestamos p
JOIN prestamo_equipo pe ON pe.idPrestamo = p.idPrestamo
JOIN equipos e ON e.id = pe.idEquipo
JOIN tipo_equipos te ON te.id = e.tipo_equipo_id
WHERE p.fecha_inicio BETWEEN :start AND :end
GROUP BY te.id, te.nombre
ORDER BY fill_rate ASC; -- Peores primero
```
- **Dimensiones:** Fecha/periodo ✅ | Tipo equipo ✅ | Categoría ✅ | Interno/externo ✅
- **Promedios:** Fill rate global; por categoría; media móvil 3 meses
- **Comparativas:** vs periodo anterior, vs objetivo (ej. 90%)
- **Alertas:** Fill rate < 75% → problema de stock; < 50% → crítico
- **Visualización:** **Gauge/Bullet chart** por modelo (target = 90%). Gauge muestra el cumplimiento vs objetivo intuitivamente.
- **Decisión habilitada:** Priorizar compras para modelos con fill rate bajo.

---

### KPI-05: Demanda Insatisfecha por Asignatura × Tipo Equipo  
**Impacto: 🔴 ALTO**

- **Definición:** ¿Qué asignatura genera más rechazos por falta de stock de qué tipo de equipo?
- **Fórmula:**
```sql
SELECT
    a.nombre AS asignatura,
    te.nombre AS modelo,
    COUNT(DISTINCT p.idPrestamo) AS rechazos_stock
FROM prestamos p
JOIN prestamo_historial ph ON ph.idPrestamo = p.idPrestamo
    AND ph.estado_nuevo = 'RECHAZADO'
    AND ph.descripcion LIKE '%SIN_STOCK%'
JOIN bloque_prestamos bp ON bp.idPrestamo = p.idPrestamo
JOIN asignaturas a ON a.idAsignatura = bp.idAsignatura
JOIN prestamo_equipo pe ON pe.idPrestamo = p.idPrestamo
JOIN equipos e ON e.id = pe.idEquipo
JOIN tipo_equipos te ON te.id = e.tipo_equipo_id
WHERE p.fecha_inicio BETWEEN :start AND :end
GROUP BY a.nombre, te.nombre
ORDER BY rechazos_stock DESC;
```
- **Dimensiones:** Fecha ✅ | Asignatura ✅ | Tipo equipo ✅ | Docente ✅
- **Promedios:** Rechazos promedio por asignatura; por tipo
- **Alertas:** >5 rechazos/mes en un cruce asignatura×modelo → cuello de botella
- **Visualización:** **Heatmap** (asignatura vs tipo equipo, intensidad = rechazos). Heatmap revela patrones cruzados que scatter o barras no pueden.
- **Decisión habilitada:** Asignar equipos preferencialmente a asignaturas con mayor demanda insatisfecha; coordinar con docentes.

---

### KPI-06: Disponibilidad Operativa (Uptime %)
**Impacto: 🔴 ALTO**

- **Definición:** % del tiempo que un equipo/modelo estuvo disponible u operativo (no en mantenimiento ni baja).
- **Fórmula:**
```
Uptime% = (Horas_totales_periodo - Horas_MANTENIMIENTO - Horas_BAJA_TEMPORAL) / Horas_totales_periodo × 100
```
```sql
-- Calcular horas en mantenimiento desde equipo_estado_eventos
-- Para cada evento MANTENIMIENTO, buscar el siguiente evento que lo saca de MANTENIMIENTO
-- Sumar esas horas por equipo y agregar por modelo
```
- **Dimensiones:** Fecha ✅ | Tipo equipo ✅ | Equipo específico ✅ | Marca ✅
- **Promedios:** Uptime promedio por modelo, P50/P90
- **Comparativas:** vs periodo anterior; vs target (95%)
- **Alertas:** Uptime < 85% → capacidad comprometida
- **Visualización:** **Barras apiladas 100%** (operativo / mantenimiento / baja por modelo). Stacked 100% muestra la distribución proporcional del tiempo.
- **Decisión habilitada:** Identificar modelos con baja disponibilidad para reemplazo.

---

### KPI-07: Índice de Demanda Estacional (IDE)
**Impacto: 🔴 ALTO**

- **Definición:** Factor multiplicador que indica cuánto se desvía la demanda de un mes/semana respecto al promedio del periodo.
- **Fórmula:**
```
IDE(mes_m) = demanda(mes_m) / promedio_mensual_del_año
```
```sql
WITH mensual AS (
    SELECT 
        DATE_FORMAT(p.fecha_inicio, '%Y-%m') AS mes,
        te.id AS tipo_equipo_id,
        COUNT(*) AS demanda
    FROM prestamos p
    JOIN prestamo_equipo pe ON pe.idPrestamo = p.idPrestamo
    JOIN equipos e ON e.id = pe.idEquipo
    JOIN tipo_equipos te ON te.id = e.tipo_equipo_id
    WHERE p.fecha_inicio BETWEEN :start AND :end
    GROUP BY mes, te.id
),
avg_anual AS (
    SELECT tipo_equipo_id, AVG(demanda) AS prom FROM mensual GROUP BY tipo_equipo_id
)
SELECT m.mes, m.tipo_equipo_id, m.demanda, a.prom,
       ROUND(m.demanda / NULLIF(a.prom, 0), 2) AS ide
FROM mensual m JOIN avg_anual a ON a.tipo_equipo_id = m.tipo_equipo_id;
```
- **Dimensiones:** Fecha (mes/semana) ✅ | Tipo equipo ✅ | Interno/externo ✅
- **Promedios:** IDE promedio por mes del año (estacionalidad recurrente)
- **Visualización:** **Líneas con área sombreada** (IDE por mes, área destaca picos). Líneas muestran la tendencia cíclica; el área enfatiza los picos estacionales.
- **Decisión habilitada:** Planificar compras antes de meses con IDE > 1.5; redistribuir equipos.

---

### KPI-08: Score Compuesto de Prioridad de Compra (mejorado)
**Impacto: 🔴 ALTO**

- **Definición:** Score 0-100 que combina 5 factores para priorizar compra por modelo. (Mejora del existente en EstadisticasModeloService).
- **Fórmula:**
```
Score = (0.30 × presión_uso_norm) 
      + (0.25 × demanda_insatisfecha_norm) 
      + (0.20 × tendencia_crecimiento_norm) 
      + (0.15 × riesgo_downtime_norm) 
      + (0.10 × antiguedad_flota_norm)
```
Donde:
  - `presión_uso_norm` = P75 uso mensual / 1.0 (capped at 1)
  - `demanda_insatisfecha_norm` = rechazos_SIN_STOCK / total_solicitudes 
  - `tendencia_crecimiento_norm` = (demanda_último_Q - demanda_Q_anterior) / demanda_Q_anterior
  - `riesgo_downtime_norm` = horas_downtime / (horas_periodo × n_equipos)
  - `antiguedad_flota_norm` = equipos_con_edad > 3_años / total_equipos_modelo
- **Dimensiones:** Periodo ✅ | Tipo equipo ✅ | Marca ✅
- **Promedios:** Score promedio por categoría
- **Alertas:** Score > 75 → compra urgente; 50-75 → planificar; < 50 → OK
- **Visualización:** **Tabla rankeada + radar** (tabla para priorización, radar para ver qué dimensión pesa más en cada modelo). Radar descompone visualmente las 5 dimensiones.
- **Decisión habilitada:** Generar orden de compra priorizada con cantidades sugeridas.

---

### KPI-09: Recomendación de Unidades a Comprar
**Impacto: 🔴 ALTO**

- **Definición:** Número de unidades que se recomienda adquirir por modelo para cubrir el pico de demanda con margen.
- **Fórmula:**
```
unidades_sugeridas = CEIL(
    (demanda_pico_mes × factor_seguridad) - stock_operativo_actual
)
-- donde factor_seguridad = 1.2 (20% buffer)
-- demanda_pico_mes = MAX(demanda_mensual) de últimos 12 meses
```
```sql
WITH demand_mensual AS (
    SELECT te.id AS te_id, DATE_FORMAT(p.fecha_inicio,'%Y-%m') AS mes,
           COUNT(DISTINCT pe.idEquipo) AS demanda
    FROM prestamos p
    JOIN prestamo_equipo pe ON pe.idPrestamo = p.idPrestamo
    JOIN equipos e ON e.id = pe.idEquipo
    JOIN tipo_equipos te ON te.id = e.tipo_equipo_id
    WHERE p.estado IN ('APROBADO','ENTREGADO','DEVUELTO','PENDIENTE_ENTREGA')
    AND p.fecha_inicio >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
    GROUP BY te.id, mes
),
pico AS (SELECT te_id, MAX(demanda) AS pico FROM demand_mensual GROUP BY te_id),
stock AS (
    SELECT tipo_equipo_id AS te_id, COUNT(*) AS stock_op
    FROM equipos 
    WHERE estado NOT IN ('MANTENIMIENTO','BAJA_TEMPORAL','DADO_DE_BAJA') AND deleted_at IS NULL
    GROUP BY tipo_equipo_id
)
SELECT te.nombre, te.marca, 
       COALESCE(p.pico,0) AS demanda_pico,
       COALESCE(s.stock_op,0) AS stock_actual,
       GREATEST(0, CEIL(COALESCE(p.pico,0) * 1.2) - COALESCE(s.stock_op,0)) AS comprar
FROM tipo_equipos te
LEFT JOIN pico p ON p.te_id = te.id
LEFT JOIN stock s ON s.te_id = te.id
WHERE GREATEST(0, CEIL(COALESCE(p.pico,0) * 1.2) - COALESCE(s.stock_op,0)) > 0
ORDER BY comprar DESC;
```
- **Dimensiones:** Periodo (12 meses lookback) ✅ | Tipo equipo ✅ | Interno/externo ✅
- **Visualización:** **Tabla con barras de progreso** (stock actual vs necesidad). Tabla accionable directamente.
- **Decisión habilitada:** Orden de compra concreta con cantidad, modelo y justificación.

---

### KPI-10: Tasa de Atraso por Tipo de Equipo
**Impacto: 🟡 ALTO**

- **Definición:** % de préstamos que excedieron su fecha_fin por tipo de equipo.
- **Fórmula:**
```sql
SELECT te.nombre AS modelo,
       COUNT(DISTINCT p.idPrestamo) AS total_prestamos,
       COUNT(DISTINCT CASE WHEN p.estado = 'ATRASADO' 
             OR (p.estado = 'DEVUELTO' AND p.updated_at > p.fecha_fin)
             THEN p.idPrestamo END) AS atrasados,
       ROUND(atrasados * 100.0 / NULLIF(total_prestamos, 0), 1) AS tasa_atraso
FROM prestamos p
JOIN prestamo_equipo pe ON pe.idPrestamo = p.idPrestamo
JOIN equipos e ON e.id = pe.idEquipo
JOIN tipo_equipos te ON te.id = e.tipo_equipo_id
WHERE p.fecha_inicio BETWEEN :start AND :end
GROUP BY te.nombre;
```
- **Dimensiones:** Fecha ✅ | Tipo equipo ✅ | Interno/externo ✅ | Docente/Alumno ✅
- **Comparativas:** vs promedio global; tendencia mensual
- **Alertas:** Tasa > 15% → equipo "problemático" en devoluciones
- **Visualización:** **Pareto** (barras tasa_atraso + línea acumulada). Pareto identifica el 20% de modelos que causan 80% de atrasos.
- **Decisión habilitada:** Reducir plazo máximo para modelos con alta tasa; endurecer políticas.

---

### KPI-11: Distribución de Duración de Préstamo por Modelo
**Impacto: 🟡 MEDIO**

- **Definición:** Distribución estadística (P25, P50, P75, P90) de días de préstamo por modelo.
- **Fórmula:**
```sql
SELECT te.nombre, te.marca,
       DATEDIFF(p.fecha_fin, p.fecha_inicio) AS duracion_dias
FROM prestamos p
JOIN prestamo_equipo pe ON pe.idPrestamo = p.idPrestamo
JOIN equipos e ON e.id = pe.idEquipo  
JOIN tipo_equipos te ON te.id = e.tipo_equipo_id
WHERE p.estado = 'DEVUELTO'
AND p.fecha_inicio BETWEEN :start AND :end;
-- Luego calcular percentiles en PHP
```
- **Dimensiones:** Fecha ✅ | Tipo equipo ✅ | Marca ✅ | Interno/externo ✅
- **Visualización:** **Boxplot** comparativo (un boxplot por modelo top 10). Boxplot muestra la distribución completa: mediana, IQR, outliers.
- **Decisión habilitada:** Ajustar plazo máximo de préstamo por modelo; detectar si algunos modelos se retienen más.

---

### KPI-12: Heatmap de Demanda por Bloque Horario × Día Semana
**Impacto: 🟡 MEDIO**

- **Definición:** Intensidad de demanda cruzando bloque horario (8 bloques) × día de la semana, filtrable por tipo equipo.
- **Fórmula:**
```sql
SELECT 
    b.idBloque,
    CONCAT(b.hora_inicio, '-', b.hora_fin) AS bloque,
    DAYOFWEEK(p.fecha_inicio) AS dia_semana,
    te.nombre AS tipo_equipo,
    COUNT(*) AS demanda
FROM bloque_prestamos bp
JOIN bloques b ON b.idBloque = bp.idBloque
JOIN prestamos p ON p.idPrestamo = bp.idPrestamo
JOIN prestamo_equipo pe ON pe.idPrestamo = p.idPrestamo
JOIN equipos e ON e.id = pe.idEquipo
JOIN tipo_equipos te ON te.id = e.tipo_equipo_id
WHERE p.fecha_inicio BETWEEN :start AND :end
GROUP BY b.idBloque, bloque, dia_semana, te.nombre;
```
- **Dimensiones:** Fecha ✅ | Tipo equipo ✅ | Bloque horario ✅ | Interno/externo ✅
- **Visualización:** **Heatmap calendario** (eje X = día semana, eje Y = bloque, color = intensidad). Heatmap revela patrones de congestión temporal.
- **Decisión habilitada:** Redistribuir horarios de préstamo; identificar bloques para mantenimiento preventivo.

---

### KPI-13: Tasa de Incumplimiento por Carrera
**Impacto: 🟡 MEDIO**

- **Definición:** % de préstamos con atraso agrupados por carrera del alumno.
- **Fórmula:**
```sql
SELECT pe_persona.carrera,
       COUNT(DISTINCT p.idPrestamo) AS total,
       COUNT(DISTINCT CASE WHEN p.estado='ATRASADO' THEN p.idPrestamo END) AS atrasados,
       ROUND(atrasados * 100.0 / NULLIF(total, 0), 1) AS tasa_incumplimiento
FROM prestamos p
JOIN users u ON u.idUser = p.idUser
JOIN persona pe_persona ON pe_persona.idPersona = u.idPersona
WHERE p.fecha_inicio BETWEEN :start AND :end
AND pe_persona.carrera IS NOT NULL
GROUP BY pe_persona.carrera
ORDER BY tasa_incumplimiento DESC;
```
- **Dimensiones:** Fecha ✅ | Carrera ✅ | Tipo equipo (cruce posible) ✅
- **Visualización:** **Barras horizontales** (carreras rankeadas por tasa). Barras horizontales permiten leer nombres largos de carreras.
- **Decisión habilitada:** Campañas de sensibilización por carrera; ajustar reglas de sanción.

---

### KPI-14: Índice de Concentración de Uso (Gini de equipos)
**Impacto: 🟡 MEDIO**

- **Definición:** Mide si el uso de equipos está concentrado en pocos o distribuido. Gini = 0 (uso parejo), Gini = 1 (un equipo acapara todo).
- **Fórmula:**
```
-- Calcular préstamos por equipo individual dentro de un modelo
-- Aplicar coeficiente de Gini sobre esos conteos
-- Gini = (2 × Σ(i × x_i)) / (n × Σ(x_i)) - (n+1)/n
```
- **Dimensiones:** Fecha ✅ | Tipo equipo ✅ | Categoría ✅
- **Promedios:** Gini por modelo; tendencia semestral
- **Alertas:** Gini > 0.6 → uso muy desigual (riesgo de desgaste prematuro en algunos)
- **Visualización:** **Curva de Lorenz** o **barras de Gini por modelo**. La curva de Lorenz es la visualización canónica para concentración.
- **Decisión habilitada:** Rotar equipos; redistribuir para ecualizar desgaste.

---

### KPI-15: Velocidad de Aprobación (Cycle Time)
**Impacto: 🟡 MEDIO**

- **Definición:** Tiempo desde creación del préstamo (PENDIENTE) hasta APROBADO o RECHAZADO.
- **Fórmula:**
```sql
SELECT
    te.nombre AS modelo,
    AVG(TIMESTAMPDIFF(MINUTE, p.created_at, ph.created_at)) AS minutos_promedio,
    -- Percentiles calculados en PHP
FROM prestamos p
JOIN prestamo_historial ph ON ph.idPrestamo = p.idPrestamo
    AND ph.estado_nuevo IN ('APROBADO', 'RECHAZADO')
    AND ph.estado_anterior = 'PENDIENTE'
JOIN prestamo_equipo pe ON pe.idPrestamo = p.idPrestamo
JOIN equipos e ON e.id = pe.idEquipo
JOIN tipo_equipos te ON te.id = e.tipo_equipo_id
WHERE p.created_at BETWEEN :start AND :end
GROUP BY te.nombre;
```
- **Dimensiones:** Fecha ✅ | Tipo equipo ✅ | Docente responsable ✅
- **Alertas:** P90 > 24 horas → cuello de botella administrativo
- **Visualización:** **Histograma** (distribución de tiempos). Histograma muestra la forma de la distribución del cycle time.
- **Decisión habilitada:** Optimizar proceso de aprobación; automatizar aprobaciones bajo cierto umbral.

---

### KPI-16: Tasa de Rechazos por Motivo (Pareto)
**Impacto: 🟡 MEDIO**

- **Definición:** Desglose de rechazos por motivo (SIN_STOCK, CONFLICTO_HORARIO, SANCION, etc.) con acumulado Pareto.
- **Fórmula:**
```sql
SELECT 
    CASE 
        WHEN ph.descripcion LIKE '%SIN_STOCK%' THEN 'SIN_STOCK'
        WHEN ph.descripcion LIKE '%CONFLICTO_HORARIO%' THEN 'CONFLICTO_HORARIO'
        WHEN ph.descripcion LIKE '%SANCION%' THEN 'SANCION_USUARIO'
        WHEN ph.descripcion LIKE '%LIMITE%' THEN 'LIMITE_PRESTAMOS'
        ELSE 'OTRO'
    END AS motivo,
    COUNT(*) AS total
FROM prestamo_historial ph
WHERE ph.estado_nuevo = 'RECHAZADO'
AND ph.created_at BETWEEN :start AND :end
GROUP BY motivo
ORDER BY total DESC;
```
- **Dimensiones:** Fecha ✅ | Tipo equipo (con JOIN) ✅ | Interno/externo ✅
- **Visualización:** **Pareto** (barras + línea acumulada %). Pareto es el gráfico canónico para priorizar causas.
- **Decisión habilitada:** Atacar la causa #1 de rechazo primero (comprar si es stock, redistribuir si es horario).

---

### KPI-17: Capacidad vs Demanda por Periodo (Ratio)
**Impacto: 🟡 MEDIO**

- **Definición:** Ratio = stock operativo / demanda de equipos distintos por periodo. Si < 1, hay déficit.
- **Fórmula:**
```sql
-- Ya existe en demandaVsDisponibilidad pero falta el ratio por periodo
-- Extender con: ratio = stockOperativo / demanda
-- Y: demanda_no_cubierta = MAX(0, demanda - stockOperativo)
```
- **Dimensiones:** Fecha/granularity ✅ | Tipo equipo ✅ | Interno/externo ✅
- **Visualización:** **Barras + línea target (ratio=1)**. Dual-axis con barras de demanda y línea de capacidad.
- **Decisión habilitada:** Cuándo y cuánto comprar para mantener ratio ≥ 1.2.

---

### KPI-18: Score de Riesgo de Falla por Equipo Individual
**Impacto: 🟡 MEDIO**

- **Definición:** Score 0-100 para cada equipo individual que predice probabilidad de próxima falla.
- **Fórmula:**
```
Score = (0.35 × fallas_acumuladas_norm)
      + (0.25 × inverso_MTBF_norm)
      + (0.20 × edad_norm)
      + (0.20 × dias_desde_ultima_revision_norm)
```
- **Dimensiones:** Equipo específico ✅ | Tipo equipo ✅ | Marca ✅
- **Alertas:** Score > 80 → mantenimiento preventivo urgente; > 90 → candidato a baja
- **Visualización:** **Scatter** (eje X = edad, eje Y = fallas, tamaño = score). Scatter revela la relación bivariada edad-fallas, y el tamaño de burbuja agrega la tercera dimensión.
- **Decisión habilitada:** Planificar mantenimiento preventivo; candidatos a reemplazo.

---

### KPI-19: Préstamos por Carrera × Tipo Equipo
**Impacto: 🟡 MEDIO**

- **Definición:** Demanda cruzada entre carrera del usuario y tipo de equipo solicitado.
- **Fórmula:**
```sql
SELECT pe_persona.carrera, te.nombre AS modelo, COUNT(*) AS total
FROM prestamos p
JOIN users u ON u.idUser = p.idUser
JOIN persona pe_persona ON pe_persona.idPersona = u.idPersona
JOIN prestamo_equipo pe ON pe.idPrestamo = p.idPrestamo
JOIN equipos e ON e.id = pe.idEquipo
JOIN tipo_equipos te ON te.id = e.tipo_equipo_id
WHERE p.fecha_inicio BETWEEN :start AND :end
AND pe_persona.carrera IS NOT NULL
GROUP BY pe_persona.carrera, te.nombre;
```
- **Dimensiones:** Fecha ✅ | Carrera ✅ | Tipo equipo ✅ | Interno/externo ✅
- **Visualización:** **Treemap** (rectángulos proporcionales: carrera → tipo equipo → tamaño). Treemap muestra composición jerárquica de forma compacta.
- **Decisión habilitada:** Asignar presupuesto de compra por carrera; redistribuir equipos.

---

### KPI-20: Evolución de Mantenimientos (Tendencia con Media Móvil)
**Impacto: 🟡 MEDIO**

- **Definición:** Cantidad de eventos MANTENIMIENTO por mes con media móvil de 3 meses para detectar tendencia.
- **Fórmula:**
```sql
SELECT 
    DATE_FORMAT(eee.fecha_evento, '%Y-%m') AS mes,
    te.nombre AS modelo,
    COUNT(*) AS incidentes
FROM equipo_estado_eventos eee
JOIN equipos e ON e.id = eee.equipo_id
JOIN tipo_equipos te ON te.id = e.tipo_equipo_id
WHERE eee.estado_nuevo = 'MANTENIMIENTO'
AND eee.fecha_evento BETWEEN :start AND :end
GROUP BY mes, te.nombre
ORDER BY mes;
-- Media móvil calculada en PHP: promedio(mes_actual, mes-1, mes-2)
```
- **Dimensiones:** Fecha ✅ | Tipo equipo ✅ | Tipo falla ✅ | Marca ✅
- **Visualización:** **Líneas con media móvil** (línea punteada = real, sólida = MA3). Media móvil suaviza ruido y revela tendencia real.
- **Decisión habilitada:** Detectar si un modelo empieza a fallar más → planificar reemplazo.

---

### KPI-21: Demanda Pico vs Capacidad Instalada por Bloque
**Impacto: 🟡 MEDIO**

- **Definición:** Para cada bloque horario, la máxima demanda simultánea observada vs equipos disponibles.
- **Fórmula:**
```sql
SELECT 
    b.idBloque,
    CONCAT(b.hora_inicio,'-',b.hora_fin) AS bloque,
    te.nombre AS modelo,
    MAX(daily_count) AS pico_demanda,
    -- stock_operativo se calcula por separado
FROM (
    SELECT bp.idBloque, e.tipo_equipo_id, p.fecha_inicio AS dia, COUNT(*) AS daily_count
    FROM bloque_prestamos bp
    JOIN prestamos p ON p.idPrestamo = bp.idPrestamo
    JOIN prestamo_equipo pe ON pe.idPrestamo = p.idPrestamo
    JOIN equipos e ON e.id = pe.idEquipo
    WHERE p.fecha_inicio BETWEEN :start AND :end
    GROUP BY bp.idBloque, e.tipo_equipo_id, p.fecha_inicio
) sub
JOIN bloques b ON b.idBloque = sub.idBloque
JOIN tipo_equipos te ON te.id = sub.tipo_equipo_id
GROUP BY b.idBloque, bloque, te.nombre;
```
- **Dimensiones:** Bloque horario ✅ | Tipo equipo ✅ | Fecha ✅
- **Visualización:** **Heatmap de bloques** (eje Y = tipo equipo, eje X = bloque horario, color = % capacidad). Heatmap de bloques revela en qué horario cada tipo de equipo está saturado.
- **Decisión habilitada:** Programar mantenimientos en bloques con baja demanda; asignar stock temporal.

---

### KPI-22: Ratio Préstamos Internos vs Externos por Modelo
**Impacto: 🟢 MEDIO**

- **Definición:** % de uso interno vs externo por cada tipo de equipo.
- **Fórmula:**
```sql
SELECT te.nombre,
    SUM(CASE WHEN UPPER(p.tipo)='DENTRO' THEN 1 ELSE 0 END) AS internos,
    SUM(CASE WHEN UPPER(p.tipo)='FUERA' THEN 1 ELSE 0 END) AS externos,
    COUNT(*) AS total
FROM prestamos p
JOIN prestamo_equipo pe ON pe.idPrestamo = p.idPrestamo
JOIN equipos e ON e.id = pe.idEquipo
JOIN tipo_equipos te ON te.id = e.tipo_equipo_id
WHERE p.fecha_inicio BETWEEN :start AND :end
GROUP BY te.nombre;
```
- **Dimensiones:** Fecha ✅ | Tipo equipo ✅ | Marca ✅
- **Visualización:** **Barras apiladas 100%** (cada barra = modelo, segmentos = interno/externo %). Stacked 100% muestra composición proporcional por modelo.
- **Decisión habilitada:** Equipos que salen más del campus necesitan seguro/garantía extendida; mayor desgaste en transporte.

---

### KPI-23: Antigüedad de Flota por Modelo (con Riesgo)
**Impacto: 🟢 MEDIO**

- **Definición:** Distribución de edad de los equipos activos por modelo, cruzada con tasa de falla.
- **Fórmula:**
```sql
SELECT te.nombre AS modelo,
    TIMESTAMPDIFF(MONTH, e.created_at, CURDATE()) AS meses_edad,
    (SELECT COUNT(*) FROM equipo_estado_eventos eee 
     WHERE eee.equipo_id = e.id AND eee.estado_nuevo = 'MANTENIMIENTO') AS fallas,
    e.estado
FROM equipos e
JOIN tipo_equipos te ON te.id = e.tipo_equipo_id
WHERE e.deleted_at IS NULL;
```
- **Dimensiones:** Tipo equipo ✅ | Equipo específico ✅ | Marca ✅
- **Visualización:** **Bubble chart** (X = edad meses, Y = fallas, tamaño = 1, color = modelo). Bubble chart muestra relación edad-fallas con agrupación visual por modelo.
- **Decisión habilitada:** Política de reemplazo basada en edad + fallas acumuladas.

---

### KPI-24: Throughput del Sistema (préstamos/día)
**Impacto: 🟢 MEDIO**

- **Definición:** Cantidad de préstamos procesados por día (aprobados + rechazados), con media móvil.
- **Fórmula:**
```sql
SELECT DATE(p.created_at) AS dia, COUNT(*) AS throughput
FROM prestamos p
WHERE p.created_at BETWEEN :start AND :end
GROUP BY dia ORDER BY dia;
```
- **Dimensiones:** Fecha ✅ | Tipo equipo ✅
- **Visualización:** **Área con media móvil 7d**. Área muestra volumen diario y la media móvil revela la tendencia subyacente.
- **Decisión habilitada:** Dimensionar personal administrativo; detectar picos operativos.

---

### KPI-25: Análisis de Cohortes por Semestre de Ingreso
**Impacto: 🟢 BAJO**

- **Definición:** Comportamiento de préstamos por cohorte (grupo de alumnos que ingresó el mismo año), a lo largo del tiempo.
- **Fórmula:**
```sql
SELECT 
    YEAR(u.created_at) AS cohorte,
    DATE_FORMAT(p.created_at, '%Y-%m') AS periodo,
    COUNT(*) AS prestamos
FROM prestamos p
JOIN users u ON u.idUser = p.idUser
WHERE p.created_at BETWEEN :start AND :end
GROUP BY cohorte, periodo;
```
- **Dimensiones:** Cohorte (año ingreso) ✅ | Periodo ✅
- **Visualización:** **Líneas por cohorte** (cada línea = cohorte, X = meses desde ingreso). Líneas de cohorte muestran si los patrones de uso cambian entre generaciones.
- **Decisión habilitada:** ¿Las cohortes nuevas usan más o menos equipos? Proyectar demanda futura.

---

### KPI-26: Equipos "Huérfanos" (sin uso en N meses)
**Impacto: 🟢 BAJO**

- **Definición:** Equipos activos que no han sido prestados en los últimos N meses.
- **Fórmula:**
```sql
SELECT e.id, e.codigo, te.nombre AS modelo, e.estado, e.created_at,
    MAX(p.fecha_inicio) AS ultimo_prestamo,
    DATEDIFF(CURDATE(), MAX(p.fecha_inicio)) AS dias_sin_uso
FROM equipos e
JOIN tipo_equipos te ON te.id = e.tipo_equipo_id
LEFT JOIN prestamo_equipo pe ON pe.idEquipo = e.id
LEFT JOIN prestamos p ON p.idPrestamo = pe.idPrestamo
WHERE e.deleted_at IS NULL
AND e.estado NOT IN ('DADO_DE_BAJA','MANTENIMIENTO')
GROUP BY e.id, e.codigo, te.nombre, e.estado, e.created_at
HAVING dias_sin_uso > 90 OR ultimo_prestamo IS NULL
ORDER BY dias_sin_uso DESC;
```
- **Dimensiones:** Tipo equipo ✅ | Equipo específico ✅ | Umbral días ✅
- **Alertas:** Sin uso > 90 días → candidato a redistribución; > 180 → candidato a baja
- **Visualización:** **Tabla con semáforo** (verde/amarillo/rojo por días sin uso).
- **Decisión habilitada:** Redistribuir o dar de baja equipos ociosos.

---

### KPI-27: Tasa de Extensiones por Modelo
**Impacto: 🟢 BAJO**

- **Definición:** % de préstamos que requirieron extensión por tipo de equipo.
- **Fórmula:**
```sql
SELECT te.nombre AS modelo,
    COUNT(DISTINCT p.idPrestamo) AS total_prestamos,
    COUNT(DISTINCT CASE WHEN o.tipo = 'EXTENSION' THEN p.idPrestamo END) AS con_extension,
    ROUND(con_extension * 100.0 / NULLIF(total_prestamos, 0), 1) AS tasa_extension
FROM prestamos p
JOIN prestamo_equipo pe ON pe.idPrestamo = p.idPrestamo
JOIN equipos e ON e.id = pe.idEquipo
JOIN tipo_equipos te ON te.id = e.tipo_equipo_id
LEFT JOIN observaciones o ON o.idPrestamo = p.idPrestamo
WHERE p.fecha_inicio BETWEEN :start AND :end
GROUP BY te.nombre;
```
- **Dimensiones:** Fecha ✅ | Tipo equipo ✅ | Interno/externo ✅
- **Visualización:** **Barras horizontales**. Barras para ranking claro de qué modelos generan más extensiones.
- **Decisión habilitada:** Modelos con alta tasa de extensión → ajustar plazo por defecto.

---

### KPI-28: Sanciones por Tipo de Equipo
**Impacto: 🟢 BAJO**

- **Definición:** ¿Qué tipos de equipo están asociados a más sanciones (por daño, atraso, etc.)?
- **Fórmula:**
```sql
SELECT te.nombre AS modelo,
    COUNT(DISTINCT us.id) AS sanciones
FROM user_sancion us
JOIN users u ON u.idUser = us.idUser
JOIN prestamos p ON p.idUser = u.idUser
    AND p.created_at BETWEEN us.created_at - INTERVAL 7 DAY AND us.created_at + INTERVAL 1 DAY
JOIN prestamo_equipo pe ON pe.idPrestamo = p.idPrestamo
JOIN equipos e ON e.id = pe.idEquipo
JOIN tipo_equipos te ON te.id = e.tipo_equipo_id
GROUP BY te.nombre
ORDER BY sanciones DESC;
```
- **Dimensiones:** Fecha ✅ | Tipo equipo ✅ | Nivel sanción ✅
- **Visualización:** **Barras apiladas** (segmentos = nivel de sanción por modelo).
- **Decisión habilitada:** Equipos "frágiles" que requieren mejor embalaje/instrucciones o restricciones de préstamo.

---

### KPI-29: Comparación YoY/SoS (Year-over-Year / Semester-over-Semester)
**Impacto: 🟢 BAJO**

- **Definición:** Para cada KPI principal, variación porcentual vs mismo periodo del año/semestre anterior.
- **Fórmula:**
```
variacion% = (valor_actual - valor_periodo_anterior) / valor_periodo_anterior × 100
```
- **Dimensiones:** Periodo (automático: mes, semestre, año) ✅ | Tipo equipo ✅
- **Visualización:** **Tarjetas KPI con flecha de tendencia** (↑↓ con color verde/rojo). Tarjetas KPI con sparkline son el estándar para variación.
- **Decisión habilitada:** Detectar si la situación mejora o empeora periodo a periodo.

---

### KPI-30: Índice de Salud del Inventario (composite)
**Impacto: 🟢 BAJO**

- **Definición:** Score global 0-100 que resume el estado de salud del inventario combinando: disponibilidad, MTBF promedio, fill rate, equipos huérfanos.
- **Fórmula:**
```
Salud = (0.30 × uptime%)
      + (0.25 × fill_rate%)
      + (0.25 × (1 - % equipos_huerfanos))
      + (0.20 × (MTBF_norm))
```
- **Dimensiones:** Global o por categoría
- **Alertas:** < 60 → estado crítico; < 75 → atención; > 85 → saludable
- **Visualización:** **Gauge** semi-circular. Gauge es intuitivo para estado de salud general.
- **Decisión habilitada:** KPI ejecutivo de nivel directivo para presupuesto.

---

## D) ANALÍTICA AVANZADA (Aplicable a la BD existente)

### D.1) Tendencias y Estacionalidad

**Datos necesarios:** `prestamos.fecha_inicio`, `prestamo_equipo`, `tipo_equipos`  
**Método:** Descomposición estacional multiplicativa:
1. Calcular demanda mensual por tipo equipo (últimos 24 meses)
2. Calcular media móvil centrada de 12 meses (tendencia)
3. Índice estacional = demanda_real / tendencia
4. Promediando los índices del mismo mes → patrón estacional recurrente

**Cálculo simplificado (PHP):**
```php
// Para cada tipo_equipo:
// 1. Query: COUNT(*) GROUP BY YEAR-MONTH → array $demanda[mes]
// 2. Media móvil 12: $trend[m] = avg($demanda[m-6..m+5])
// 3. Estacionalidad: $seasonal[m] = $demanda[m] / $trend[m]
// 4. Factor mensual: avg($seasonal[enero_2025], $seasonal[enero_2026])
```

**Visualización:** Línea con 3 series: Original, Tendencia, Estacionalidad  
**Uso:** Planificar compras antes de picos estacionales; redistribuir en valles.

---

### D.2) Pronóstico de Demanda (Simple Exponential Smoothing)

**Datos necesarios:** Serie temporal de demanda mensual (>= 12 datos)  
**Método:** Suavizado exponencial simple (α = 0.3) o Holt-Winters si hay estacionalidad:
```
F(t+1) = α × Y(t) + (1-α) × F(t)
```
**Para Holt-Winters (ya implementado parcialmente en DemandAnalyticsService):**
- Nivel: L(t)
- Tendencia: T(t) 
- Estacionalidad: S(t)

**Visualización:** Línea con banda de confianza (±1.96σ para 95% CI)  
**Uso:** Proyectar demanda a 3-6 meses y dimensionar compras.

---

### D.3) Detección de Anomalías

**Datos necesarios:** Serie temporal de cualquier KPI  
**Método:** Control estadístico de procesos (SPC):
1. Calcular media y desviación estándar de la serie
2. Límites de control: μ ± 2σ (warning) y μ ± 3σ (alarm)
3. Reglas de Western Electric para patrones:
   - 1 punto fuera de 3σ → anomalía
   - 2 de 3 puntos fuera de 2σ → tendencia
   - 7 puntos consecutivos del mismo lado de μ → shift

**Aplicar a:**
- Demanda diaria por tipo equipo
- Mantenimientos mensuales
- Rechazos por stock semanales
- Throughput diario

**Visualización:** Gráfico de control (líneas + límites sombreados)  
**Uso:** Sistema de alertas automáticas cuando un KPI sale de control.

---

### D.4) Pareto 80/20

**Aplicar a:**
1. **Uso:** 20% de los modelos genera 80% de los préstamos
2. **Fallas:** 20% de los modelos genera 80% de los mantenimientos  
3. **Rechazos:** 20% de los modelos genera 80% de los rechazos por stock
4. **Sanciones:** 20% de los usuarios genera 80% de las sanciones

**Visualización:** Diagrama de Pareto (barras descendentes + línea acumulada)  
**Uso:** Focalizar recursos en el 20% que más impacta.

---

### D.5) Segmentación ABC de Equipos

**Método:** Clasificar modelos en 3 categorías:
- **A (70% del uso):** Modelos críticos, alta rotación → nunca deben faltar
- **B (20% del uso):** Modelos intermedios → stock normal
- **C (10% del uso):** Modelos de bajo uso → candidatos a redistribución/baja

**Cálculo:**
```sql
WITH uso AS (
    SELECT te.id, te.nombre, COUNT(*) AS prestamos
    FROM prestamos p
    JOIN prestamo_equipo pe ON pe.idPrestamo = p.idPrestamo
    JOIN equipos e ON e.id = pe.idEquipo
    JOIN tipo_equipos te ON te.id = e.tipo_equipo_id
    WHERE p.fecha_inicio >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
    GROUP BY te.id, te.nombre
),
ranked AS (
    SELECT *, SUM(prestamos) OVER (ORDER BY prestamos DESC) AS cumulative,
           SUM(prestamos) OVER () AS grand_total
    FROM uso
)
SELECT *, 
    CASE 
        WHEN cumulative <= grand_total * 0.7 THEN 'A'
        WHEN cumulative <= grand_total * 0.9 THEN 'B'
        ELSE 'C'
    END AS clase_abc
FROM ranked;
```

**Visualización:** Barras coloreadas por clase (A=rojo, B=amarillo, C=verde) + línea Pareto  
**Uso:** Políticas de stock diferenciadas por clase.

---

### D.6) Score Compuesto de Prioridad de Compra (detallado)

Ya definido en KPI-08. **Adicional: Tabla de recomendaciones automáticas:**

| Modelo | Score | Stock | Pico Demanda | Comprar | Urgencia |
|--------|-------|-------|--------------|---------|----------|
| Calculado dinámicamente desde la BD |

---

### D.7) Score de Riesgo de Falla por Equipo

Ya definido en KPI-18. **Adicional: Ranking ordenado para planificar mantenimiento preventivo.**

---

## E) MÓDULO "CUELLO DE BOTELLA" (Capacidad vs Demanda)

### E.1) Filtros Obligatorios
- Fecha/periodo (from, to, granularity: day/week/month/semester)
- Tipo de equipo (dropdown categories → tipo_equipos)
- Modelo/marca (específico)
- Asignatura (vía bloque_prestamos → asignaturas)
- Carrera (vía persona.carrera)
- Interno/externo (DENTRO/FUERA)

### E.2) Métricas del Módulo

#### E.2.1 % Demanda Satisfecha vs Rechazada
```sql
SELECT 
    DATE_FORMAT(p.fecha_inicio, :format) AS periodo,
    te.nombre AS modelo,
    COUNT(DISTINCT CASE WHEN p.estado NOT IN ('RECHAZADO') THEN p.idPrestamo END) AS satisfecha,
    COUNT(DISTINCT CASE WHEN p.estado = 'RECHAZADO' THEN p.idPrestamo END) AS rechazada,
    COUNT(DISTINCT p.idPrestamo) AS total,
    ROUND(satisfecha * 100.0 / NULLIF(total, 0), 1) AS pct_satisfecha
FROM prestamos p
JOIN prestamo_equipo pe ON pe.idPrestamo = p.idPrestamo
JOIN equipos e ON e.id = pe.idEquipo
JOIN tipo_equipos te ON te.id = e.tipo_equipo_id
WHERE p.fecha_inicio BETWEEN :start AND :end
GROUP BY periodo, te.nombre;
```
**Visualización:** Barras apiladas (verde = satisfecha, rojo = rechazada) por periodo.

#### E.2.2 Rechazos por Motivo
```sql
-- Usa prestamo_historial con LIKE '%motivo%' (ya implementado en StockoutAnalyticsService)
-- Desglosar: SIN_STOCK | CONFLICTO_HORARIO | SANCION_USUARIO | LIMITE_PRESTAMOS | OTRO
-- Agregar filtro por tipo_equipo
```
**Visualización:** Dona/pie por motivo + evolución en barras apiladas.

#### E.2.3 Ratio Capacidad vs Demanda
```
ratio = stock_operativo / demanda_equipos_distintos
-- ratio > 1.2 → holgura
-- ratio 1.0-1.2 → ajustado
-- ratio < 1.0 → déficit (cuello de botella)
```
**Visualización:** Línea temporal del ratio + zona sombreada (verde > 1.2, amarillo 1.0-1.2, rojo < 1.0).

#### E.2.4 Recomendación de Unidades a Comprar/Reasignar
```
comprar = CEIL(demanda_pico * factor_seguridad) - stock_operativo
-- factor_seguridad = 1.2 (parámetro configurable)
-- Si comprar < 0 → "stock suficiente"
-- Si comprar > 0 → "comprar N unidades de [modelo]"
```
**Visualización:** Tabla accionable con columnas: Modelo | Stock Actual | Pico Demanda | Déficit | Comprar | Urgencia(score)

### E.3) Datos Faltantes para el Módulo

| Dato Faltante | Impacto | Propuesta |
|---------------|---------|-----------|
| `motivo_rechazo` como campo en prestamos o prestamo_historial (limpio) | Alto | Ya se usa `descripcion LIKE '%SIN_STOCK%'` → formalizar con campo ENUM `motivo_rechazo` en `prestamo_historial` |
| Cruce rechazo → tipo_equipo solicitado (antes de asignar equipo) | Alto | En préstamos rechazados puede no haber prestamo_equipo → **crear campo `tipo_equipo_solicitado_id` en prestamos** o guardar en historial |
| Demanda por asignatura en rechazos | Medio | El bloque_prestamos puede existir incluso en rechazados → verificar si se crea antes del rechazo |

---

## F) MEJORAS AL MODELO DE DATOS

| # | Campo/Tabla | Dónde se Captura | Por Qué Importa | Impacto en Reportes |
|---|------------|------------------|------------------|---------------------|
| F1 | `prestamos.motivo_rechazo_id` (FK a motivos_rechazo) | En `PrestamoAdminController@rechazar` al rechazar | Clasificación limpia de rechazos sin parsear strings | Pareto de rechazos, fill rate por motivo, módulo cuello de botella |
| F2 | `prestamo_historial.motivo_rechazo` (ENUM) | Ya en `descripcion` pero como texto libre | Queries directas sin LIKE | Todos los KPIs de rechazo |
| F3 | `prestamos.tipo_equipo_solicitado_id` o tabla `prestamo_solicitud_equipos` | Al momento de crear solicitud (store) | En rechazados no hay prestamo_equipo → pérdida de info de demanda | Demanda insatisfecha real por modelo |
| F4 | `equipos.fecha_adquisicion` (DATE) | Al registrar equipo (Admin) | Antigüedad precisa (no usar created_at) | MTBF, score de riesgo, vida útil |
| F5 | `equipos.costo_adquisicion` (DECIMAL) | Al registrar equipo (Admin) | Cálculo de ROI, costo de downtime | Análisis costo-beneficio reparar vs reemplazar |
| F6 | `tipo_equipos.vida_util_meses` (INT) | Configuración del tipo equipo | Determinar cuándo un equipo está "viejo" | Score de riesgo, planificación de reemplazo |
| F7 | `equipo_estado_eventos.duracion_estimada_horas` (INT nullable) | Al enviar a mantenimiento | Proyectar MTTR antes de que termine | Planificación de disponibilidad |
| F8 | `prestamos.semestre_id` (FK a semestres) | Auto-detectable por fecha o asignado por admin | Agrupación por semestre sin cálculos de fecha | Comparaciones semestrales directas |

---

## G) PLAN DE IMPLEMENTACIÓN POR FASES

### FASE 1 — Semanas 1-2: KPIs con Data Existente (Quick Wins)

| Prioridad | KPI | Dependencia |
|-----------|-----|-------------|
| 🔴 P1 | KPI-04: Fill Rate por Tipo Equipo | Ninguna (data existe) |
| 🔴 P1 | KPI-03: Tasa de Rotación | Ninguna |
| 🔴 P1 | KPI-10: Tasa de Atraso por Tipo Equipo | Ninguna |
| 🔴 P1 | KPI-16: Pareto de Rechazos por Motivo | Ninguna (usa `prestamo_historial.descripcion`) |
| 🔴 P1 | KPI-24: Throughput del sistema | Ninguna |
| 🟡 P2 | KPI-12: Heatmap Bloque × Día × Tipo Equipo | Añadir filtro tipo_equipo al heatmap existente |
| 🟡 P2 | KPI-26: Equipos huérfanos | Ninguna |
| 🟡 P2 | KPI-22: Ratio interno/externo por modelo | Ninguna |
| 🟡 P2 | KPI-27: Tasa de extensiones | Ninguna |
| 🟡 P2 | KPI-29: Comparación YoY/SoS | Extender KPIs existentes |

**Entregables Fase 1:**
- 10 nuevos endpoints en `ReportesController` o services existentes
- Filtros: from/to, tipo_equipo y interno/externo en todos
- Gráficos: Pareto, heatmap mejorado, barras+línea, tablas semáforo

---

### FASE 2 — Semanas 3-6: Joins Avanzados y Gráficos Nuevos

| Prioridad | KPI | Dependencia |
|-----------|-----|-------------|
| 🔴 P1 | KPI-01: MTBF | Requires `equipo_estado_eventos` parsing (ya existe) |
| 🔴 P1 | KPI-02: MTTR | Idem |
| 🔴 P1 | KPI-06: Uptime % | Idem |
| 🔴 P1 | KPI-05: Demanda insatisfecha Asignatura × Tipo Equipo | Requiere verificar bloque_prestamos en rechazados |
| 🔴 P1 | KPI-17: Ratio Capacidad vs Demanda | Extensión de demandaVsDisponibilidad |
| 🟡 P2 | KPI-07: Índice Estacional | Cálculo en PHP sobre data existente |
| 🟡 P2 | KPI-13: Incumplimiento por carrera | Campo `persona.carrera` (ya existe) |
| 🟡 P2 | KPI-19: Carrera × Tipo Equipo | Idem |
| 🟡 P2 | KPI-20: Tendencia mantenimientos con MA | Extensión servicio existente |
| 🟡 P2 | KPI-21: Pico demanda por bloque | Join bloque_prestamos + prestamo_equipo |
| 🟡 P2 | KPI-11: Boxplot duración por modelo | Ya parcialmente existe |
| 🟢 P3 | KPI-25: Cohortes por semestre | Join users.created_at |
| 🟢 P3 | KPI-28: Sanciones por tipo equipo | Join temporal aproximado |
| 🟢 P3 | Módulo Cuello de Botella (completo) | Requiere F1, F3 para precisión |

**Entregables Fase 2:**
- Migración: `prestamos.motivo_rechazo` (ENUM) — F1/F2
- 15 nuevos endpoints  
- Gráficos: boxplot, bubble, treemap, barras apiladas 100%, curva Lorenz
- Módulo Cuello de Botella v1

---

### FASE 3 — Semanas 7-12: Scoring, Pronóstico y Alertas

| Prioridad | KPI | Dependencia |
|-----------|-----|-------------|
| 🔴 P1 | KPI-08: Score Prioridad de Compra (mejorado) | MTBF, MTTR, fill rate → Fase 2 |
| 🔴 P1 | KPI-09: Recomendación unidades a comprar | Score + pico demanda |
| 🔴 P1 | KPI-18: Score riesgo falla por equipo | MTBF equipo, edad, fallas |
| 🔴 P1 | D.2: Pronóstico de demanda (Holt-Winters) | >= 12 meses de data |
| 🟡 P2 | D.3: Detección de anomalías (SPC) | Serie temporal >= 6 meses |
| 🟡 P2 | D.5: Segmentación ABC | Data de uso 12 meses |
| 🟡 P2 | KPI-14: Índice Gini de concentración | Data de uso por equipo |
| 🟡 P2 | KPI-30: Índice Salud del Inventario | Uptime, fill rate, huérfanos, MTBF |
| 🟢 P3 | D.1: Descomposición estacional formal | 24+ meses de data |
| 🟢 P3 | Alertas automáticas por email/notificación | Jobs de Laravel + umbrales configurables |

**Entregables Fase 3:**
- Migraciones: F4 (fecha_adquisicion), F5 (costo), F6 (vida_util)
- Service: `AnalyticsAdvancedService` con scoring, forecast, anomalías
- Sistema de alertas con `SendGenericEmailJob` (ya existe) para umbrales críticos
- Dashboard ejecutivo consolidado con todos los gauges y scores

---

### Diagrama de Dependencias

```
Fase 1 (data existente)
├── Fill Rate ──────────────────┐
├── Rotación ─────────────────┐ │
├── Pareto Rechazos ──────────┤ ├── Fase 3: Score Compra
├── Throughput ────────────────┤ │
└── Heatmap bloque+tipo ──────┘ │
                                 │
Fase 2 (joins avanzados)        │
├── MTBF ──────────────────────┤
├── MTTR ──────────────────────┤
├── Uptime% ───────────────────┤
├── Módulo Cuello Botella ─────┤
├── Estacionalidad ────────────┼── Fase 3: Pronóstico
├── Demanda × Asignatura ──────┘
└── Carrera × Tipo Equipo
```

---

## H) RESUMEN EJECUTIVO

### Inventario de lo que ya tienen (y es valioso):
- **62+ métricas/endpoints** ya implementados
- Filtros from/to en ~70% de los servicios
- Score de prioridad de compra inicial (EstadisticasModeloService)
- Demanda insatisfecha con StockoutAnalyticsService  
- Heatmap, Sankey, Forecast ya disponibles en DemandAnalyticsService

### Lo que falta (critical gaps):
1. **MTBF / MTTR** → No se calculan. Datos existen en `equipo_estado_eventos`
2. **Fill Rate por tipo equipo** → Query simple pero no existe como endpoint
3. **Cruce asignatura × tipo equipo en rechazos** → Pregunta de negocio no respondida
4. **Recomendación automática de unidades a comprar** → Score existe pero no genera número concreto
5. **Filtro tipo_equipo faltante** en profesores, asignaturas, sanciones  
6. **Comparaciones YoY/SoS** en la mayoría de KPIs
7. **Campo `motivo_rechazo` limpio** (no basado en LIKE de strings)

### ROI esperado de la implementación:
- **Fase 1 (2 sem):** +40% cobertura de preguntas de negocio con data ya disponible
- **Fase 2 (4 sem):** +30% adicional con mantenimiento predictivo (MTBF/MTTR) y módulo cuello botella  
- **Fase 3 (6 sem):** Capacidad de pronóstico y alertas automáticas → decisiones proactivas vs reactivas

### Tipos de gráfico utilizados (sin repetir por comodidad):

| Tipo | KPIs que lo usan | Justificación |
|------|-----------------|---------------|
| Boxplot | KPI-01 (MTBF), KPI-11 (duración) | Distribución + outliers |
| Pareto | KPI-10 (atrasos), KPI-16 (rechazos) | Priorización 80/20 |
| Heatmap | KPI-05 (asig×tipo), KPI-12 (bloque×día), KPI-21 (pico×bloque) | Patrones bidimensionales |
| Scatter/Bubble | KPI-18 (riesgo), KPI-23 (antigüedad) | Relación multivariable |
| Barras apiladas 100% | KPI-06 (uptime), KPI-22 (int/ext) | Composición proporcional |
| Barras + línea | KPI-03 (rotación), KPI-17 (cap vs demanda) | Valor + referencia |
| Línea + área | KPI-07 (estacionalidad), KPI-24 (throughput) | Tendencia temporal |
| Treemap | KPI-19 (carrera×tipo) | Composición jerárquica |
| Gauge | KPI-04 (fill rate), KPI-30 (salud) | Estado vs objetivo |
| Radar | KPI-08 (score compra) | Desglose multidimensional |
| Barras horizontales | KPI-02 (MTTR), KPI-13 (carrera) | Rankings con labels largos |
| Histograma | KPI-15 (cycle time) | Distribución continua |
| Líneas cohorte | KPI-25 (cohortes) | Comparación temporal entre grupos |
| Tabla semáforo | KPI-26 (huérfanos), KPI-09 (comprar) | Acción directa |
| Control chart | D.3 (anomalías) | Límites estadísticos |
| Lorenz | KPI-14 (Gini) | Concentración |

---

*Documento generado como propuesta integral. Cada métrica es implementable con la BD actual o con las mejoras mínimas señaladas en la sección F.*
