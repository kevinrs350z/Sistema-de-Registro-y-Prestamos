# Análisis Técnico y Normativo del Sistema de Sanciones
## Sistema de Préstamo de Equipos Académicos — Universidad de Tarapacá

**Fecha:** 2026-03-03  
**Tipo:** Análisis exhaustivo (arquitectura + normativa + base de datos + métricas)  
**Alcance:** Auditoría completa del subsistema de sanciones existente + propuesta de reglamento formal

---

## ÍNDICE

1. [Diagnóstico del Estado Actual](#1-diagnóstico-del-estado-actual)
2. [Hallazgos Críticos y Problemas Detectados](#2-hallazgos-críticos-y-problemas-detectados)
3. [Estados Formales de Sanción (Propuesta de Enums)](#3-estados-formales-de-sanción)
4. [Modelo de Base de Datos (Modelo Lógico Propuesto)](#4-modelo-de-base-de-datos)
5. [Lógica de Escalamiento Automático](#5-lógica-de-escalamiento-automático)
6. [Variables para Reportes y Dashboard](#6-variables-para-reportes-y-dashboard)
7. [Reglamento de Sanciones (Propuesta Institucional)](#7-reglamento-de-sanciones)
8. [Plan de Migración desde el Estado Actual](#8-plan-de-migración)
9. [Anexos Técnicos](#9-anexos-técnicos)

---

## 1. Diagnóstico del Estado Actual

### 1.1 Arquitectura Existente

```
┌─────────────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│   sancions          │────▶│  user_sancion (pivot) │◀────│   users             │
│ idSancion (PK)      │     │ id (PK)               │     │ idUser (PK)         │
│ nivel               │     │ idUser FK→users        │     │ estadoSancion       │
│ descripcion         │     │ idSancion FK→sancions  │     │ bloqueado (bool)    │
│ estado (ACTIVA/     │     │ assigned_by FK→users   │     │ bloqueado_motivo    │
│         EXPIRADA)   │     │ prestamo_id FK→prestamo│     │ bloqueado_fecha     │
│ fecha_inicio        │     │ descripcion            │     │ bloqueado_por       │
│ fecha_fin           │     │ accion                 │     └─────────────────────┘
│ created_at          │     │ created_at/updated_at  │
│ updated_at          │     └──────────────────────┘
└─────────────────────┘
```

### 1.2 Flujos Actuales Implementados

| Flujo | Endpoint | Estado |
|-------|----------|--------|
| Asignar sanción (admin) | `POST /admin/sanciones/asignar` | ✅ Funcional |
| Ampliar sanción (+7 días) | `PATCH /admin/sanciones/{id}/ampliar` | ✅ Funcional |
| Quitar sanción (EXPIRADA) | `PATCH /admin/sanciones/{id}/quitar` | ✅ Funcional |
| Ver mis sanciones (alumno) | `GET /sanciones/mis` | ✅ Funcional |
| Listar todas (admin) | `GET /admin/sanciones` | ✅ Funcional |
| Bloquear usuario | `PATCH /admin/alumnos/{id}/bloquear` | ✅ Funcional |
| Reportes KPIs | `GET /reportes/sanciones/kpis` | ✅ Funcional |
| **Escalamiento automático** | — | ❌ No existe |
| **Apelación** | — | ❌ No existe |
| **Revisión comité** | — | ❌ No existe |
| **Expiración automática** | — | ❌ No existe |

### 1.3 Datos Semilla Actuales

La tabla `sancions` funciona como **catálogo de plantillas** (5 registros fijos), no como tabla de sanciones individuales. La tabla pivote `user_sancion` almacena las asignaciones reales. Este diseño presenta una **limitación fundamental**: una misma fila de `sancions` se reutiliza para múltiples usuarios, lo cual impide tener fechas, estados y resoluciones individuales por sanción.

---

## 2. Hallazgos Críticos y Problemas Detectados

### 🔴 CRÍTICOS (Bloqueantes para sistema en producción)

| # | Hallazgo | Impacto | Archivo afectado |
|---|----------|---------|-------------------|
| C1 | **No existe nivel GRAVÍSIMA** | Las reglas de escalamiento (2 graves → 1 gravísima) no pueden implementarse. El catálogo solo tiene LEVE/MEDIA/GRAVE. | `SancionSeeder.php`, `catalogo()` |
| C2 | **No hay escalamiento automático** | Las reglas 3L→1M, 2M→1G, 2G→1GR son declarativas pero no están programadas. El admin debe hacer todo manualmente sin respaldo normativo en el sistema. | `UserSancionController.php` |
| C3 | **Tabla `sancions` es catálogo, no registro individual** | Una sanción LEVE tiene un solo `idSancion` compartido por todos los usuarios. Si se cambia `estado` a EXPIRADA, afecta a TODOS los usuarios vinculados. | `Sancion.php`, migrations |
| C4 | **`ampliarSancion()` modifica la fila compartida** | Al ampliar +7 días, se cambia `fecha_fin` en la tabla catálogo, afectando a todos los usuarios asignados a esa sanción. | `UserSancionController@ampliarSancion` |
| C5 | **`quitarSancion()` marca EXPIRADA el catálogo** | Mismo problema: desactivar una sanción para un usuario la desactiva para todos. | `UserSancionController@quitarSancion` |
| C6 | **No hay expiración automática** | Las sanciones con `fecha_fin` pasada siguen como ACTIVA hasta intervención manual. No hay cron/scheduler que las expire. | Sin implementar |

### 🟠 IMPORTANTES (Afectan trazabilidad y auditoría)

| # | Hallazgo | Impacto |
|---|----------|---------|
| I1 | **Solo 2 estados: ACTIVA/EXPIRADA** | No hay forma de representar sanciones pendientes de resolución, apeladas, anuladas por comité, o en proceso de escalamiento. |
| I2 | **No hay `categoria_falta`** | No se puede clasificar la infracción (daño, retraso, pérdida, mal uso, etc.). Los reportes no pueden segmentar por tipo de falta. |
| I3 | **Campo `accion` en pivot es VARCHAR(30) libre** | Sin enum ni validación. Puede contener cualquier texto, rompiendo consistencia en reportes. |
| I4 | **`estadoSancion` en tabla `users` es redundante y peligroso** | Es un campo de texto libre sin sincronización automática. Puede desincronizarse de la tabla de sanciones real. |
| I5 | **Bloqueo desconectado de sanciones** | Los campos `bloqueado*` en `users` operan de forma independiente de las sanciones. Un usuario puede estar bloqueado sin sanción o sancionado sin bloqueo. |
| I6 | **Sin ventana temporal para reincidencia** | No se define si las 3 leves → 1 media deben ocurrir en un semestre, un año, o acumularse indefinidamente. |
| I7 | **Sin relación con tipo de equipo dañado** | La sanción se vincula a `prestamo_id` pero no registra qué equipo específico sufrió el daño. |
| I8 | **`SancionController.php` vacío** | Controlador scaffold sin implementación — código muerto que genera confusión. |

### 🟡 MEJORAS RECOMENDADAS

| # | Hallazgo | Mejor práctica |
|---|----------|----------------|
| M1 | **Reportes no segmentan por asignatura/bloque** | Agregar relación sanción→asignatura para análisis académico. |
| M2 | **No hay proceso de apelación documentado** | El alumno no puede apelar dentro del sistema. |
| M3 | **Ampliación fija de 7 días** | Debería ser configurable o proporcional al nivel. |
| M4 | **No hay notificación de próxima expiración** | El alumno no sabe cuándo termina su sanción excepto revisando manualmente. |
| M5 | **Sin auditoría de cambios de estado** | No queda registro de quién cambió qué y cuándo en la sanción (solo `assigned_by` inicial). |

---

## 3. Estados Formales de Sanción

### 3.1 Enum `NivelSancion`

```
LEVE        → Amonestación / restricción temporal corta
MEDIA       → Suspensión parcial de préstamos
GRAVE       → Suspensión total + intervención comité
GRAVISIMA   → Bloqueo indefinido + derivación institucional
```

| Nivel | Duración base | Efecto en sistema | Requiere comité |
|-------|---------------|-------------------|-----------------|
| LEVE | 3-7 días | Notificación + registro | No |
| MEDIA | 7-15 días | Suspensión de préstamos nuevos | No |
| GRAVE | 15-30 días | Suspensión total + alerta admin | Sí (ratificación) |
| GRAVÍSIMA | 30-90 días o indefinida | Bloqueo total + derivación decanato | Sí (obligatoria) |

**Justificación de GRAVÍSIMA:** Sin este nivel, las dos graves acumuladas no tienen destino de escalamiento. La regla "2G → 1GR" queda sin objeto. Además, permite escalar a instancias superiores (decanato/dirección académica) sin salir del sistema.

### 3.2 Enum `EstadoSancion`

```
PENDIENTE          → Creada pero no notificada / en espera de validación
ACTIVA             → Vigente y en cumplimiento
CUMPLIDA           → Período terminó y usuario cumplió condiciones
ESCALADA           → Generó o fue generada por escalamiento automático
APELADA            → Alumno presentó apelación formal
EN_REVISION_COMITE → Comité académico está evaluando el caso
ANULADA            → Revocada por comité o por error administrativo
EXPIRADA           → Venció por fecha sin intervención
```

**Justificación por estado:**

| Estado | ¿Por qué es necesario? |
|--------|----------------------|
| `PENDIENTE` | Permite crear la sanción sin activarla inmediatamente (buffer para revisión administrativa o espera de documentación). Evita sanciones "instantáneas" sin revisión. |
| `ACTIVA` | Estado operativo principal. El sistema verifica este estado para bloquear nuevos préstamos. Es el estado que realmente restringe al usuario. |
| `CUMPLIDA` | Diferencia crucial: el usuario completó el período correctamente. Distinto de EXPIRADA (que venció sola) o ANULADA (que fue error). Permite calcular tasa de cumplimiento real. |
| `ESCALADA` | Trazabilidad de escalamiento automático. Sin esto, no se puede diferenciar una MEDIA asignada directamente de una MEDIA generada por acumular 3 leves. Fundamental para auditoría. |
| `APELADA` | El reglamento debe contemplar derecho de apelación. Este estado "congela" la sanción mientras se resuelve. Sin él, la sanción sigue activa durante la apelación (injusto) o hay que anularla y recrearla (pérdida de trazabilidad). |
| `EN_REVISION_COMITE` | Las sanciones GRAVE y GRAVÍSIMA requieren ratificación de comité según normativa universitaria estándar. Este estado indica que la sanción está pendiente de decisión colegiada. |
| `ANULADA` | Revoca formalmente la sanción. Diferente de "quitarla" (actual EXPIRADA). Anular implica que fue un error o el comité la revocó. Mantiene el registro histórico pero sin efectos. |
| `EXPIRADA` | Venció por período de tiempo. No implica cumplimiento ni decisión administrativa. Es un estado terminal automático. |

### 3.3 Enum `CategoriaFalta`

```
RETRASO_DEVOLUCION       → No devolver equipo en fecha pactada
DAÑO_EQUIPO              → Devolver equipo dañado o deteriorado
PERDIDA_EQUIPO           → No devolver equipo (pérdida total)
MAL_USO                  → Uso indebido del equipo prestado
FALSIFICACION_DATOS      → Datos falsos en solicitud
PRESTAMO_TERCEROS        → Ceder equipo a persona no autorizada
REINCIDENCIA_ACUMULADA   → Generada automáticamente por escalamiento
INCUMPLIMIENTO_CONVENIO  → Violar condiciones especiales del préstamo
OTRO                     → Categoría residual (requiere descripción)
```

**Justificación:** Sin categorías, los reportes solo pueden decir "hubo 40 sanciones leves" pero no "hubo 25 por retraso y 15 por daño". Imposibilita análisis de causas raíz y toma de decisiones preventivas.

### 3.4 Enum `AccionSancion` (reemplazo del VARCHAR libre actual)

```
ASIGNACION       → Sanción asignada por primera vez
AMPLIACION       → Período extendido por administrador
REDUCCION        → Período reducido por buena conducta
ESCALAMIENTO     → Nivel incrementado automáticamente
APELACION        → Alumno apeló formalmente
RESOLUCION       → Comité o admin resolvió apelación
ANULACION        → Sanción revocada
BLOQUEO          → Se bloqueó el acceso del usuario
DESBLOQUEO       → Se restauró el acceso del usuario
EXPIRACION       → El sistema expiró automáticamente la sanción
```

---

## 4. Modelo de Base de Datos

### 4.1 Diagrama Entidad-Relación (Propuesto)

```
┌────────────────────────┐
│        users           │
│ idUser (PK)            │
│ ...                    │
│ indice_riesgo DECIMAL  │  ← calculado periódicamente
│ sanciones_acumuladas INT│
└───────┬────────────────┘
        │ 1:N
        ▼
┌────────────────────────────────────┐         ┌─────────────────────────┐
│        sanciones (NUEVA)           │         │   catalogo_sanciones    │
│ id BIGINT (PK)                     │    ←────│ id INT (PK)             │
│ usuario_id FK→users                │         │ nivel ENUM              │
│ catalogo_sancion_id FK→catalogo    │         │ nombre VARCHAR(100)     │
│ prestamo_id FK→prestamos NULLABLE  │         │ descripcion TEXT        │
│ equipo_id FK→equipos NULLABLE      │         │ duracion_base_dias INT  │
│ nivel ENUM(L/M/G/GR)              │         │ activo BOOLEAN          │
│ estado ENUM(8 estados)             │         └─────────────────────────┘
│ categoria_falta ENUM               │
│ descripcion TEXT                   │
│ fecha_inicio DATE                  │
│ fecha_fin DATE                     │
│ fecha_resolucion DATE NULLABLE     │
│ motivo TEXT                        │
│ resolucion_comite TEXT NULLABLE    │
│ comite_resuelto_por FK→users NULL  │
│ comite_fecha DATETIME NULLABLE     │
│ asignado_por FK→users              │
│ escalada_desde_id FK→sanciones NULL│  ← autoref: sanción que generó escalamiento
│ periodo_academico VARCHAR(10)      │  ← "2026-1", "2026-2"
│ ventana_inicio DATE                │  ← inicio ventana de reincidencia
│ ventana_fin DATE                   │  ← fin ventana de reincidencia
│ created_at TIMESTAMP               │
│ updated_at TIMESTAMP               │
│ deleted_at TIMESTAMP NULLABLE      │  ← soft delete para auditoría
└───────┬────────────────────────────┘
        │ 1:N
        ▼
┌────────────────────────────────────┐
│   historial_sancion                │
│ id BIGINT (PK)                     │
│ sancion_id FK→sanciones            │
│ accion ENUM(AccionSancion)         │
│ estado_anterior ENUM               │
│ estado_nuevo ENUM                  │
│ descripcion TEXT                   │
│ ejecutado_por FK→users             │  ← admin, sistema, comité
│ es_automatico BOOLEAN              │  ← TRUE si fue el sistema
│ metadata JSON NULLABLE             │  ← datos extra (días ampliados, etc)
│ created_at TIMESTAMP               │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│   apelaciones                      │
│ id BIGINT (PK)                     │
│ sancion_id FK→sanciones            │
│ usuario_id FK→users                │
│ motivo TEXT                        │
│ evidencia_url VARCHAR NULLABLE     │
│ estado ENUM(PENDIENTE/ACEPTADA/    │
│        RECHAZADA/EN_REVISION)      │
│ resolucion TEXT NULLABLE           │
│ resuelta_por FK→users NULLABLE     │
│ fecha_apelacion DATETIME           │
│ fecha_resolucion DATETIME NULLABLE │
│ created_at TIMESTAMP               │
│ updated_at TIMESTAMP               │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│   comite_revisiones                │
│ id BIGINT (PK)                     │
│ sancion_id FK→sanciones            │
│ apelacion_id FK→apelaciones NULL   │
│ miembros JSON                      │  ← [{user_id, nombre, cargo}]
│ acta TEXT NULLABLE                 │
│ decision ENUM(RATIFICAR/REDUCIR/   │
│         ANULAR/DERIVAR)            │
│ observaciones TEXT NULLABLE        │
│ fecha_sesion DATETIME              │
│ created_at TIMESTAMP               │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│   configuracion_sanciones          │
│ id INT (PK)                        │
│ clave VARCHAR(50) UNIQUE           │
│ valor VARCHAR(255)                 │
│ descripcion TEXT                   │
│ updated_at TIMESTAMP               │
│ updated_by FK→users                │
└────────────────────────────────────┘
```

### 4.2 Campos Clave y Justificación

#### Tabla `sanciones` (reemplaza `sancions` + `user_sancion`)

| Campo | Tipo | Justificación |
|-------|------|---------------|
| `id` | BIGINT PK | Cada sanción es un registro individual (no catálogo compartido) |
| `usuario_id` | FK→users | Relación directa 1:N — cada sanción pertenece a UN usuario |
| `catalogo_sancion_id` | FK→catalogo_sanciones NULL | Referencia opcional al catálogo (plantilla base). NULL si es personalizada |
| `prestamo_id` | FK→prestamos NULL | Vincula con el préstamo que originó la falta. NULL si es sanción administrativa directa |
| `equipo_id` | FK→equipos NULL | Equipo específico dañado/perdido. Permite reportes por equipo |
| `nivel` | ENUM | Copia del nivel al momento de asignación. No depende del catálogo |
| `estado` | ENUM(8) | Los 8 estados formales descritos en §3.2 |
| `categoria_falta` | ENUM | Tipo de infracción. Esencial para reportes de causas raíz |
| `descripcion` | TEXT | Detalle específico del incidente |
| `fecha_inicio` / `fecha_fin` | DATE | Periodo de vigencia. `fecha_fin` se usa para expiración automática |
| `fecha_resolucion` | DATE NULL | Cuándo se resolvió (comité, apelación, admin). Distinto de `fecha_fin` |
| `motivo` | TEXT | Razón formal de la sanción |
| `resolucion_comite` | TEXT NULL | Resolución formal del comité si aplica |
| `comite_resuelto_por` | FK NULL | Quién firmó la resolución |
| `asignado_por` | FK→users | Admin que creó la sanción. Auditoría obligatoria |
| `escalada_desde_id` | FK→sanciones NULL | Auto-referencia: si esta sanción fue generada por escalamiento, apunta a la última sanción que gatilló la regla |
| `periodo_academico` | VARCHAR(10) | "2026-1" — permite filtrar reincidencia por periodo |
| `ventana_inicio` / `ventana_fin` | DATE | Rango temporal para conteo de reincidencia |
| `deleted_at` | TIMESTAMP NULL | Soft delete: nunca borrar físicamente (auditoría institucional) |

#### Tabla `historial_sancion` (log inmutable de auditoría)

Cada cambio de estado, ampliación, reducción o acción sobre una sanción genera un registro. Es un **log append-only** — nunca se modifica ni se elimina. Esto permite:

- Reconstruir la historia completa de cualquier sanción
- Auditoría institucional
- Cálculo de métricas temporales (tiempo entre asignación y resolución)
- Evidencia ante apelaciones

#### Tabla `apelaciones`

Sin esta tabla, el alumno no tiene forma formal de apelar dentro del sistema. Actualmente la apelación sería verbal o por correo, sin trazabilidad. Con esta tabla:

- El alumno puede presentar su caso con evidencia
- El admin o comité tiene un flujo formal de resolución
- Queda registro de todo el proceso

#### Tabla `comite_revisiones`

Las sanciones GRAVE y GRAVÍSIMA deben ser revisadas por un comité (estándar en regulaciones universitarias). Esta tabla registra:

- Quiénes participaron en la revisión
- Cuál fue la decisión formal
- El acta de la sesión
- La vinculación con la sanción y/o apelación

#### Tabla `configuracion_sanciones`

Parametriza las reglas del sistema sin hardcodear:

| Clave | Valor ejemplo | Descripción |
|-------|---------------|-------------|
| `escalamiento_leve_limite` | `3` | Cuántas leves → 1 media |
| `escalamiento_media_limite` | `2` | Cuántas medias → 1 grave |
| `escalamiento_grave_limite` | `2` | Cuántas graves → 1 gravísima |
| `ventana_reincidencia_dias` | `180` | Ventana temporal (un semestre ~180 días) |
| `duracion_leve_dias` | `5` | Duración base sanción leve |
| `duracion_media_dias` | `10` | Duración base sanción media |
| `duracion_grave_dias` | `21` | Duración base sanción grave |
| `duracion_gravisima_dias` | `60` | Duración base sanción gravísima |
| `ampliacion_dias_default` | `7` | Días que añade una ampliación |
| `max_apelaciones_por_sancion` | `1` | Máximo de apelaciones por sanción |
| `notificar_dias_antes_expiracion` | `2` | Notificar X días antes de que expire |
| `reiniciar_conteo_por_periodo` | `true` | Si el conteo de reincidencia se reinicia cada periodo |

### 4.3 Diferencias Clave vs. Diseño Actual

| Aspecto | Actual | Propuesto |
|---------|--------|-----------|
| Granularidad | 1 fila catálogo compartida por N usuarios | 1 fila por sanción individual por usuario |
| Estados | 2 (ACTIVA/EXPIRADA) | 8 estados con transiciones definidas |
| Niveles | 3 (LEVE/MEDIA/GRAVE) | 4 (+ GRAVÍSIMA) |
| Historial | Solo `created_at` en pivot | Tabla dedicada de auditoría append-only |
| Categoría de falta | No existe | Enum de 9 categorías |
| Escalamiento | Manual (no existe) | Automático con reglas configurables |
| Apelación | No existe | Flujo formal con tabla dedicada |
| Comité | No existe | Tabla de revisiones con actas |
| Configuración | Hardcoded (7 días, 3 niveles) | Tabla configurable sin deploy |
| Vinculación equipo | Solo préstamo | Préstamo + equipo específico |
| Periodo académico | No existe | Campo para filtrar por semestre |
| Soft delete | No (datos mutables) | Sí (registros inmutables) |

---

## 5. Lógica de Escalamiento Automático

### 5.1 Reglas de Escalamiento

```
┌───────────┐  ×3 en ventana  ┌───────────┐  ×2 en ventana  ┌───────────┐  ×2 en ventana  ┌─────────────┐
│   LEVE    │ ───────────────▶│   MEDIA   │ ───────────────▶│   GRAVE   │ ───────────────▶│  GRAVÍSIMA  │
│ 3-7 días  │                 │ 7-15 días │                 │ 15-30 días│                 │ 30-90+ días │
└───────────┘                 └───────────┘                 └───────────┘                 └─────────────┘
```

### 5.2 Análisis de Coherencia de las Reglas

#### ¿Son proporcionales?

| Transición | Proporción | Evaluación |
|------------|------------|------------|
| 3 LEVES → 1 MEDIA | 3:1 | ✅ **Correcta.** Permite margen de error al alumno. Tres faltas menores sí ameritan una sanción intermedia. |
| 2 MEDIAS → 1 GRAVE | 2:1 | ✅ **Correcta.** Más estricta porque el alumno ya fue advertido con sanciones superiores. |
| 2 GRAVES → 1 GRAVÍSIMA | 2:1 | ✅ **Correcta pero necesita intervención humana.** Una gravísima tiene consecuencias institucionales serias; debe requerir ratificación de comité, no ser puramente automática. |

#### Proporción acumulada total

Para llegar a GRAVÍSIMA partiendo de LEVE:
- Ruta 1 (puras leves): 3L → 1M, 3L → 1M, luego 2M → 1G, repetir → **mínimo 12 faltas LEVES** + 2 GRAVES → 1 GRAVÍSIMA = escenario extremo
- Ruta 2 (mixta): Combinación de faltas directas de distintos niveles

**Evaluación:** La proporción es razonable. Un alumno necesita un patrón sostenido de infracciones para llegar a GRAVÍSIMA, lo cual es justo.

### 5.3 Ventana Temporal — Recomendación

**Pregunta clave:** ¿Las 3 faltas leves deben ser "de por vida" o dentro de un periodo?

| Opción | Ventaja | Desventaja |
|--------|---------|------------|
| **Sin ventana (acumulado histórico)** | Máxima rigurosidad | Injusto: una falta de hace 3 años sigue contando. El alumno no tiene "segunda oportunidad" |
| **Ventana semestral (reinicio total)** | Equitativo | Demasiado permisivo: un alumno puede cometer 2 faltas cada semestre indefinidamente sin consecuencia mayor |
| **Ventana deslizante de N días** | Balance justo | Más compleja de implementar |

**Recomendación: Ventana deslizante de 180 días (un semestre académico)** con las siguientes reglas:

1. Al asignar una nueva sanción, el sistema cuenta las sanciones **ACTIVAS + CUMPLIDAS** del mismo nivel dentro de los últimos 180 días.
2. Si el conteo alcanza el umbral → se dispara el escalamiento automático.
3. Las sanciones ANULADAS no cuentan.
4. Las sanciones ESCALADAS no cuentan como falta individual del nivel inferior (evita doble conteo).
5. El historial completo se mantiene SIEMPRE (nunca se borran registros), pero solo la ventana activa se usa para conteo.

### 5.4 Pseudocódigo del Escalamiento

```
FUNCIÓN verificarEscalamiento(usuario, nivelNuevaSancion):
    
    ventana = CONFIGURACION['ventana_reincidencia_dias']  // 180
    fechaCorte = HOY - ventana días
    
    // Contar sanciones del mismo nivel en ventana
    conteo = CONTAR sanciones WHERE
        usuario_id = usuario.id AND
        nivel = nivelNuevaSancion AND
        estado IN ('ACTIVA', 'CUMPLIDA', 'EXPIRADA') AND
        estado != 'ANULADA' AND
        categoria_falta != 'REINCIDENCIA_ACUMULADA' AND  // no contar las escaladas
        created_at >= fechaCorte
    
    // Incluir la sanción que se está asignando
    conteo = conteo + 1
    
    // Verificar umbrales
    SI nivelNuevaSancion == 'LEVE' AND conteo >= CONFIGURACION['escalamiento_leve_limite']:
        nuevaSancion = CREAR sanción nivel='MEDIA'
            estado = 'ACTIVA'
            categoria_falta = 'REINCIDENCIA_ACUMULADA'
            escalada_desde_id = sancionActual.id
            motivo = "Escalamiento automático: {conteo} faltas LEVES acumuladas en {ventana} días"
        
        MARCAR sanciones leves contadas como estado = 'ESCALADA'
        REGISTRAR en historial_sancion(accion='ESCALAMIENTO', es_automatico=true)
        
        // Recursión: verificar si la nueva MEDIA gatilla otro escalamiento
        verificarEscalamiento(usuario, 'MEDIA')
    
    SI nivelNuevaSancion == 'MEDIA' AND conteo >= CONFIGURACION['escalamiento_media_limite']:
        // Análogo → genera GRAVE
        // Si es GRAVE → requiere NOTIFICAR al comité
        
    SI nivelNuevaSancion == 'GRAVE' AND conteo >= CONFIGURACION['escalamiento_grave_limite']:
        // Genera GRAVÍSIMA
        // Estado inicial: EN_REVISION_COMITE (no ACTIVA directamente)
        // BLOQUEAR usuario automáticamente
        // NOTIFICAR comité + dirección académica
```

### 5.5 Diagrama de Transición de Estados

```
                    ┌──────────────┐
                    │  PENDIENTE   │
                    └──────┬───────┘
                           │ admin confirma
                           ▼
                    ┌──────────────┐◀──── admin asigna directamente
         ┌─────────│    ACTIVA     │──────────────────┐
         │         └──┬───────┬───┘                   │
         │            │       │                       │
         │    vence   │       │ alumno apela          │ acumula → escalar
         │    fecha   │       ▼                       ▼
         │            │  ┌──────────┐          ┌──────────────┐
         │            │  │ APELADA  │          │   ESCALADA   │
         │            │  └────┬─────┘          └──────────────┘
         │            │       │
         │            │       ▼ comité revisa
         │            │  ┌───────────────────┐
         │            │  │EN_REVISION_COMITE │
         │            │  └──┬──────────┬─────┘
         │            │     │          │
         │            │  ratifica    anula
         │            │     │          │
         ▼            ▼     ▼          ▼
    ┌──────────┐ ┌──────────┐  ┌──────────┐
    │ EXPIRADA │ │ CUMPLIDA │  │ ANULADA  │
    └──────────┘ └──────────┘  └──────────┘
```

**Transiciones válidas:**

| De → | A → | Disparador |
|------|-----|-----------|
| PENDIENTE | ACTIVA | Admin confirma / automático si no requiere revisión |
| PENDIENTE | ANULADA | Admin detecta error antes de activar |
| ACTIVA | CUMPLIDA | `fecha_fin` alcanzada + condiciones cumplidas |
| ACTIVA | EXPIRADA | `fecha_fin` alcanzada (automático por cron) |
| ACTIVA | APELADA | Alumno presenta apelación formal |
| ACTIVA | ESCALADA | Generó escalamiento a nivel superior |
| APELADA | EN_REVISION_COMITE | Comité acepta revisar el caso |
| APELADA | ACTIVA | Apelación rechazada sumariamente |
| EN_REVISION_COMITE | ACTIVA | Comité ratifica la sanción |
| EN_REVISION_COMITE | ANULADA | Comité revoca la sanción |
| EN_REVISION_COMITE | CUMPLIDA | Comité reduce sanción y período ya venció |

**Transiciones NO permitidas (integridad):**

- De CUMPLIDA a cualquier estado (terminal)
- De ANULADA a cualquier estado (terminal)
- De ESCALADA a PENDIENTE (no se puede revertir escalamiento, solo apelar la nueva sanción generada)

---

## 6. Variables para Reportes y Dashboard

### 6.1 KPIs Principales

| # | Métrica | Fórmula/Consulta | Tipo Gráfico | Frecuencia |
|---|---------|-------------------|--------------|------------|
| K1 | **Sanciones activas** | `COUNT(*) WHERE estado = 'ACTIVA'` | Tarjeta KPI | Tiempo real |
| K2 | **Sanciones este periodo** | `COUNT(*) WHERE periodo_academico = ACTUAL AND created_at >= inicio_periodo` | Tarjeta KPI | Diario |
| K3 | **Tasa de escalamiento** | `COUNT(WHERE categoria_falta='REINCIDENCIA_ACUMULADA') / COUNT(total) × 100` | Tarjeta % + sparkline | Semanal |
| K4 | **Tasa de reincidencia** | `COUNT(usuarios con >1 sanción) / COUNT(usuarios con >=1 sanción) × 100` | Tarjeta % | Mensual |
| K5 | **Usuarios bloqueados** | `COUNT(*) WHERE bloqueado = true` | Tarjeta KPI | Tiempo real |
| K6 | **Apelaciones pendientes** | `COUNT(apelaciones WHERE estado='PENDIENTE')` | Tarjeta KPI (alerta) | Tiempo real |
| K7 | **Tasa de resolución apelaciones** | `COUNT(ACEPTADA+RECHAZADA) / COUNT(total apelaciones) × 100` | Gauge | Mensual |

### 6.2 Métricas Analíticas

| # | Métrica | Cómo Calcular | Gráfico |
|---|---------|---------------|---------|
| A1 | **% reincidencia por nivel** | Para cada nivel: `usuarios_con_más_de_1 / usuarios_con_al_menos_1 × 100`. Barras agrupadas por nivel. | Barras agrupadas |
| A2 | **Faltas más frecuentes por categoría** | `GROUP BY categoria_falta ORDER BY COUNT DESC`. Top 10. | Barras horizontales / Pareto |
| A3 | **Sanciones por asignatura** | `JOIN sanciones → prestamos → asignatura. GROUP BY asignatura.nombre. COUNT(*)` | Treemap o barras |
| A4 | **Sanciones por tipo de equipo** | `JOIN sanciones → equipo → tipo_equipo. GROUP BY tipo.nombre. COUNT(*)` | Barras / dona |
| A5 | **Distribución temporal** | `GROUP BY MONTH(created_at). COUNT(*)`. Separar por nivel con stacked bars. | Barras apiladas por mes |
| A6 | **Tiempo medio entre falta y reincidencia** | Para usuarios reincidentes: `AVG(sancion[n].created_at - sancion[n-1].created_at)`. Usar LAG() en SQL. | Histograma |
| A7 | **Escalamientos automáticos vs manuales** | `COUNT(WHERE es_automatico=true)` vs total. Pie o dona. | Pie chart |
| A8 | **Tendencia de sanciones** | Serie temporal con moving average de 30 días. `COUNT(*) OVER (ORDER BY fecha ROWS 30 PRECEDING)` | Línea con tendencia |
| A9 | **Proporción de apelaciones exitosas** | `COUNT(apelaciones WHERE estado='ACEPTADA') / COUNT(total)` por nivel. | Barras agrupadas |
| A10 | **Tiempo medio de resolución de comité** | `AVG(comite_revisiones.fecha_sesion - apelaciones.fecha_apelacion)` | KPI + histograma |

### 6.3 Índice de Riesgo por Usuario

**Objetivo:** Asignar a cada usuario un score numérico (0-100) que refleje su probabilidad de reincidencia y severidad histórica. Permite priorizar atención administrativa.

**Fórmula propuesta:**

```
indice_riesgo = (
    (sanciones_activas × 25) +
    (total_sanciones_180d × 10) +
    (max_nivel_numerico × 15) +
    (escalamientos × 20) +
    (prestamos_atrasados_activos × 10) +
    (apelaciones_rechazadas × 5)
) / peso_maximo × 100

Donde:
  max_nivel_numerico: LEVE=1, MEDIA=2, GRAVE=3, GRAVISIMA=4
  peso_maximo: 25 + (N×10) + (4×15) + (M×20) + (P×10) + (A×5)
  Normalizar a 0-100
```

**Clasificación:**

| Rango | Categoría | Acción recomendada |
|-------|-----------|-------------------|
| 0-20 | Bajo riesgo | Sin acción especial |
| 21-40 | Riesgo moderado | Monitoreo estándar |
| 41-60 | Riesgo alto | Revisión administrativa proactiva |
| 61-80 | Riesgo crítico | Reunión con coordinación académica |
| 81-100 | Riesgo extremo | Derivación a comité / bloqueo preventivo |

**Cálculo:** Ejecutar como job programado diario o recalcular al asignar/cerrar sanción. Almacenar en `users.indice_riesgo` para consulta rápida.

### 6.4 Queries SQL de Referencia

```sql
-- A1: % reincidencia por nivel
SELECT 
    s.nivel,
    COUNT(DISTINCT s.usuario_id) as usuarios_sancionados,
    COUNT(DISTINCT CASE WHEN cnt > 1 THEN s.usuario_id END) as reincidentes,
    ROUND(
        COUNT(DISTINCT CASE WHEN cnt > 1 THEN s.usuario_id END) * 100.0 
        / NULLIF(COUNT(DISTINCT s.usuario_id), 0), 
    2) as pct_reincidencia
FROM sanciones s
JOIN (
    SELECT usuario_id, nivel, COUNT(*) as cnt
    FROM sanciones
    WHERE estado NOT IN ('ANULADA')
      AND created_at >= DATE_SUB(NOW(), INTERVAL 180 DAY)
    GROUP BY usuario_id, nivel
) sub ON s.usuario_id = sub.usuario_id AND s.nivel = sub.nivel
GROUP BY s.nivel;

-- A6: Tiempo medio entre falta y reincidencia
SELECT 
    usuario_id,
    AVG(dias_entre) as promedio_dias_reincidencia
FROM (
    SELECT 
        usuario_id,
        DATEDIFF(
            created_at, 
            LAG(created_at) OVER (PARTITION BY usuario_id ORDER BY created_at)
        ) as dias_entre
    FROM sanciones
    WHERE estado NOT IN ('ANULADA')
) t
WHERE dias_entre IS NOT NULL
GROUP BY usuario_id;

-- K3: Tasa de escalamiento automático
SELECT 
    ROUND(
        SUM(CASE WHEN categoria_falta = 'REINCIDENCIA_ACUMULADA' THEN 1 ELSE 0 END) * 100.0 
        / NULLIF(COUNT(*), 0),
    2) as tasa_escalamiento_pct
FROM sanciones
WHERE periodo_academico = '2026-1';
```

---

## 7. Reglamento de Sanciones

> **REGLAMENTO DE SANCIONES DEL SISTEMA DE PRÉSTAMO DE EQUIPOS ACADÉMICOS**  
> Universidad de Tarapacá — Dirección de Tecnologías de Información  
> Versión 1.0 — Vigente desde: [FECHA DE APROBACIÓN]

---

### TÍTULO I — DISPOSICIONES GENERALES

**Artículo 1. Objeto.**  
El presente reglamento establece las normas, clasificaciones, procedimientos y sanciones aplicables a las infracciones cometidas por los usuarios del Sistema de Préstamo de Equipos Académicos (en adelante, "el Sistema"), con el fin de garantizar el uso responsable de los recursos institucionales, la equidad entre usuarios y la integridad de los equipos.

**Artículo 2. Ámbito de aplicación.**  
Este reglamento aplica a toda persona registrada en el Sistema con rol de alumno, docente o funcionario que realice, solicite o participe en préstamos de equipos académicos. Los administradores del Sistema están sujetos a las normativas funcionarias correspondientes.

**Artículo 3. Principios rectores.**  
a) **Proporcionalidad:** La sanción será proporcional a la gravedad de la falta.  
b) **Gradualidad:** Se aplicará la escala de sanciones de menor a mayor, con excepción de faltas directamente graves o gravísimas.  
c) **Debido proceso:** Todo usuario sancionado tendrá derecho a conocer la falta imputada, la evidencia, y a presentar apelación formal.  
d) **Trazabilidad:** Toda sanción, su historial y sus cambios de estado quedarán registrados en el Sistema de forma inmutable.  
e) **Temporalidad:** Las sanciones se evalúan dentro de ventanas temporales definidas, permitiendo la rehabilitación del usuario.

**Artículo 4. Definiciones.**

| Término | Definición |
|---------|-----------|
| **Falta** | Acción u omisión del usuario que contraviene las normas de uso del Sistema o de los equipos prestados. |
| **Sanción** | Medida correctiva impuesta al usuario como consecuencia de una falta debidamente registrada. |
| **Escalamiento** | Incremento automático del nivel de sanción cuando un usuario acumula faltas del mismo nivel dentro de una ventana temporal. |
| **Reincidencia** | Comisión de una nueva falta por un usuario que ya posee sanciones previas acumuladas (activas o cumplidas) dentro de la ventana vigente. |
| **Ventana de reincidencia** | Período de 180 días naturales (un semestre académico aproximado) dentro del cual se computan las faltas para efectos de escalamiento. |
| **Periodo académico** | Semestre lectivo identificado como AÑO-SEMESTRE (ejemplo: 2026-1). |
| **Comité de Sanciones** | Órgano colegiado designado por la Dirección de Tecnologías de Información, compuesto por al menos tres miembros, encargado de resolver las sanciones graves, gravísimas y apelaciones. |

---

### TÍTULO II — CLASIFICACIÓN DE FALTAS

**Artículo 5. Categorías de falta.**  
Las faltas se clasifican según su naturaleza en las siguientes categorías:

| Código | Categoría | Descripción |
|--------|-----------|-------------|
| F01 | **Retraso en devolución** | No devolver el equipo en la fecha y hora pactadas al momento de la aprobación del préstamo. |
| F02 | **Daño a equipo** | Devolver el equipo con daños físicos, funcionales o estéticos no presentes al momento de la entrega, verificables mediante registro de estado previo. |
| F03 | **Pérdida de equipo** | No devolver el equipo de forma definitiva, sin justificación válida documentada. |
| F04 | **Mal uso de equipo** | Utilizar el equipo para fines distintos a los declarados en la solicitud de préstamo, o en condiciones que pongan en riesgo su integridad. |
| F05 | **Falsificación de datos** | Proporcionar información falsa en la solicitud de préstamo (identidad, asignatura, justificación, etc.). |
| F06 | **Préstamo a terceros** | Ceder, prestar o permitir el uso del equipo por personas no autorizadas en la solicitud original. |
| F07 | **Incumplimiento de convenio** | Violar las condiciones especiales acordadas para préstamos con convenio institucional o extensión aprobada. |
| F08 | **Reincidencia acumulada** | Categoría asignada automáticamente por el Sistema cuando se activa una regla de escalamiento. No se asigna manualmente. |
| F09 | **Otra** | Cualquier falta no contemplada en las categorías anteriores. Requiere descripción detallada obligatoria y será evaluada individualmente por el administrador o el Comité. |

**Artículo 6. Relación falta-nivel.**  
La siguiente tabla establece el nivel de sanción correspondiente a cada categoría de falta en primera instancia (sin reincidencia):

| Categoría | 1ª instancia | Casos agravantes → nivel superior |
|-----------|-------------|-----------------------------------|
| F01 — Retraso en devolución | **LEVE** (≤24h) o **MEDIA** (>24h) | >72h → GRAVE |
| F02 — Daño a equipo | **MEDIA** (reparable) o **GRAVE** (irreparable) | Daño intencional → GRAVE |
| F03 — Pérdida de equipo | **GRAVE** | Sin notificación al Sistema en >48h → GRAVÍSIMA |
| F04 — Mal uso | **LEVE** (sin daño) o **MEDIA** (con riesgo) | Con daño resultante → GRAVE |
| F05 — Falsificación | **GRAVE** | Siempre grave — no admite LEVE/MEDIA |
| F06 — Préstamo a terceros | **MEDIA** | Si el tercero causó daño → GRAVE |
| F07 — Incumplimiento convenio | **MEDIA** | Con daño institucional → GRAVE |
| F08 — Reincidencia acumulada | Según regla de escalamiento | Automático |
| F09 — Otra | A discreción del administrador | Máximo MEDIA sin intervención de comité |

---

### TÍTULO III — NIVELES DE SANCIÓN

**Artículo 7. Escala de sanciones.**

#### 7.1 Sanción LEVE

| Aspecto | Detalle |
|---------|---------|
| **Duración** | 3 a 7 días naturales |
| **Efecto** | Amonestación registrada en el Sistema. El usuario recibe notificación por correo. No impide solicitar nuevos préstamos durante la vigencia, pero queda registrada como antecedente. |
| **Requisito de aprobación** | Administrador del Sistema |
| **Acumulación** | 3 sanciones LEVES activas o cumplidas dentro de la ventana de reincidencia (180 días) generan automáticamente 1 sanción MEDIA. |

#### 7.2 Sanción MEDIA

| Aspecto | Detalle |
|---------|---------|
| **Duración** | 7 a 15 días naturales |
| **Efecto** | Suspensión del derecho a solicitar nuevos préstamos durante el período de sanción. Los préstamos activos al momento de la sanción NO se revocan, pero no se permiten extensiones. |
| **Requisito de aprobación** | Administrador del Sistema |
| **Acumulación** | 2 sanciones MEDIAS activas o cumplidas dentro de la ventana de reincidencia generan automáticamente 1 sanción GRAVE. |

#### 7.3 Sanción GRAVE

| Aspecto | Detalle |
|---------|---------|
| **Duración** | 15 a 30 días naturales |
| **Efecto** | Suspensión total del Sistema: no puede solicitar, recibir ni extender préstamos. Se notifica a la coordinación de la carrera del alumno. Si tiene préstamos activos, se solicita devolución inmediata. |
| **Requisito de aprobación** | Administrador del Sistema + **ratificación del Comité** dentro de 5 días hábiles. Si el Comité no ratifica en plazo, la sanción se mantiene como MEDIA hasta resolución. |
| **Acumulación** | 2 sanciones GRAVES activas o cumplidas dentro de la ventana de reincidencia generan automáticamente 1 sanción GRAVÍSIMA. |
| **Notas** | El administrador puede asignar directamente una sanción GRAVE sin escalamiento cuando la falta lo amerite (ej: pérdida de equipo, falsificación). |

#### 7.4 Sanción GRAVÍSIMA

| Aspecto | Detalle |
|---------|---------|
| **Duración** | 30 a 90 días naturales, o indefinida hasta resolución del Comité |
| **Efecto** | Bloqueo total e inmediato del usuario en el Sistema. Se notifica a: coordinación de carrera, dirección de escuela, y Dirección de Tecnologías de Información. Puede incluir reposición obligatoria del equipo dañado/perdido. |
| **Requisito de aprobación** | **Obligatoria** aprobación del Comité de Sanciones. La sanción inicia con estado EN_REVISION_COMITE en el Sistema. |
| **Reposición** | En caso de pérdida o daño irreparable, el usuario deberá reponer el equipo o su valor equivalente como condición para la reactivación de su cuenta. |
| **Derivación** | El Comité podrá derivar el caso a instancias superiores (Decanato, Dirección Académica) si lo estima pertinente. |

---

### TÍTULO IV — REGLAS DE ESCALAMIENTO

**Artículo 8. Escalamiento automático por reincidencia.**

8.1 El Sistema llevará un conteo automático de las sanciones por nivel y por usuario dentro de la ventana de reincidencia vigente (180 días naturales, configurable por el Comité).

8.2 Las reglas de escalamiento son:

| Condición | Resultado |
|-----------|-----------|
| **3 sanciones LEVES** acumuladas en la ventana | Se genera automáticamente **1 sanción MEDIA** adicional |
| **2 sanciones MEDIAS** acumuladas en la ventana | Se genera automáticamente **1 sanción GRAVE** adicional |
| **2 sanciones GRAVES** acumuladas en la ventana | Se genera automáticamente **1 sanción GRAVÍSIMA** adicional |

8.3 Para el conteo de escalamiento:
- Se computan sanciones con estado **ACTIVA**, **CUMPLIDA** o **EXPIRADA**.
- **No** se computan sanciones con estado ANULADA.
- **No** se computan sanciones generadas por escalamiento previo (categoría F08-REINCIDENCIA_ACUMULADA), para evitar cascada infinita.
- La ventana se calcula como los 180 días naturales anteriores a la fecha de la nueva sanción.

8.4 El escalamiento es **recursivo**: si una sanción MEDIA generada por escalamiento completa el umbral de 2 MEDIAS, se generará automáticamente una GRAVE.

8.5 Las sanciones generadas por escalamiento:
- Llevarán categoría de falta **F08 (Reincidencia acumulada)**.
- Contendrán referencia a la última sanción que gatilló el escalamiento (`escalada_desde_id`).
- Generarán una entrada automática en el historial de auditoría.
- Notificarán al usuario y al administrador por correo electrónico.

8.6 Las sanciones GRAVE generadas por escalamiento requieren ratificación del Comité dentro de 5 días hábiles. Las GRAVÍSIMAS generadas por escalamiento iniciarán directamente en estado EN_REVISION_COMITE.

**Artículo 9. Reinicio y persistencia del conteo.**

9.1 El conteo de reincidencia utiliza una **ventana deslizante** (rolling window), no un reinicio abrupto por periodo académico. Esto significa que una sanción del 15 de noviembre de 2025 dejará de contar para escalamiento el 14 de mayo de 2026, independientemente del cambio de semestre.

9.2 El **historial completo** de sanciones se mantiene de forma permanente en el Sistema y nunca se elimina. La ventana temporal solo aplica al cálculo de escalamiento, no al registro histórico.

9.3 El Comité podrá, mediante resolución fundamentada, modificar la duración de la ventana de reincidencia. La modificación aplicará prospectivamente (no retroactivamente a sanciones ya registradas).

---

### TÍTULO V — PROCEDIMIENTO

**Artículo 10. Asignación de sanción.**

10.1 El administrador del Sistema podrá asignar sanciones de nivel LEVE y MEDIA de forma directa, sin intervención del Comité.

10.2 Para asignar una sanción, el administrador deberá registrar en el Sistema:
- Identificación del usuario (RUT, correo o ID).
- Categoría de falta (obligatoria).
- Nivel de sanción (obligatorio).
- Descripción detallada del incidente (obligatoria).
- Préstamo vinculado (si aplica).
- Equipo específico afectado (si aplica).
- Fechas de inicio y fin.

10.3 El Sistema rechazará la asignación de una sanción GRAVE o GRAVÍSIMA directa sin previa confirmación del Comité, a menos que el administrador justifique urgencia (en cuyo caso la sanción se crea con estado PENDIENTE hasta ratificación).

10.4 Al registrar la sanción, el Sistema automáticamente:
- Verificará y ejecutará reglas de escalamiento (Art. 8).
- Enviará notificación por correo electrónico al usuario.
- Registrará la acción en la bitácora de auditoría.
- Actualizará el índice de riesgo del usuario.

**Artículo 11. Notificación.**

11.1 Toda sanción será notificada al usuario por correo electrónico institucional dentro de las 24 horas siguientes a su registro en el Sistema.

11.2 La notificación deberá contener:
- Nivel y categoría de la sanción.
- Descripción de la falta imputada.
- Fechas de inicio y fin.
- Efectos de la sanción sobre su cuenta.
- Instrucciones para presentar apelación (si aplica).
- Identificación del administrador que asignó la sanción.

11.3 El correo de notificación también se enviará cuando la sanción sea ampliada, reducida, anulada, o cuando se resuelva una apelación.

**Artículo 12. Ampliación de sanción.**

12.1 El administrador podrá ampliar el período de una sanción ACTIVA, indicando motivo obligatorio.

12.2 La ampliación estándar será de 7 días naturales (configurable), pudiendo el administrador especificar una cantidad diferente con justificación.

12.3 La ampliación no modifica el nivel de la sanción. Si el comportamiento del usuario amerita un nivel superior, se deberá asignar una nueva sanción.

12.4 Toda ampliación quedará registrada en el historial de la sanción y será notificada al usuario.

**Artículo 13. Reducción o levantamiento anticipado.**

13.1 El administrador o el Comité podrán reducir el período o levantar anticipadamente una sanción, registrando motivo obligatorio.

13.2 El levantamiento anticipado cambiará el estado de la sanción a **CUMPLIDA** (no EXPIRADA ni ANULADA), indicando que el período fue cumplido parcialmente con resolución favorable.

13.3 La reducción de una sanción GRAVE o GRAVÍSIMA requiere aprobación del Comité.

---

### TÍTULO VI — DERECHO DE APELACIÓN

**Artículo 14. Procedimiento de apelación.**

14.1 Todo usuario sancionado tendrá derecho a presentar **una apelación por sanción** dentro de los **5 días hábiles** siguientes a la notificación.

14.2 La apelación se presenta a través del Sistema, indicando:
- Motivo de la apelación (campo de texto libre, obligatorio).
- Evidencia de respaldo (documentos adjuntos, opcional).

14.3 Al presentar la apelación, el estado de la sanción cambiará a **APELADA** en el Sistema. Los efectos de la sanción **se mantienen** durante la apelación (la sanción no se suspende).

14.4 Resolución de apelaciones:
- Sanciones LEVE y MEDIA: el administrador podrá resolver directamente.
- Sanciones GRAVE y GRAVÍSIMA: serán derivadas obligatoriamente al Comité.

14.5 El plazo de resolución será de **10 días hábiles** desde la presentación. Transcurrido el plazo sin resolución, la sanción se mantiene vigente hasta que se resuelva.

14.6 La resolución será notificada al usuario por correo electrónico y registrada en el Sistema con identificación del resolutor.

**Artículo 15. Resultados posibles de la apelación.**

| Resolución | Efecto en el Sistema |
|------------|---------------------|
| **Rechazada** | Sanción vuelve a estado ACTIVA (o CUMPLIDA si el período ya venció). Queda registro de la apelación rechazada. |
| **Aceptada parcialmente** | Se reduce el nivel o la duración. Se registra nueva fecha_fin o nuevo nivel. |
| **Aceptada totalmente** | Sanción cambia a estado ANULADA. No cuenta para escalamiento ni reincidencia. |

---

### TÍTULO VII — COMITÉ DE SANCIONES

**Artículo 16. Composición.**

16.1 El Comité de Sanciones estará compuesto por un mínimo de **3 miembros** designados por la Dirección de Tecnologías de Información:
- Un representante de la administración del laboratorio o bodega.
- Un representante académico (docente).
- Un representante de la Dirección de TI.

16.2 El quórum mínimo para sesionar será de 3 miembros.

**Artículo 17. Competencia.**

El Comité intervendrá obligatoriamente en:
- Ratificación de sanciones GRAVES asignadas directamente o por escalamiento.
- Aprobación de sanciones GRAVÍSIMAS.
- Resolución de apelaciones sobre sanciones GRAVES y GRAVÍSIMAS.
- Solicitudes de levantamiento anticipado de sanciones GRAVES y GRAVÍSIMAS.
- Modificación de parámetros del Sistema (ventana temporal, umbrales de escalamiento).

**Artículo 18. Decisiones.**

18.1 Las decisiones del Comité se registrarán en el Sistema mediante acta resumida que incluya:
- Miembros presentes.
- Sanción y/o apelación evaluada.
- Decisión tomada (RATIFICAR, REDUCIR, ANULAR, DERIVAR).
- Observaciones y fundamentos.
- Fecha de la sesión.

18.2 Las opciones de decisión son:

| Decisión | Efecto |
|----------|--------|
| **RATIFICAR** | La sanción se mantiene en su nivel y duración original. Estado vuelve a ACTIVA. |
| **REDUCIR** | El Comité reduce el nivel y/o la duración. Se actualiza la sanción en el Sistema. |
| **ANULAR** | La sanción se invalida. Estado cambia a ANULADA. El usuario recupera sus derechos. |
| **DERIVAR** | El caso se escala a instancias superiores (Decanato u otra). Se registra en observaciones. |

---

### TÍTULO VIII — EXPIRACIÓN Y EFECTOS AUTOMÁTICOS

**Artículo 19. Expiración automática.**

19.1 El Sistema ejecutará diariamente (mediante tarea programada) la verificación de sanciones cuya `fecha_fin` haya sido alcanzada.

19.2 Las sanciones ACTIVAS cuya `fecha_fin` sea anterior o igual a la fecha actual cambiarán automáticamente a estado **EXPIRADA**.

19.3 La expiración automática generará:
- Registro en historial de auditoría (accion = EXPIRACION, es_automatico = true).
- Notificación por correo al usuario informando que la sanción ha expirado.
- Verificación de desbloqueo: si el usuario no tiene otras sanciones activas, se restaura su acceso completo.

**Artículo 20. Bloqueo de cuenta.**

20.1 El bloqueo de cuenta en el Sistema será consecuencia directa de:
- Sanción GRAVÍSIMA activa.
- Sanción GRAVE activa (suspensión total de préstamos, no bloqueo de acceso).
- Decisión administrativa fundamentada.

20.2 El desbloqueo será automático cuando:
- La última sanción que generó el bloqueo cambie a estado CUMPLIDA, EXPIRADA o ANULADA.
- Y no existan otras sanciones GRAVES o GRAVÍSIMAS activas.

20.3 El administrador podrá bloquear o desbloquear manualmente una cuenta, registrando motivo obligatorio. El bloqueo manual es independiente del sistema de sanciones.

---

### TÍTULO IX — REPOSICIÓN DE EQUIPOS

**Artículo 21. Obligación de reposición.**

21.1 En caso de pérdida total (F03) o daño irreparable (F02 agravado), el usuario deberá reponer el equipo o su valor equivalente como condición para la reactivación de su cuenta.

21.2 La obligación de reposición es **adicional** a la sanción, no la reemplaza. El usuario debe cumplir tanto la sanción temporal como la reposición.

21.3 El administrador registrará en el Sistema el monto o equipo requerido y la confirmación de cumplimiento.

---

### TÍTULO X — DISPOSICIONES FINALES

**Artículo 22. Vigencia.**  
El presente reglamento entrará en vigencia a partir de [FECHA] y aplicará a todas las sanciones registradas desde esa fecha. Las sanciones previas mantienen su estado actual sin recálculo retroactivo.

**Artículo 23. Modificaciones.**  
Las modificaciones al presente reglamento serán propuestas por la Dirección de TI y aprobadas por el Comité de Sanciones. Las modificaciones a parámetros operativos (ventana temporal, umbrales, duraciones) podrán realizarse directamente a través de la tabla de configuración del Sistema con aprobación del Comité.

**Artículo 24. Interpretación.**  
Los casos no previstos en este reglamento serán resueltos por el Comité de Sanciones, y sentarán precedente para futuras modificaciones normativas.

**Artículo 25. Registro y transparencia.**  
Todo el historial de sanciones, apelaciones, resoluciones y modificaciones quedará registrado de forma inmutable en el Sistema. Los datos serán tratados conforme a la normativa de protección de datos personales vigente.

---

## 8. Plan de Migración

### 8.1 Prioridad de implementación

| Fase | Componente | Esfuerzo estimado | Prerrequisitos |
|------|-----------|-------------------|----------------|
| **F1** | Migración de esquema de BD (nueva tabla `sanciones` individual) | 2-3 días | Backup completo |
| **F2** | Migración de datos existentes (`sancions` + `user_sancion` → `sanciones`) | 1 día | F1 |
| **F3** | Nuevos Enums (`NivelSancion`, `EstadoSancion`, `CategoriaFalta`, `AccionSancion`) | 0.5 días | — |
| **F4** | Tabla `historial_sancion` + triggers de auditoría | 1 día | F1 |
| **F5** | Tabla `configuracion_sanciones` + seeders | 0.5 días | — |
| **F6** | Lógica de escalamiento automático (Service) | 2-3 días | F1, F3, F5 |
| **F7** | Cron de expiración automática (Scheduler) | 0.5 días | F1, F4 |
| **F8** | Tabla `apelaciones` + endpoints API | 2 días | F1 |
| **F9** | Tabla `comite_revisiones` + endpoints API | 1-2 días | F1, F8 |
| **F10** | Frontend: flujo de apelaciones (alumno) | 2 días | F8 |
| **F11** | Frontend: panel de comité (admin) | 2-3 días | F9 |
| **F12** | Reportes avanzados (dashboards con nuevas métricas) | 3-4 días | F1-F9 |
| **F13** | Índice de riesgo + recalculación periódica | 1-2 días | F1, F6 |

**Total estimado:** 18-24 días de desarrollo

### 8.2 Script de migración conceptual (datos existentes)

```sql
-- PASO 1: Crear nueva tabla sanciones (individual)
-- (según esquema §4.1)

-- PASO 2: Migrar registros existentes
INSERT INTO sanciones_new (
    usuario_id, catalogo_sancion_id, prestamo_id, nivel, estado,
    categoria_falta, descripcion, fecha_inicio, fecha_fin,
    motivo, asignado_por, periodo_academico, created_at
)
SELECT 
    us.idUser,
    us.idSancion,
    us.prestamo_id,
    s.nivel,
    s.estado,               -- ACTIVA o EXPIRADA
    'OTRO',                 -- Sin categoría en datos existentes
    COALESCE(us.descripcion, s.descripcion, 'Migrada del sistema anterior'),
    s.fecha_inicio,
    s.fecha_fin,
    COALESCE(us.descripcion, 'Sin motivo registrado'),
    us.assigned_by,
    '2025-2',               -- Periodo estimado
    COALESCE(us.created_at, s.created_at)
FROM user_sancion us
JOIN sancions s ON s.idSancion = us.idSancion;

-- PASO 3: Generar historial inicial
INSERT INTO historial_sancion (sancion_id, accion, estado_anterior, estado_nuevo, descripcion, ejecutado_por, es_automatico)
SELECT id, 'ASIGNACION', NULL, estado, 'Registro migrado del sistema anterior', asignado_por, false
FROM sanciones_new;

-- PASO 4: Eliminar tablas legacy (después de verificación)
-- DROP TABLE user_sancion;
-- DROP TABLE sancions;
-- ALTER TABLE users DROP COLUMN estadoSancion;
```

### 8.3 Cambios obligatorios al código actual

| Archivo actual | Cambio requerido | Razón |
|---------------|-----------------|-------|
| `Sancion.php` | Reemplazar completamente con nuevo modelo | Nuevo esquema individual |
| `UserSancion.php` | Eliminar | Se absorbe en nueva tabla `sanciones` |
| `UserSancionController.php` | Refactorizar: `asignarSancion()` debe incluir escalamiento, `ampliarSancion()` modifica individual, `quitarSancion()` marca individual | C3-C5 resueltos |
| `SancionController.php` | Eliminar (está vacío) | I8 resuelto |
| `ReportesSancionesService.php` | Refactorizar queries a nueva tabla | Nuevas métricas |
| `SancionSeeder.php` | Migrar a `CatalogoSancionesSeeder` | Separar catálogo de registros |
| `sanciones.service.ts` (FE) | Agregar endpoints de apelación, escalamiento | Nuevos flujos |
| `gestionar-sanciones` (FE) | Agregar categoría_falta, flujo comité | Nuevos campos |
| `mis-sanciones` (FE) | Agregar botón de apelar | Nuevo flujo alumno |

---

## 9. Anexos Técnicos

### Anexo A — Tabla de Configuración Inicial (Seeders)

| Clave | Valor | Descripción |
|-------|-------|-------------|
| `escalamiento_leve_limite` | `3` | 3 LEVES → 1 MEDIA |
| `escalamiento_media_limite` | `2` | 2 MEDIAS → 1 GRAVE |
| `escalamiento_grave_limite` | `2` | 2 GRAVES → 1 GRAVÍSIMA |
| `ventana_reincidencia_dias` | `180` | ≈ 1 semestre |
| `duracion_leve_min` | `3` | Mínimo días sanción LEVE |
| `duracion_leve_max` | `7` | Máximo días sanción LEVE |
| `duracion_media_min` | `7` | Mínimo días sanción MEDIA |
| `duracion_media_max` | `15` | Máximo días sanción MEDIA |
| `duracion_grave_min` | `15` | Mínimo días sanción GRAVE |
| `duracion_grave_max` | `30` | Máximo días sanción GRAVE |
| `duracion_gravisima_min` | `30` | Mínimo días sanción GRAVÍSIMA |
| `duracion_gravisima_max` | `90` | Máximo días sanción GRAVÍSIMA |
| `ampliacion_dias_default` | `7` | Días de ampliación estándar |
| `max_apelaciones_por_sancion` | `1` | Una apelación por sanción |
| `plazo_apelacion_dias_habiles` | `5` | Días hábiles para apelar |
| `plazo_resolucion_dias_habiles` | `10` | Días hábiles para resolver apelación |
| `plazo_ratificacion_comite_dias` | `5` | Días hábiles para ratificación |
| `notificar_dias_antes_expiracion` | `2` | Días antes de expiración para notificar |
| `reiniciar_conteo_por_periodo` | `false` | Si se reinicia conteo por semestre (false = ventana deslizante) |

### Anexo B — Matriz de Permisos

| Acción | Admin | Comité | Alumno | Sistema |
|--------|-------|--------|--------|---------|
| Asignar sanción LEVE/MEDIA | ✅ | ✅ | ❌ | ✅ (escalamiento) |
| Asignar sanción GRAVE | ✅ (requiere ratificación) | ✅ | ❌ | ✅ (escalamiento + requiere ratif.) |
| Asignar sanción GRAVÍSIMA | ❌ (solo propone) | ✅ | ❌ | ✅ (escalamiento + EN_REVISION) |
| Ampliar sanción | ✅ | ✅ | ❌ | ❌ |
| Reducir sanción LEVE/MEDIA | ✅ | ✅ | ❌ | ❌ |
| Reducir sanción GRAVE/GRAVÍSIMA | ❌ | ✅ | ❌ | ❌ |
| Levantar sanción | ✅ (LEVE/MEDIA) | ✅ (todas) | ❌ | ✅ (expiración auto) |
| Presentar apelación | ❌ | ❌ | ✅ | ❌ |
| Resolver apelación LEVE/MEDIA | ✅ | ✅ | ❌ | ❌ |
| Resolver apelación GRAVE/GRAVÍSIMA | ❌ | ✅ | ❌ | ❌ |
| Bloquear usuario | ✅ | ✅ | ❌ | ✅ (auto en GRAVÍSIMA) |
| Desbloquear usuario | ✅ | ✅ | ❌ | ✅ (auto al expirar) |
| Ver mis sanciones | ✅ | ✅ | ✅ | — |
| Ver todas las sanciones | ✅ | ✅ | ❌ | — |
| Modificar configuración | ❌ | ✅ | ❌ | ❌ |

### Anexo C — Mapa de Notificaciones por Email

| Evento | Destinatario(s) | Template |
|--------|-----------------|----------|
| Sanción asignada | Usuario | `sancion-asignada` |
| Sanción ampliada | Usuario | `sancion-ampliada` |
| Sanción levantada/expirada | Usuario | `sancion-quitada` |
| Sanción escalada (automática) | Usuario + Admin | `sancion-escalada` |
| Apelación recibida | Admin / Comité | `apelacion-recibida` |
| Apelación resuelta | Usuario | `apelacion-resuelta` |
| Próxima expiración (2 días antes) | Usuario | `sancion-proxima-expiracion` |
| Ratificación pendiente (comité) | Miembros comité | `comite-ratificacion-pendiente` |
| Resolución de comité | Usuario + Admin | `comite-resolucion` |
| Bloqueo de cuenta | Usuario | `cuenta-bloqueada` |
| Desbloqueo de cuenta | Usuario | `cuenta-desbloqueada` |

### Anexo D — Diagrama de Flujo Completo

```
                             FALTA DETECTADA
                                   │
                                   ▼
                        ┌─────────────────────┐
                        │ Admin registra falta │
                        │ (categoría + nivel)  │
                        └──────────┬──────────┘
                                   │
                                   ▼
                          ┌────────────────┐
                          │ ¿Nivel GRAVE   │
                          │ o GRAVÍSIMA?   │
                          └───┬────────┬───┘
                          Sí  │        │ No
                              ▼        ▼
                    ┌─────────────┐ ┌──────────────┐
                    │ Estado:     │ │ Estado:      │
                    │ PENDIENTE   │ │ ACTIVA       │
                    │ (espera     │ │ (inmediata)  │
                    │ comité)     │ │              │
                    └──────┬──────┘ └──────┬───────┘
                           │               │
                           ▼               ▼
                    ┌──────────────┐  ┌───────────────────────────┐
                    │Comité ratifica│  │ Sistema verifica          │
                    │ o anula      │  │ escalamiento automático   │
                    └──────┬───────┘  └──────┬────────────────────┘
                           │                 │
                           │           ┌─────┴──────┐
                           │      No   │ ¿Umbral    │  Sí
                           │     ┌─────│ alcanzado? │─────┐
                           │     │     └────────────┘     │
                           │     │                        ▼
                           │     │              ┌──────────────────┐
                           │     │              │ Crear sanción de │
                           │     │              │ nivel superior   │
                           │     │              │ (cat: F08)       │
                           │     │              └────────┬─────────┘
                           │     │                       │
                           ▼     ▼                       ▼
                    ┌──────────────────────────────────────────┐
                    │          SANCIÓN(ES) ACTIVA(S)           │
                    └───┬──────────┬──────────┬───────────┬───┘
                        │          │          │           │
                   El alumno   Admin      Fecha fin    Admin
                   apela       amplía     llegó        levanta
                        │          │          │           │
                        ▼          ▼          ▼           ▼
                  ┌──────────┐ (historial) ┌────────┐ ┌────────┐
                  │ APELADA  │           │EXPIRADA│ │CUMPLIDA│
                  └────┬─────┘           └────────┘ └────────┘
                       │
                       ▼
                 ┌───────────┐
                 │ Comité o  │
                 │ Admin     │
                 │ resuelve  │
                 └──┬────┬───┘
              Acepta│    │Rechaza
                    ▼    ▼
              ┌────────┐ ┌────────┐
              │ANULADA │ │ACTIVA  │
              └────────┘ └────────┘
```

---

> **NOTA FINAL:** Este documento constituye un análisis técnico-normativo completo del subsistema de sanciones. El reglamento propuesto en §7 está diseñado para funcionar simultáneamente como documento institucional impreso y como especificación de requisitos para implementación en el Sistema. Cada artículo tiene correspondencia directa con componentes de base de datos, lógica de negocio y flujos de interfaz de usuario.
