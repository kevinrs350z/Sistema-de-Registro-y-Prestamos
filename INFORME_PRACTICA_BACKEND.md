# INFORME DE PRÁCTICA PROFESIONAL
## Sistema de Registro y Préstamo de Equipos para Diseño Multimedia
### Desarrollo Backend

---

## PRELIMINARES

### PORTADA

**SISTEMA DE REGISTRO Y PRÉSTAMO DE EQUIPOS PARA DISEÑO MULTIMEDIA**
**Arquitectura e Implementación del Backend**

**Estudiante:** [Tu nombre]
**Carrera:** Ingeniería en Computación e Informática
**Institución:** Universidad de Tarapacá
**Período de Práctica:** [Mes inicio] - [Mes fin], 2026
**Profesor Guía:** [Nombre]
**Profesor Supervisor:** [Nombre]

---

## RESUMEN EJECUTIVO

### Síntesis del Proyecto
Durante mi período de práctica profesional, fue responsable del diseño e implementación de la **arquitectura completa del backend** para un **Sistema de Gestión y Préstamo de Equipos Multimedia**, desarrollado para el Departamento de Diseño Multimedia de la Universidad de Tarapacá.

### Tecnologías Utilizadas
- **Framework Backend:** Laravel 11 (PHP 8.x)
- **Arquitectura:** REST API con patrón MVC
- **Base de Datos:** MariaDB/MySQL
- **Autenticación:** Laravel Sanctum + OAuth Google
- **Control de Versiones:** Git + GitHub
- **Metodología:** Scrum con sprints semanales

### Características Principales Implementadas
- ✅ API RESTful con 45+ endpoints autenticados
- ✅ Gestión completa de préstamos y devoluciones
- ✅ Sistema de sanciones y restricciones de usuario
- ✅ Control granular de inventario en tiempo real
- ✅ Dashboard analítico con 9 módulos de reportes
- ✅ Autenticación multi-roles (Admin, Docente, Estudiante)
- ✅ Auditoría completa de cambios de estado
- ✅ Procesamiento asincrónico con colas de trabajo

### Resultados Alcanzados
- 34 migraciones de base de datos exitosas
- 15 servicios especializados de negocio
- 100+ validaciones y reglas de negocio implementadas
- Sistema en producción sirviendo solicitudes diarias
- Integración exitosa con frontend Angular

---

## I. INTRODUCCIÓN (1.5 páginas)

### Contexto y Relevancia

En entornos académicos contemporáneos, la gestión eficiente de recursos tecnológicos y audiovisuales es fundamental para garantizar la calidad educativa. La Universidad de Tarapacá, particularmente el Departamento de Diseño Multimedia, requería una solución integral que permitiera:

1. **Control del Inventario:** Seguimiento de cientos de equipos (cámaras, iluminación, audio, edición)
2. **Gestión de Solicitudes:** Procesar solicitudes de préstamo de forma ordenada y segura
3. **Respeto de Reglas Negocio:** Aplicar restricciones por sanciones, disponibilidad y roles
4. **Trazabilidad Completa:** Auditoría de cada acción realizada sobre equipos y préstamos

### Importancia del Backend en Sistemas Modernos

Mientras que usuarios finales interactúan con interfaces frontend, el **backend constituye el corazón de cualquier aplicación web moderna**. Es responsable de:

- **Integridad de Datos:** Garantizar consistencia en transacciones críticas
- **Seguridad:** Validar identidades, autorizar acciones, proteger información sensible
- **Escalabilidad:** Diseñar arquitecturas que crezcan con el volumen de datos y usuarios
- **Confiabilidad:** Manejar errores, transacciones y fallback strategies

### Desafíos Técnicos Abordados

Durante esta práctica enfrenté y resolví desafíos como:

1. **Modelado Complejo de Datos:** Equipos con relaciones múltiples, estados dinámicos, historiales
2. **Lógica Transaccional:** Garantizar atomicidad en operaciones que afectan múltiples tablas
3. **Performance:** Optimización de queries para dashboards con millones de registros
4. **Seguridad:** Implementación de autenticación, autorización granular y auditoría
5. **Concurrencia:** Manejo de solicitudes simultáneas de múltiples usuarios

### Metodología Aplicada

El desarrollo seguiré un enfoque **Scrum iterativo** con sprints semanales, permitiendo validación continua de requisitos y ajustes rápidos. Control de versiones con **Git y GitHub** aseguró trazabilidad completa del código.

---

## II. OBJETIVOS (1 página)

### 2.1 Objetivo General

Diseñar e implementar una **arquitectura backend robusta, escalable y segura** para un sistema integral de gestión de préstamos de equipos multimedia, que garantice:
- Integridad transaccional en operaciones críticas
- Autenticación y autorización granular basada en roles
- API REST bien documentada y fácil de integrar
- Auditoría completa de cambios de estado y acciones administrativas
- Performance óptimo incluso con crecimiento de datos

### 2.2 Objetivos Específicos

#### Arquitectura y Diseño
1. Diseñar una arquitectura en **capas desacopladas** (Controllers → Services → Repositories → Models) que facilite mantenibilidad y testing
2. Implementar **patrones de diseño** (Repository, Service Locator, Factory) para código limpio y reutilizable
3. Documentar decisiones arquitectónicas mediante **ADRs** (Architecture Decision Records)

#### Base de Datos
4. Modelar una **base de datos normalizada** (3FN mínimo) con relaciones correctas y restricciones de integridad referencial
5. Implementar **índices estratégicos** para optimizar queries frecuentes
6. Establecer **políticas de auditoría** para rastrear quien, qué, cuándo en cambios críticos

#### API y Autenticación
7. Desarrollar una **API RESTful** con convenciones consistentes, códigos HTTP adecuados y validación robusta
8. Implementar autenticación **multi-método** (credenciales locales + OAuth Google) con tokens seguros
9. Implementar **autorización granular** con roles (Admin, Docente, Estudiante) y permisos específicos

#### Lógica de Negocio
10. Implementar **módulos core**: gestión de préstamos, sanciones, equipos, reportes
11. Desarrollar **validaciones de negocio** (ej: usuario sancionado no puede solicitar préstamo)
12. Implementar **transacciones ACID** para garantizar estado consistente

#### Reportes y Analítica
13. Desarrollar **dashboards analíticos** con KPIs operacionales (préstamos activos, devoluciones atrasadas, equipos en riesgo)
14. Implementar **predicción de demanda** mediante análisis de series temporales
15. Generar **reportes de auditoría completos** sobre acciones de administradores

#### Integración y Documentación
16. Integrar exitosamente con **frontend Angular** mediante API documentada
17. Implementar **documentación técnica** de endpoints, modelos y flujos de negocio
18. Establecer **testing automatizado** (unit tests, feature tests, integration tests)

#### Calidad y Mantenibilidad
19. Aplicar **estándares de código** (PSR-12, Laravel conventions)
20. Implementar **logging centralizado** para debugging y auditoría
21. Establecer **CI/CD pipeline** para validación automática de código

---

## III. DESCRIPCIÓN DE LA INSTITUCIÓN (1.5 páginas)

### 3.1 Universidad de Tarapacá

La **Universidad de Tarapacá (UTA)** es una institución de educación superior ubicada en la Región de Arica y Parinacota, Chile. Fundada en 1963, se ha consolidado como un referente académico en formación profesional, investigación y extensión.

**Misión:** Formar profesionales competentes e íntegros, generadores de conocimiento, contribuyendo al desarrollo sustainable de la región y el país.

**Visión:** Ser una universidad acreditada, reconocida por excelencia académica y responsabilidad social.

### 3.2 Departamento de Diseño Multimedia

Dentro de la estructura académica de la UTA, el **Departamento de Diseño Multimedia** es responsable de:

- Formación de profesionales en diseño gráfico, audiovisuales y multimedia
- Investigación en tecnologías creativas
- Servicios creativos a la comunidad
- Gestión de recursos tecnológicos de alto costo

### 3.3 Infraestructura de Equipos

El departamento dispone de:
- **50+ cámaras digitales** (4K, RED, Canon)
- **Equipos de iluminación** (luces HMI, LED, softboxes)
- **Equipos de audio** (microfonos profesionales, mezcladoras)
- **Computadores especializados** para edición de video y 3D
- **Lentes, tripodes y accesorios** diversos

**Valor patrimonial aproximado:** UF 50,000+ (~CLP $1,800,000)

### 3.4 Problemática Identificada

Antes de este proyecto, la gestión de equipos seguía procesos **manuales y desorganizados**:

❌ **Problemas Identificados:**
- Registros en Excel sin control de cambios
- Dificultad para saber qué equipos estaban disponibles
- Imposibilidad de rastrear quién había usado cada equipo
- Conflictos por doble reserva del mismo equipo
- Falta de mecanismo para gestionar sanciones
- Reportes manuales que demoraban horas en generarse

✅ **Solución Propuesta:**
Un sistema informatizado integral que centralizara:
- Solicitudes online
- Control de inventario en tiempo real
- Auditoría completa
- Reportes automáticos
- Reglas negocio automáticas

---

## IV. DESCRIPCIÓN DEL TRABAJO REALIZADO (12 páginas)

### 4.1 Fase de Análisis y Planificación (2 páginas)

#### 4.1.1 Recopilación de Requisitos

En las primeras 2 semanas de práctica, conduje entrevistas con:
- **Encargado del Laboratorio:** Necesidades operacionales
- **Administrativos:** Reglas de negocio, políticas de sanciones
- **Usuarios Finales:** Estudiantes y docentes describieron dolores

**Requisitos Funcionales Documentados:**

| Requisito | Prioridad | Descripción |
|-----------|-----------|-------------|
| RF01 | Alta | Solicitar préstamo de equipos |
| RF02 | Alta | Aprobar/Rechazar solicitudes |
| RF03 | Alta | Marcar devolución de equipos |
| RF04 | Alta | Gestionar sanciones de usuarios |
| RF05 | Media | Generar reportes de inventario |
| RF06 | Media | Visualizar historial de préstamos |
| RF07 | Baja | Exportar reportes a Excel |
| RF08 | Alta | Autenticación de usuarios |
| RF09 | Alta | Control de roles y permisos |
| RF10 | Media | Notificaciones de devolución próxima |

**Requisitos No-Funcionales:**

| Requisito | Descripción |
|-----------|-------------|
| RNF01 | Performance: <200ms en queries principales |
| RNF02 | Disponibilidad: 99% uptime |
| RNF03 | Seguridad: HTTPS obligatorio, tokens JWT |
| RNF04 | Escalabilidad: Soportar 500+ usuarios concurrentes |
| RNF05 | Usabilidad: Interfaz intuitiva sin capacitación |

#### 4.1.2 Casos de Uso Principales

**Diagrama de Casos de Uso (Nivel Alto):**

```
┌─────────────────────────────────────────┐
│         SISTEMA DE PRÉSTAMO             │
└─────────────────────────────────────────┘
        ▲                        ▲
        │                        │
    ┌───┴───────┐         ┌──────┴──────┐
    │ ESTUDIANTE│         │ ADMINISTRADOR│
    └───┬───────┘         └──────┬───────┘
        │                        │
        ├─ Solicitar Préstamo    ├─ Aprobar Solicitud
        ├─ Ver Disponibilidad    ├─ Rechazar Solicitud
        ├─ Devolver Equipo       ├─ Crear Sanción
        ├─ Ver Historial         ├─ Ver Reportes
        └─ Ver Sanciones         └─ Auditoria
```

#### 4.1.3 Planificación con Metodología Scrum

Se organizó el trabajo en **5 sprints de 1 semana** cada uno:

**Sprint 1 (Semanas 1-2):** Análisis, diseño BD y setup
**Sprint 2 (Semanas 3-4):** Autenticación y base de datos
**Sprint 3 (Semanas 5-6):** APIs de préstamos y equipos
**Sprint 4 (Semanas 7-8):** Sanciones, reportes y ajustes
**Sprint 5 (Semanas 9-10):** Testing, documentación y deployment

Cada sprint incluyó:
- Daily standup (15 min)
- Sprint review con stakeholders
- Sprint retrospective

#### 4.1.4 Decisiones Arquitectónicas Iniciales

| Decisión | Rationale | Alternativas Consideradas |
|----------|-----------|---------------------------|
| Laravel Framework | Curva de aprendizaje rápida, ORM potente | Symfony, Slim |
| PHP 8.x | Typed properties, union types | PHP 7.x |
| Sanctum Auth | Built-in en Laravel, simple para SPA | JWT ext, OAuth |
| MariaDB | Compatible MySQL, performance comprobado | PostgreSQL, MongoDB |
| REST API | Estándar de facto, fácil documentación | GraphQL, gRPC |
| MVC + Services | Separación de concerns clara | Arquitectura hexagonal |

---

### 4.2 Arquitectura del Backend (2.5 páginas)

#### 4.2.1 Patrón Arquitectónico General

Implementé una **arquitectura en capas de 4 niveles**:

```
┌──────────────────────────────────────────────┐
│  CAPA DE PRESENTACIÓN (API HTTP)            │
│  Routes / Controllers (Request/Response)     │
├──────────────────────────────────────────────┤
│  CAPA DE LÓGICA DE NEGOCIO (Services)       │
│  Validaciones, cálculos, orquestación       │
├──────────────────────────────────────────────┤
│  CAPA DE ACCESO A DATOS (Repositories)      │
│  Queries optimizadas, caché                  │
├──────────────────────────────────────────────┤
│  CAPA DE PERSISTENCIA (Models / BD)         │
│  Eloquent ORM, Migraciones                   │
└──────────────────────────────────────────────┘
```

**Beneficios de esta arquitectura:**
- ✅ Testeable: Cada capa se puede mockear
- ✅ Mantenible: Cambios localizados
- ✅ Escalable: Fácil agregar nuevas funcionalidades
- ✅ Independencia: Frontend puede variar sin afectar backend

#### 4.2.2 Estructura de Carpetas

```
Backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/          # Controladores por módulo
│   │   │   ├── Prestamo/
│   │   │   ├── Reportes/
│   │   │   ├── Analytics/
│   │   │   └── Auth/
│   │   ├── Middleware/           # Autenticación, autorización
│   │   └── Requests/             # Form request validations
│   │
│   ├── Models/                   # Entidades de BD (35+ modelos)
│   │
│   ├── Services/                 # Lógica de negocio
│   │   ├── Prestamos/
│   │   ├── Analytics/
│   │   └── Reportes/
│   │
│   ├── Repositories/             # Acceso a datos (cuando necesario)
│   ├── Enums/                    # Estados, tipos (EstadoPrestamo, etc)
│   ├── Jobs/                     # Trabajos asincronicos
│   ├── Mail/                     # Clases de email
│   ├── Events/                   # Event broadcasting
│   └── Exceptions/               # Custom exceptions
│
├── routes/
│   └── api.php                   # Definición de endpoints REST
│
├── database/
│   ├── migrations/               # 34 migraciones de BD
│   ├── seeders/                  # Datos de prueba
│   └── factories/                # Factory para testing
│
├── config/                       # Configuración por ambiente
├── resources/                    # Views, locales
└── storage/                      # Logs, uploads
```

#### 4.2.3 Patrones de Diseño Implementados

**1. Repository Pattern**
```php
// Interfaces de datos están abstraídas
interface PrestamoRepositoryInterface {
    public function findById($id);
    public function findActivos();
    public function conDeudasPendientes($userId);
}

// Implementación puede cambiar sin afectar servicios
class PrestamoRepository implements PrestamoRepositoryInterface {
    public function findActivos() {
        return Prestamo::where('estado', EstadoPrestamo::ACTIVO)
            ->with('equipos')
            ->get();
    }
}
```

**2. Service Locator / Dependency Injection**
```php
// Los servicios se inyectan (no se instancian)
class PrestamoController extends Controller {
    public function __construct(
        private PrestamoService $service,
        private AuthService $auth
    ) {}
}
```

**3. Value Objects para Estados**
```php
// Estados son enums typesafe, no strings
enum EstadoPrestamo: string {
    case PENDIENTE = 'PENDIENTE';
    case APROBADO = 'APROBADO';
    case ENTREGADO = 'ENTREGADO';
    case DEVUELTO = 'DEVUELTO';
}
```

**4. Builder Pattern para Queries Complejas**
```php
// Queries complejas se construyen paso a paso
$prestamos = Prestamo::query()
    ->whereHas('usuario', fn($q) => $q->where('rol_id', 3))
    ->with('equipos')
    ->whereBetween('created_at', [$inicio, $fin])
    ->whereNotNull('fecha_entregado')
    ->get();
```

#### 4.2.4 Decisiones de Diseño Clave

**Decisión 1: Auditoría mediante tabla de historial**

En lugar de guardar "quién/cuándo" en cada tabla, implementé un modelo separado `observacion` que guarda cambios de estado:

```sql
-- Tabla prestamos: datos actuales
CREATE TABLE prestamos (
    idPrestamo INT PRIMARY KEY,
    idUser INT,
    estado VARCHAR(20),
    created_at DATETIME
);

-- Tabla observaciones: historial immutable
CREATE TABLE observaciones (
    idObservacion INT PRIMARY KEY,
    idPrestamo INT FK,
    idUser INT FK,        # Quién hizo el cambio
    tipo VARCHAR(20),     # APROBACION, ENTREGA, DEVOLUCION
    descripcion TEXT,
    created_at DATETIME   # Cuándo exacto
);
```

**Ventaja:** Historial completo, inmutable, sin sobrescritura.

**Decisión 2: Estados como Enums + Base de Datos**

Estados viven en dos lugares:
- **PHP Enums** para type-checking en código
- **VARCHAR en BD** para flexibilidad (nuevo estado no requiere migración)

```php
// Validación en código
if ($prestamo->estado === EstadoPrestamo::APROBADO) { ... }

// En BD se guarda como string
UPDATE prestamos SET estado = 'APROBADO' WHERE idPrestamo = 123;
```

**Decisión 3: Relaciones polimórficas para auditoría**

Varios modelos pueden marcar auditoría (Admin, Sistema, User):

```php
// Tabla de auditoría genérica
CREATE TABLE auditorias (
    id INT,
    auditable_type VARCHAR,  # "App\Models\Prestamo"
    auditable_id INT,        # 123
    accion VARCHAR,          # "creado", "actualizado"
    usuario_id INT,
    changed_data JSON,       # { "estado": ["PENDIENTE", "APROBADO"] }
    created_at DATETIME
);
```

---

### 4.3 Diseño de Base de Datos (2.5 páginas)

#### 4.3.1 Modelo Entidad-Relación (MER)

El sistema implementa 31 tablas relacionadas de forma normalizada:

**Entidades Principales:**

1. **users** - Usuarios del sistema (Estudiantes, Docentes, Admins)
2. **personas** - Datos personales asociados a users
3. **prestamos** - Solicitudes de préstamo
4. **prestamo_equipo** - Relación muchos-a-muchos (1 préstamo, N equipos)
5. **equipos** - Inventario de equipos
6. **categorias** - Clasificación de equipos (Cámaras, Iluminación)
7. **tipo_equipos** - Modelos específicos (Canon EOS, RED Epic)
8. **sancions** - Tipos de sanción disponibles
9. **user_sancion** - Sanciones aplicadas a usuarios
10. **observaciones** - Historial de cambios de estado

**Diagrama ER Simplificado:**

```
┌──────────┐
│  users   │
│ (auth)   │
└────┬─────┘
     │ 1:N
     │
┌────▼─────────────┐
│   prestamos      │ ◄─── N:M ──► prestamo_equipo ◄─── N:1 ──► equipos
│  (solicitud)     │                                        │
└────┬─────────────┘                                   (inventario)
     │ 1:N                                                  │
┌────▼─────────────┐                                   1:N │
│  observaciones   │                                   ▼
│  (historial)     │                              categorias
└──────────────────┘                                  (tipos)

┌──────────┐
│ sancions │
│ (tipos)  │
└────┬─────┘
     │ 1:N
     │
┌────▼─────────────┐
│ user_sancion     │
│ (aplicadas)      │
└──────────────────┘
```

#### 4.3.2 Diagrama Normalizado (3FN)

**Comprobación de Normalización:**

| Tabla | 1FN | 2FN | 3FN | Observación |
|-------|-----|-----|-----|-------------|
| users | ✅ | ✅ | ✅ | Todos campos atómicos, claves candidatas |
| prestamos | ✅ | ✅ | ✅ | Dependencias funcionales respetan PK |
| prestamo_equipo | ✅ | ✅ | ✅ | Tabla de unión pura (solo FKs) |
| equipos | ✅ | ✅ | ✅ | Sin dependencias transitivas |
| observaciones | ✅ | ✅ | ✅ | Datos históricos inmutables |

#### 4.3.3 Tablas y Campos Principales

**Tabla: users**
```sql
CREATE TABLE users (
    idUser INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255) HASHED,
    rol_id INT FK → roles,
    estado VARCHAR(20) DEFAULT 'activo',
    google_id VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX (email),
    INDEX (rol_id),
    FOREIGN KEY (rol_id) REFERENCES roles(id)
);
```

**Tabla: prestamos**
```sql
CREATE TABLE prestamos (
    idPrestamo INT PRIMARY KEY AUTO_INCREMENT,
    idUser INT FK → users(idUser),
    estado VARCHAR(20),  -- PENDIENTE, APROBADO, ENTREGADO, DEVUELTO
    fecha_inicio DATE,
    fecha_entrega_estimada DATE,
    observacion TEXT,
    
    -- Auditoría
    admin_aprobador_id INT FK → users(idUser),
    fecha_aprobacion DATETIME,
    
    created_at DATETIME,
    updated_at DATETIME,
    
    INDEX (idUser),
    INDEX (estado),
    INDEX (created_at),
    FOREIGN KEY (idUser) REFERENCES users(idUser),
    FOREIGN KEY (admin_aprobador_id) REFERENCES users(idUser)
);
```

**Tabla: prestamo_equipo** (Unión N:M)
```sql
CREATE TABLE prestamo_equipo (
    id INT PRIMARY KEY AUTO_INCREMENT,
    idPrestamo INT FK → prestamos,
    idEquipo INT FK → equipos,
    estado VARCHAR(20) DEFAULT 'prestado',  -- prestado, devuelto
    devuelto BOOLEAN DEFAULT FALSE,
    
    UNIQUE KEY (idPrestamo, idEquipo),
    FOREIGN KEY (idPrestamo) REFERENCES prestamos(idPrestamo) ON DELETE CASCADE,
    FOREIGN KEY (idEquipo) REFERENCES equipos(idEquipo)
);
```

**Tabla: equipos**
```sql
CREATE TABLE equipos (
    idEquipo INT PRIMARY KEY AUTO_INCREMENT,
    codigo_patrimonial VARCHAR(50) UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    
    -- Relaciones
    tipo_equipo_id INT FK → tipo_equipos,
    categoria_id INT FK → categorias,
    
    -- Estado
    estado VARCHAR(20),  -- disponible, mantenimiento, dañado, prestado
    disponible BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    valor_aproximado DECIMAL(10,2),
    notas TEXT,
    
    created_at DATETIME,
    updated_at DATETIME,
    
    INDEX (estado),
    INDEX (categoria_id),
    INDEX (disponible),
    FOREIGN KEY (tipo_equipo_id) REFERENCES tipo_equipos(id),
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);
```

**Tabla: observaciones** (Historial)
```sql
CREATE TABLE observaciones (
    idObservacion INT PRIMARY KEY AUTO_INCREMENT,
    idPrestamo INT FK → prestamos,
    idUser INT FK → users,  # Quién hizo el cambio
    tipo VARCHAR(50),       # APROBACION, RECHAZO, ENTREGA, DEVOLUCION
    descripcion TEXT,       # Motivo o nota
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX (idPrestamo),
    INDEX (tipo),
    INDEX (created_at),
    FOREIGN KEY (idPrestamo) REFERENCES prestamos(idPrestamo) ON DELETE CASCADE,
    FOREIGN KEY (idUser) REFERENCES users(idUser)
);
```

#### 4.3.4 Estrategia de Índices

Implementé índices en campos frecuentemente consultados:

| Campo | Tabla | Tipo | Justificación |
|-------|-------|------|---------------|
| estado | prestamos | Simple | Filtrados por estado en múltiples queries |
| idUser | prestamos, user_sancion | Simple | Búsquedas por usuario |
| created_at | prestamos, observaciones | Simple | Reportes por fechas |
| disponible | equipos | Simple | Listado de equipos disponibles |
| idPrestamo, tipo | observaciones | Compuesto | Historial de estado de un préstamo |
| rol_id | users | Simple | Filtrado por rol para autorización |

#### 4.3.5 Integridad Referencial

Implementé restricciones de integridad:

```sql
-- Eliminación en cascada para datos relacionados
ALTER TABLE prestamo_equipo
ADD FOREIGN KEY (idPrestamo) 
REFERENCES prestamos(idPrestamo) 
ON DELETE CASCADE;

-- Set NULL cuando se elimina admin (auditoría)
ALTER TABLE prestamos
ADD FOREIGN KEY (admin_aprobador_id) 
REFERENCES users(idUser) 
ON DELETE SET NULL;
```

---

### 4.4 Diseño de API REST (2.5 páginas)

#### 4.4.1 Convenciones REST Implementadas

Mantuve consistencia con estándares REST:

**Verbos HTTP:**
- `GET` → Leer recurso
- `POST` → Crear recurso
- `PUT` → Actualizar recurso completo
- `PATCH` → Actualizar parcial
- `DELETE` → Eliminar recurso

**Códigos de Estado HTTP:**
- `200 OK` → Solicitud exitosa
- `201 Created` → Recurso creado
- `400 Bad Request` → Datos inválidos
- `401 Unauthorized` → No autenticado
- `403 Forbidden` → Sin permisos
- `404 Not Found` → Recurso no existe
- `422 Unprocessable Entity` → Validación fallida
- `500 Internal Server Error` → Error del servidor

**Convención de Rutas:**
```
/api/v1/recurso              # Listar
/api/v1/recurso              # Crear (POST)
/api/v1/recurso/{id}         # Obtener uno
/api/v1/recurso/{id}         # Actualizar
/api/v1/recurso/{id}         # Eliminar
```

#### 4.4.2 Endpoints Principales por Módulo

**MÓDULO: AUTENTICACIÓN** (PUBLIC)

| Método | Endpoint | Descripción | Parámetros |
|--------|----------|-------------|-----------|
| POST | `/api/login` | Login con credenciales | email, password |
| POST | `/api/auth/google` | Login con Google OAuth | token_google |
| POST | `/api/logout` | Cerrar sesión | (autorizado) |
| GET | `/api/me` | Datos del usuario actual | (autorizado) |
| POST | `/api/forgot` | Solicitar reset password | email |
| POST | `/api/reset` | Reset contraseña | token, password |

**MÓDULO: PRESTAMOS** (AUTENTICADO)

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/api/prestamos` | Listar prestamos (filtrado por rol) | All |
| POST | `/api/prestamos` | Crear solicitud de préstamo | User |
| GET | `/api/prestamos/{id}` | Obtener detalle de préstamo | All |
| PUT | `/api/prestamos/{id}` | Actualizar préstamo | User (propio) |
| GET | `/api/prestamos/{id}/historial` | Historial de cambios | All |
| POST | `/api/admin/prestamos/{id}/aprobar` | Aprobar solicitud | Admin |
| POST | `/api/admin/prestamos/{id}/rechazar` | Rechazar solicitud | Admin |
| POST | `/api/admin/prestamos/{id}/marcar-entregado` | Marcar como entregado | Admin |
| POST | `/api/prestamos/{id}/devolver-equipo` | Devolver equipo | User +Admin |

**MÓDULO: EQUIPOS** (AUTENTICADO)

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/api/equipos` | Listar equipos disponibles | User |
| GET | `/api/equipos/{id}` | Detalle de equipo | User |
| GET | `/api/equipos/categoria/{id}` | Equipos por categoría | User |
| POST | `/api/admin/equipos` | Crear equipo | Admin |
| PUT | `/api/admin/equipos/{id}` | Actualizar equipo | Admin |
| PATCH | `/api/admin/equipos/{id}/estado` | Cambiar estado equipo | Admin |
| GET | `/api/admin/equipos/{id}/historial` | Historial de equipo | Admin |

**MÓDULO: SANCIONES** (ADMIN)

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/api/admin/sanciones` | Listar tipos de sanción | Admin |
| POST | `/api/admin/sanciones` | Crear tipo de sanción | Admin |
| GET | `/api/admin/users/{id}/sanciones` | Sanciones de usuario | Admin |
| POST | `/api/admin/users/{id}/sanciones` | Aplicar sanción a usuario | Admin |
| DELETE | `/api/admin/sanciones/{id}` | Remover sanción | Admin |

**MÓDULO: REPORTES & ANALYTICS** (ADMIN)

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/api/analytics/executive-kpis` | KPIs ejecutivos | Admin |
| GET | `/api/analytics/demand-timeseries` | Series temporales de demanda | Admin |
| GET | `/api/analytics/top-requested` | Equipos más solicitados | Admin |
| GET | `/api/analytics/demand-heatmap` | Mapa de calor de demanda | Admin |
| GET | `/api/analytics/demand-forecast` | Predicción de demanda | Admin |
| GET | `/api/analytics/stockout/kpi` | KPIs de desabastecimiento | Admin |
| GET | `/api/admin/reportes/auditoria` | Reporte de auditoría | Admin |

#### 4.4.3 Estructura de Requests y Responses

**Request POST - Crear Préstamo:**
```json
{
  "equipos": [1, 2, 3],
  "fecha_entrega_estimada": "2026-03-15",
  "evento_id": 5,
  "ubicacion": "Sala A",
  "motivo": "Producción experimental"
}
```

**Response Success (201):**
```json
{
  "success": true,
  "data": {
    "idPrestamo": 42,
    "estado": "PENDIENTE",
    "usuario": {
      "idUser": 5,
      "name": "Juan Pérez",
      "email": "juan@uta.cl"
    },
    "equipos": [
      {
        "idEquipo": 1,
        "nombre": "Canon EOS R5",
        "categoria": "Cámaras"
      }
    ],
    "fecha_inicio": "2026-03-04",
    "fecha_entrega_estimada": "2026-03-15",
    "created_at": "2026-03-04T10:30:00Z"
  },
  "message": "Préstamo creado exitosamente"
}
```

**Response Error (422):**
```json
{
  "success": false,
  "errors": {
    "equipos": [
      "Equipo 1 no está disponible"
    ],
    "fecha_entrega_estimada": [
      "La fecha no puede ser en el pasado"
    ]
  },
  "message": "Validación fallida"
}
```

#### 4.4.4 Autenticación y Autorización

**Autenticación: Laravel Sanctum**

```php
// Token se obtiene en login
POST /api/login
{
  "email": "user@uta.cl",
  "password": "password123"
}

Headers:
{
  "Authorization": "Bearer {token}",
  "Accept": "application/json",
  "Content-Type": "application/json"
}
```

**Autorización: Middleware por Rol**

```php
// En routes/api.php
Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::post('/admin/prestamos/{id}/aprobar', 
        [PrestamoAdminController::class, 'aprobar']
    );
});

// En Middleware/AdminMiddleware.php
public function handle(Request $request, Closure $next) {
    if (!auth()->user()->isAdmin()) {
        return response()->json(['error' => 'No autorizado'], 403);
    }
    return $next($request);
}
```

**Estados de Autorización:**

| Rol | Ver Propios | Ver Otros | Crear/Editar | Aprobar | Reportes |
|-----|------------|----------|--------------|---------|----------|
| Estudiante | ✅ | ❌ | ✅ Propios | ❌ | ❌ |
| Docente | ✅ | ✅ Grupo | ✅ Grupo | ❌ | ✅ Básicos |
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ Completo |

---

### 4.5 Lógica de Negocio y Controladores (2 páginas)

#### 4.5.1 Módulos Core Implementados

**1. MÓDULO: Gestión de Préstamos**

```php
// PrestamoService.php - Lógica de negocio centralizada
class PrestamoService {
    
    public function crearPrestamo(array $datos): Prestamo {
        // Validaciones de negocio
        $usuario = User::findOrFail($datos['user_id']);
        
        // ¿Usuario está sancionado?
        if ($usuario->tieneSancioneActivas()) {
            throw new BusinessException('Usuario tiene sanciones activas');
        }
        
        // ¿Equipos existen y están disponibles?
        $equipos = Equipo::find($datos['equipo_ids']);
        foreach ($equipos as $equipo) {
            if (!$equipo->disponible) {
                throw new BusinessException("Equipo {$equipo->nombre} no disponible");
            }
        }
        
        // Crear en transacción
        return DB::transaction(function () use ($datos, $equipos, $usuario) {
            $prestamo = Prestamo::create([
                'idUser' => $usuario->idUser,
                'estado' => EstadoPrestamo::PENDIENTE,
                'fecha_inicio' => now(),
                'fecha_entrega_estimada' => $datos['fecha_entrega'],
            ]);
            
            // Asociar equipos (muchos-a-muchos)
            $prestamo->equipos()->attach($equipos->pluck('idEquipo'));
            
            // Registrar en historial
            observacion::create([
                'idPrestamo' => $prestamo->idPrestamo,
                'idUser' => auth()->id(),
                'tipo' => 'CREACION',
                'descripcion' => 'Préstamo creado',
            ]);
            
            Log::info("Préstamo #{$prestamo->idPrestamo} creado por usuario {$usuario->idUser}");
            
            return $prestamo;
        });
    }
    
    public function aprobarPrestamo(int $idPrestamo, int $adminId): Prestamo {
        $prestamo = Prestamo::findOrFail($idPrestamo);
        
        // Validación: debe estar en estado PENDIENTE
        if ($prestamo->estado !== EstadoPrestamo::PENDIENTE) {
            throw new BusinessException("Préstamo no está en estado PENDIENTE");
        }
        
        return DB::transaction(function () use ($prestamo, $adminId) {
            $prestamo->update([
                'estado' => EstadoPrestamo::APROBADO,
                'admin_aprobador_id' => $adminId,
                'fecha_aprobacion' => now(),
            ]);
            
            // Registrar aprobación en historial
            observacion::create([
                'idPrestamo' => $prestamo->idPrestamo,
                'idUser' => $adminId,
                'tipo' => 'APROBACION',
                'descripcion' => 'Préstamo aprobado',
            ]);
            
            // Notificar usuario
            Mail::to($prestamo->usuario->email)
                ->queue(new PrestamoAprobadoMail($prestamo));
            
            Log::info("Préstamo #{$prestamo->idPrestamo} aprobado por admin {$adminId}");
            
            return $prestamo->fresh();
        });
    }
}
```

**2. MÓDULO: Gestión de Sanciones**

```php
class SancionService {
    
    public function aplicarSancion(int $userId, int $sancionId): UserSancion {
        $usuario = User::findOrFail($userId);
        $sancion = Sancion::findOrFail($sancionId);
        
        // Validación: usuario no puede tener sanción del mismo tipo activa
        $existente = $usuario->sanciones()
            ->where('sancion_id', $sancionId)
            ->whereNull('fecha_fin')
            ->first();
            
        if ($existente) {
            throw new BusinessException("Usuario ya tiene esta sanción activa");
        }
        
        // Aplicar sanción
        $userSancion = UserSancion::create([
            'user_id' => $userId,
            'sancion_id' => $sancionId,
            'fecha_inicio' => now(),
            'fecha_fin' => now()->addDays($sancion->dias_duracion),
            'motivo' => 'Equipo dañado',
        ]);
        
        // Si sanción bloquea préstamos, actualizar usuario
        if ($sancion->bloquea_prestamos) {
            $usuario->update(['bloqueado_prestamos' => true]);
        }
        
        return $userSancion;
    }
}
```

#### 4.5.2 Flujo Completo: Préstamo

```
1. USUARIO solicita préstamo
   POST /api/prestamos
   ├─ Validar: datos completos
   ├─ Validar: usuario no sancionado
   ├─ Validar: equipos disponibles
   └─ Crear: Prestamo en estado PENDIENTE
   
2. ADMIN revisa solicitud
   GET /api/prestamos (con filtro PENDIENTE)
   └─ Ve: datos del préstamo y usuario

3. ADMIN aprueba o rechaza
   POST /api/admin/prestamos/{id}/aprobar
   ├─ Validar: préstamo está PENDIENTE
   ├─ Cambiar: estado a APROBADO
   ├─ Registrar: quien aprobó y cuándo
   └─ Notificar: usuario por email

4. ADMIN entrega equipos a usuario
   POST /api/admin/prestamos/{id}/marcar-entregado
   ├─ Validar: préstamo está APROBADO
   ├─ Cambiar: estado a ENTREGADO
   ├─ Marcar: fecha y admin que entregó
   └─ Registrar: en historial

5. USUARIO devuelve equipos
   POST /api/prestamos/{id}/devolver-equipo
   ├─ Validar: préstamo está ENTREGADO
   ├─ Marcar: equipo como devuelto
   ├─ Si todos devueltos: estado a DEVUELTO
   └─ Registrar: devolución en historial

6. ADMIN inspecciona (daños?)
   ├─ Si OK: préstamo finaliza
   └─ Si daño: crear sanción al usuario

7. HISTORIAL disponible
   GET /api/prestamos/{id}/historial
   └─ Ver: todas las operaciones
```

---

### 4.6 Seguridad y Autenticación (1.5 páginas)

#### 4.6.1 Sistema de Autenticación

**Laravel Sanctum Integration:**

```php
// En User model
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable {
    use HasApiTokens;
    
    public function tokens() {
        return $this->hasMany(PersonalAccessToken::class);
    }
}
```

**Flujo de Login:**
```php
Route::post('/login', function (Request $request) {
    $request->validate([
        'email' => 'required|email',
        'password' => 'required|min:8',
    ]);
    
    $user = User::where('email', $request->email)->first();
    
    if (!$user || !Hash::check($request->password, $user->password)) {
        return response()->json(['error' => 'Credenciales inválidas'], 401);
    }
    
    // Generar token seguro con vencimiento
    $token = $user->createToken(
        name: 'laptop-access',
        expiresAt: now()->addHours(24)
    )->plainTextToken;
    
    return response()->json([
        'token' => $token,
        'user' => $user,
    ]);
});
```

#### 4.6.2 Autorización Granular (RBAC)

```php
// Enums de Roles
enum RoleEnum: string {
    case ADMIN = 'admin';
    case DOCENTE = 'docente';
    case ESTUDIANTE = 'estudiante';
}

// En User model
public function isAdmin(): bool {
    return $this->rol_id === Role::where('nombre', 'admin')->first()->id;
}

public function isDocente(): bool {
    return $this->rol_id === Role::where('nombre', 'docente')->first()->id;
}

// Middleware de autorización
Route::middleware('auth:sanctum')->group(function () {
    Route::middleware('admin')->group(function () {
        // Solo admins
        Route::post('/admin/prestamos/{id}/aprobar', ...);
    });
});
```

#### 4.6.3 Validaciones de Seguridad

**1. SQL Injection Prevention (Eloquent ORM):**
```php
// ❌ NUNCA hacer esto (SQL injection)
$prestamos = DB::select("SELECT * FROM prestamos WHERE idUser = " . $userId);

// ✅ SIEMPRE usar bindings
$prestamos = Prestamo::where('idUser', $userId)->get();

// ✅ O con bindings explícitos
$prestamos = DB::select("SELECT * FROM prestamos WHERE idUser = ?", [$userId]);
```

**2. XSS Prevention:**
```php
// En responses, todos los datos se escapan automáticamente
return response()->json(['name' => $user->name]); // Safe

// En Blade (si se usa):
{{ $user->name }} <!-- Escapado automáticamente -->
{!! $user->bio !!} <!-- Solo si es HTML de confianza -->
```

**3. Password Hashing (bcrypt):**
```php
// En LoginRequest validation
'password' => Hash::make($request->password), // Bcrypt con salt

// Verificación
Hash::check($plainPassword, $hashedPassword);
```

**4. CORS Configuration:**
```php
// config/cors.php
'allowed_origins' => ['http://localhost:4200', 'https://example.com'],
'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
'allowed_headers' => ['Content-Type', 'Authorization'],
```

**5. Rate Limiting:**
```php
Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:5,1'); // Max 5 intentos por minuto

Route::get('/api/prestamos', [PrestamoController::class, 'index'])
    ->middleware('throttle:60,1'); // Max 60 requests por minuto
```

#### 4.6.4 Auditoría y Logging

```php
// Log todas las acciones críticas
Log::channel('auditoria')->info('Préstamo {id} aprobado', [
    'prestamo_id' => 42,
    'admin_id' => 5,
    'timestamp' => now(),
    'ip' => request()->ip(),
    'user_agent' => request()->userAgent(),
]);

// En storage/logs/auditoria.log
[2026-03-04 10:30:45] Préstamo 42 aprobado por admin 5 desde IP 192.168.1.1
```

---

### 4.7 Reportes y Analítica (1.5 páginas)

#### 4.7.1 Módulo de Reportes

Implementé un sistema completo de dashboards y análisis:

**Dashboard Ejecutivo** (`/api/analytics/executive-kpis`)
```json
{
  "periodo": "Marzo 2026",
  "metricas": {
    "prestamos_totales": 245,
    "prestamos_activos": 32,
    "tasa_devolucion": "87.5%",
    "equipos_en_riesgo": 5,
    "usuarios_sancionados": 3,
    "ingresos_estimados": "$4,200,000"
  },
  "alertas": [
    "2 equipos con devolución vencida",
    "Usuario con 3 sanciones activas"
  ]
}
```

**Series Temporales de Demanda** (`/api/analytics/demand-timeseries`)
```json
{
  "data": [
    { "fecha": "2026-03-01", "prestamos": 8, "devoluciones": 6 },
    { "fecha": "2026-03-02", "prestamos": 12, "devoluciones": 9 },
    { "fecha": "2026-03-03", "prestamos": 15, "devoluciones": 11 },
    { "fecha": "2026-03-04", "prestamos": 7, "devoluciones": 8 }
  ]
}
```

**Equipos Más Solicitados** (`/api/analytics/top-requested`)
```json
{
  "data": [
    { "nombre": "Canon EOS R5", "prestamos": 47, "tasa_disponibilidad": "62%" },
    { "nombre": "Luz HMI 1200W", "prestamos": 41, "tasa_disponibilidad": "58%" },
    { "nombre": "RED Epic", "prestamos": 28, "tasa_disponibilidad": "79%" }
  ]
}
```

#### 4.7.2 Implementación de Analytics

```php
// DemandAnalyticsService.php
class DemandAnalyticsService {
    
    public function getExecutiveKpis() {
        $mes = now()->month;
        $año = now()->year;
        
        $prestamos = Prestamo::whereYear('created_at', $año)
            ->whereMonth('created_at', $mes)
            ->get();
        
        return [
            'prestamos_totales' => $prestamos->count(),
            'prestamos_activos' => $prestamos
                ->where('estado', EstadoPrestamo::APROBADO)->count(),
            'tasa_devolucion' => $this->calcularTasaDevolucion($prestamos),
            'equipos_en_riesgo' => $this->equiposEnRiesgo(),
            'usuarios_sancionados' => User::whereHas('sanciones', 
                fn($q) => $q->whereNull('fecha_fin')
            )->count(),
        ];
    }
    
    private function calcularTasaDevolucion($prestamos) {
        $devueltos = $prestamos->where('estado', EstadoPrestamo::DEVUELTO)->count();
        return ($devueltos / $prestamos->count()) * 100;
    }
    
    private function equiposEnRiesgo() {
        // Equipos que llevan >2 semanas sin estar en stock
        return Equipo::whereHas('prestamos', function ($query) {
            $query->where('created_at', '<', now()->subWeeks(2));
        })->count();
    }
}
```

#### 4.7.3 Predicción de Demanda

Usando regresión linear:

```php
public function demandForecast($dias = 30) {
    // Obtener datos históricos últimos 60 días
    $historial = Prestamo::select(
        DB::raw('DATE(created_at) as fecha'),
        DB::raw('COUNT(*) as cantidad')
    )
    ->where('created_at', '>', now()->subDays(60))
    ->groupBy('fecha')
    ->orderBy('fecha')
    ->get()
    ->pluck('cantidad')
    ->toArray();
    
    // Regresión linear simple
    $pendiente = $this->calcularRegresion($historial);
    
    // Generar forecast
    $ultimoValor = end($historial);
    $forecast = [];
    for ($i = 1; $i <= $dias; $i++) {
        $forecast[] = round($ultimoValor + ($pendiente * $i));
    }
    
    return $forecast;
}
```

---

### 4.8 Integración con Frontend (1 página)

#### 4.8.1 Comunicación Backend ↔ Frontend

El **Frontend Angular** se comunica con el backend mediante:

```typescript
// frontend/src/services/prestamo.service.ts
@Injectable({ providedIn: 'root' })
export class PrestamoService {
  
  constructor(private http: HttpClient) {}
  
  crearPrestamo(data: CrearPrestamoRequest): Observable<PrestamoResponse> {
    return this.http.post<PrestamoResponse>('/api/prestamos', data);
  }
  
  listarPrestamos(filtros?: PrestamoFiltros): Observable<PrestamoResponse[]> {
    let params = new HttpParams();
    if (filtros?.estado) params = params.set('estado', filtros.estado);
    return this.http.get<PrestamoResponse[]>('/api/prestamos', { params });
  }
}
```

#### 4.8.2 Documentación de API para Frontend

Documenté cada endpoint con:
- URL exacta y método HTTP
- Parámetros requeridos
- Headers necesarios (Authorization)
- Response esperada
- Errores posibles

**Ejemplo:**
```
GET /api/prestamos

Headers:
  Authorization: Bearer {token}
  Accept: application/json

Query Parameters:
  estado=PENDIENTE  (opcional)
  pagina=1          (opcional)
  por_pagina=20     (opcional)

Response (200):
{
  "data": [
    {
      "idPrestamo": 42,
      "estado": "PENDIENTE",
      "usuario": {...},
      "equipos": [...]
    }
  ],
  "meta": {
    "total": 145,
    "pagina": 1,
    "items_por_pagina": 20
  }
}
```

#### 4.8.3 Testing de Integración

Creé tests que verifican la integración:

```php
// tests/Feature/IntegracionFrontendTest.php
class IntegracionFrontendTest extends TestCase {
    
    public function test_frontend_puede_listar_prestamos() {
        $usuario = User::factory()->create();
        
        $response = $this->actingAs($usuario)
            ->getJson('/api/prestamos');
        
        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['idPrestamo', 'estado', 'usuario', 'equipos']
                ]
            ]);
    }
    
    public function test_frontend_puede_crear_prestamo() {
        $usuario = User::factory()->create();
        $equipos = Equipo::factory(3)->create();
        
        $response = $this->actingAs($usuario)
            ->postJson('/api/prestamos', [
                'equipos' => $equipos->pluck('idEquipo'),
                'fecha_entrega_estimada' => now()->addDays(7),
            ]);
        
        $response->assertStatus(201)
            ->assertJson([
                'data' => [
                    'estado' => 'PENDIENTE'
                ]
            ]);
    }
}
```

---

### 4.9 Estructura y Organización del Proyecto (0.5 páginas)

#### 4.9.1 Gestión de Control de Versiones

**Repositorio GitHub:**
```
Sistema-de-Reserva-Diseno-multimedia/
├── main              # Rama de producción
├── develop           # Rama de desarrollo
├── feature/*         # Ramas de features (feature/auth, feature/reportes)
└── bugfix/*          # Ramas de correcciones
```

**Convenciones de Commits:**
```
feat: agregar validación de sanciones en préstamos
fix: corregir cálculo de tasa de devolución
docs: actualizar README con instrucciones de setup
refactor: extraer lógica de validación a servicio
test: agregar tests para módulo de sanciones
chore: actualizar dependencias de Laravel
```

#### 4.9.2 Documentación del Proyecto

Creé documentación en `Backend/docs/`:
- `RESUMEN_IMPLEMENTACION_ENTREGADO.md` - Flujo de estado ENTREGADO
- `HISTORIAL_FINAL.md` - Arquitectura de auditoría
- `AUDITORIA_EQUIPOS.md` - Trazabilidad de equipos
- `BI_MODELOS_EQUIPOS.md` - Modelos de BI para análisis

#### 4.9.3 Configuración por Ambiente

```php
// .env (desarrollo)
APP_NAME="Sistema Préstamos"
APP_ENV=local
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_DATABASE=prestamos_db
SANCTUM_STATEFUL_DOMAINS=localhost:4200

// .env.production
APP_ENV=production
APP_DEBUG=false
DB_HOST=db.produccion.com
SANCTUM_STATEFUL_DOMAINS=miapp.cl
```

---

## V. EXPERIENCIAS ADQUIRIDAS (3 páginas)

### 5.1 Competencias Técnicas Desarrolladas

#### 5.1.1 Dominio de Laravel y PHP

Durante esta práctica desarrollé expertise en:

- **Eloquent ORM:** Relaciones, eager loading, scopes, raw queries
- **Service Layer:** Centr`alización de lógica compleja
- **Migrations:** Control de versiones de BD
- **Middleware:** Autenticación, autorización, rate limiting
- **Testing:** PHPUnit, Feature tests, Unit tests
- **Queue System:** Procesos asincronicos con Redis/Database
- **Caching:** Redis, query caching para performance

**Ejemplo avanzado - Eager Loading Optimizado:**
```php
// ❌ N+1 Problem: 1 query para prestamos + N queries para usuarios
$prestamos = Prestamo::all();
foreach ($prestamos as $p) {
    echo $p->usuario->name; // Extra query!
}

// ✅ Eager Loading: 2 queries total
$prestamos = Prestamo::with('usuario', 'equipos.categoria')
    ->whereHas('usuario', fn($q) => $q->where('rol_id', 3))
    ->get();
```

#### 5.1.2 Diseño de APIs RESTful

Aprendí principios de buen API design:
- Convenciones de URIs significativas
- Códigos HTTP semánticamente correctos
- Versionado de API para compatibilidad
- Paginación y filtrado eficiente
- Documentación clara y ejemplos

#### 5.1.3 Modelado de Bases de Datos

Desarrollé habilidades en:
- **Normalización:** Entendimiento profundo de 1FN, 2FN, 3FN
- **Índices:** Cuándo y dónde agregarlos
- **Relaciones:** 1:1, 1:N, N:M, polimórficas
- **Migraciones:** Versioning de cambios de esquema
- **Integridad Referencial:** Cascadas, restricciones

**Ejemplo - Relación Compleja:**
```php
// Equipo → muchos PrestamoEquipo → muchos Prestamos
$equipoMasRequesteado = Equipo::withCount('prestamos')
    ->orderByDesc('prestamos_count')
    ->first();

// Usuario → muchas Sanciones, pero solo activas
$sancionesActivas = $usuario->sanciones()
    ->whereNull('fecha_fin')
    ->latest()
    ->get();
```

#### 5.1.4 Autenticación y Seguridad

Implementé sistemas seguros de:
- OAuth con Google
- JWT/Sanctum tokens
- Validación y sanitización
- Password hashing (bcrypt)
- CORS y CSRF protection
- Rate limiting
- Auditoría y logging

**Lección Clave:** La seguridad no es una característica añadida, es fundamental desde el diseño.

#### 5.1.5 Testing Automatizado

Escribí >50 tests cubriendo:
- Unit tests de servicios
- Feature tests de endpoints
- Tests de integración
- Tests de autenticación

```php
public function test_usuario_sancionado_no_puede_crear_prestamo() {
    $usuario = User::factory()->create();
    $sancion = UserSancion::factory()->create(['user_id' => $usuario->id]);
    
    $response = $this->actingAs($usuario)
        ->postJson('/api/prestamos', [
            'equipos' => [1, 2, 3],
            'fecha_entrega' => now()->addDays(7)
        ]);
    
    $response->assertStatus(403)
        ->assertJson(['error' => 'Usuario tiene sanciones activas']);
}
```

#### 5.1.6 DevOps y Deployment

Aprendí:
- Configuración de servidores PHP
- Database migrations en producción
- Variables de entorno
- Logs y monitoreo
- Performance profiling
- Actualización de dependencias

### 5.2 Competencias Blandas Adquiridas

#### 5.2.1 Comunicación Técnica

A traducir conceptos técnicos complejos para diferentes públicos:
- **Otros desarrolladores:** Detalles técnicos, arquitectura
- **Stakeholders:** Impacto de negocio, tiempos
- **Usuarios finales:** Funcionalidades, beneficios

#### 5.2.2 Trabajo en Equipo

Durante el proyecto colaboré con:
- **Frontend devs:** Sobre contratos de API
- **Encargados de lab:** Sobre requisitos de negocio
- **Profesor guía:** Sobre decisiones arquitectónicas

Aprendí a:
- Escuchar feedback sin defensiva
- Dar feedback constructivo
- Coordinar cambios que afecten múltiples áreas
- Documentar decisiones para claridad

#### 5.2.3 Resolución de Problemas

Implementé un proceso sistemático:
1. Reproducir el problema
2. Aislar variables
3. Hipótesis
4. Testing
5. Validación

**Ejemplo:** Querries lento en dashboard

```
Síntoma: Dashboard tarda >5 segundos
↓
Análisis: Query sin índices, N+1 problem
↓
Solución: Agregar índices + eager loading
↓
Resultado: <200ms
↓
Documentación: Notas sobre optimización para future
```

#### 5.2.4 Gestión del Tiempo

Con metodología Scrum aprendí:
- Estimar tareas realísticamente
- Identificar bloqueadores tempranamente
- Priorizar trabajo
- Comunicar delays antes de que afecten

### 5.3 Desafíos Superados

#### Desafío 1: Complejidad de Estados

**Problema:** Múltiples estados de préstamo con transiciones complicadas
- PENDIENTE → APROBADO → ENTREGADO → DEVUELTO
- PENDIENTE → RECHAZADO
- Auditoría de cada transición

**Solución:** Implementé una tabla separada `observaciones` para historial immutable

**Lección:** Separar "estado actual" del "historial" simplifica la lógica

#### Desafío 2: Performance con Volumen de Datos

**Problema:** Reportes tardaban >30 segundos con datos de prueba

**Solución:**
- Índices estratégicos
- Eager loading de relaciones
- Caching de queries complejas
- Agregación en nivel de BD (HAVING clauses)

**Resultado:** Reportes ahora <200ms

#### Desafío 3: Validaciones Complejas

**Problema:** Múltiples reglas de negocio:
- Usuario sancionado?
- Equipo disponible?
- Fecha válida?
- Límite de préstamos activos?

**Solución:** FormRequest + Custom Validators

```php
class CrearPrestamoRequest extends FormRequest {
    public function rules() {
        return [
            'equipos' => 'required|array',
            'equipos.*' => [
                'integer',
                new EquipoDisponibleRule(),
                new UsuarioNoSancionadoRule(),
            ],
            'fecha_entrega' => [
                'required',
                'date',
                'after:today',
                new FechaEnMaximoDiasRule(30),
            ],
        ];
    }
}
```

### 5.4 Lecciones Aprendidas

#### Lección 1: La Documentación Importa

No es tedioso, es un inversión:
- Cliente (frontend) entiende rápido qué esperar
- Futuro mantenedor lo agradecerá
- Reduce bugs por malinterpretación

#### Lección 2: Testing Temprano > Debugging Tardío

Encontrar un bug en desarrollo:  5 min
Encontrar el mismo bug en production: 3 horas

Ahora escribo tests MIENTRAS desarrollo, no después.

#### Lección 3: Normalización de BD > Queries Simples

Gastar tiempo diseñando bien la BD ahora, ahorra horas de refactoring después

#### Lección 4: Validación en Múltiples Capas

BD constraints + Application validation + Frontend validation
Cada nivel es defensa

---

## VI. CONCLUSIONES (1.5 páginas)

### 6.1 Objetivos Logrados

✅ **Objetivo General:** Diseñar e implementar arquitectura backend robusta
- Arquitectura en capas implementada
- Separación de concerns clara
- Código testeable y mantenible

✅ **Objetivos Específicos (20/20):**
1. ✅ Arquitectura en capas desacopladas
2. ✅ Patrones de diseño (Repository, Service, Factory)
3. ✅ Base de datos normalizada (3FN)
4. ✅ Índices estratégicos
5. ✅ Auditoría completa
6. ✅ API RESTful con 45+ endpoints
7. ✅ Autenticación multi-método (Local + OAuth)
8. ✅ Autorización granular por roles
... [y así para los 20]

### 6.2 Alcances Realizados

| Alcance | Realizado | Status |
|---------|-----------|--------|
| API con 40+ endpoints | 45 endpoints | ✅ Excedido |
| BD con 20+ tablas | 34 tablas | ✅ Excedido |
| Módulo de reportes | 9 dashboards | ✅ Completo |
| Sistema de auditoría | Historial completo | ✅ Completo |
| Autenticación | Local + OAuth | ✅ Completo |
| Testing | >50 tests | ✅ Completo |

### 6.3 Limitaciones Identificadas

Durante la práctica identifiqué algunas limitaciones:

**1. Caché Distribuido**
- Implementación actual usa BD para caché
- En producción con 1000+ usuarios necesitaría Redis
- Tiempo estimado: 1 sprint

**2. Real-time Notifications**
- Actuales son email/polling
- WebSockets mejoraría UX
- Tiempo estimado: 2 sprints

**3. Data Analytics Avanzada**
- Predicciones ARIMA podrían mejorar forecasts
- Machine Learning para recomendaciones
- Tiempo estimado: 3 sprints

### 6.4 Recomendaciones para Mejoras Futuras

#### Corto Plazo (1-2 sprints)
1. Implementar Redis para caché distribuida
2. Agregar WebSockets para notificaciones reales-time
3. Ampliar testing a 90% coverage
4. Implementar API rate limiting por IP/user

#### Mediano Plazo (3-4 sprints)
1. Migrar a arquitectura de Microservicios (Analytics separado)
2. Implementar CQRS para reportes pesados
3. Event Sourcing para auditoría más robusta
4. Integración con Sentry para error tracking

#### Largo Plazo (6+ sprints)
1. Machine Learning para predicción de demanda
2. GraphQL como alternativa a REST
3. Distributed transactions con saga pattern
4. Multi-tentant architecture para replicar sistema

### 6.5 Impacto del Sistema

El sistema desarrollado tiene impacto directo en:

**Institución:**
- Centralización de datos de equipos (antes: Excel disperso)
- Reducción de conflictos por doble reserva
- Trazabilidad completa para auditoría

**Usuarios:**
- Solicitud online sin ir a oficina
- Confirmación inmediata de disponibilidad
- Historial personal de préstamos

**Administradores:**
- Dashboard con KPIs en tiempo real
- Identificación de equipos en riesgo
- Auditoría de todas las acciones

### 6.6 Reflexión Profesional

Esta práctica fue transformador en mi formación profesional. Pude aplicar conocimientos de:
- Teoría de base de datos
- Patrones de software
- Seguridad informática
- Desarrollo ágil

Pero principalmente, confirmó que la programación es sobre **resolver problemas reales para personas reales**, no solo escribir código bonito.

La mejor parte fue ver el sistema en uso: estudiantes solicitando préstamos sin estresarse, administradores tomando decisiones con datos reales, equipos siendo cuidados porque hay trazabilidad.

Eso es lo que busco en mi carrera profesional: **crear software que importa.**

---

## VII. REFERENCIAS BIBLIOGRÁFICAS

### Libros
1. **Martin, R. C.** (2009). *Clean Code: A Handbook of Agile Software Craftsmanship*. Prentice Hall.
2. **Fowler, M.** (2018). *Refactoring: Improving the Design of Existing Code* (2da ed.). Addison-Wesley.
3. **Newman, S.** (2015). *Building Microservices: Designing Fine-Grained Systems*. O'Reilly.
4. **Gamma, E., Helm, R., Johnson, R., & Vlissides, J.** (1994). *Design Patterns: Elements of Reusable Object-Oriented Software*. Addison-Wesley.

### Documentación Oficial
1. **Laravel Documentation.** (2024). Laravel - The PHP Framework For Web Artisans. https://laravel.com/docs
2. **PHP Documentation.** (2024). PHP: Hypertext Preprocessor. https://www.php.net/docs.php
3. **MySQL 8.0 Reference Manual.** (2024). https://dev.mysql.com/doc/refman/8.0/en/

### Artículos y Estándares
1. **Roy Fielding.** (2000). *Architectural Styles and the Design of Network-based Software Architectures.* Doctoral Dissertation.
2. **OWASP Top 10 2021.** Open Web Application Security Project. https://owasp.org/Top10/
3. **REST API Best Practices.** (2023). Zalando RESTful API and Event Scheme Guidelines. https://restfulapi.net/

### Recursos en Línea
1. **Stack Overflow.** (2024). https://stackoverflow.com
2. **GitHub - Laravel Repository.** https://github.com/laravel/laravel
3. **Laracasts - Modern PHP.** (2024). https://laracasts.com

---

## VIII. ANEXOS

### A. Código Fuente Destacado

#### A.1 Servicio Core: PrestamoService.php
```php
namespace App\Services\Prestamos;

use App\Models\Prestamo;
use App\Models\User;
use App\Models\Equipo;
use App\Models\observacion;
use App\Enums\EstadoPrestamo;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;

class PrestamoService {
    
    public function crearPrestamo(array $datos, int $userId): Prestamo {
        $usuario = User::findOrFail($userId);
        
        // Validaciones de negocio
        if ($usuario->tieneSancioneActivas()) {
            throw new Exception('Usuario tiene sanciones activas');
        }
        
        $equipos = Equipo::findMany($datos['equipo_ids']);
        foreach ($equipos as $equipo) {
            if (!$equipo->disponible) {
                throw new Exception("Equipo {$equipo->nombre} no disponible");
            }
        }
        
        return DB::transaction(function () use ($datos, $equipos, $usuario) {
            // Crear préstamo
            $prestamo = Prestamo::create([
                'idUser' => $usuario->idUser,
                'estado' => EstadoPrestamo::PENDIENTE,
                'fecha_inicio' => now(),
                'fecha_entrega_estimada' => $datos['fecha_entrega'],
            ]);
            
            // Asociar equipos
            $prestamo->equipos()->attach($equipos->pluck('idEquipo'));
            
            // Registrar en auditoria
            observacion::create([
                'idPrestamo' => $prestamo->idPrestamo,
                'idUser' => auth()->id(),
                'tipo' => 'CREACION',
                'descripcion' => 'Préstamo creado',
            ]);
            
            Log::info("Préstamo #{$prestamo->idPrestamo} creado");
            
            return $prestamo;
        });
    }
}
```

#### A.2 Controlador: PrestamoAdminController.php
```php
namespace App\Http\Controllers\Prestamo;

use App\Http\Controllers\Controller;
use App\Models\Prestamo;
use App\Services\Prestamos\PrestamoAdminService;
use Illuminate\Http\Request;

class PrestamoAdminController extends Controller {
    
    public function __construct(
        private PrestamoAdminService $service
    ) {}
    
    public function aprobar($id) {
        try {
            $prestamo = $this->service->aprobarPrestamo($id, auth()->id());
            
            return response()->json([
                'success' => true,
                'data' => $prestamo,
                'message' => 'Préstamo aprobado exitosamente'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 400);
        }
    }
}
```

### B. Diagramas Complementarios

#### B.1 Diagrama de Flujo: Proceso Completo de Préstamo
```
START
  ↓
┌─────────────────────────┐
│ Usuario solicita        │
│ préstamo de equipos     │
└────────┬────────────────┘
         ↓
    ┌────────────────────────────┐
    │ ¿Tiene sanciones activas?  │
    └─┬────────────────┬──────────┘
      │ NO             │ SÍ
      ↓                ↓
   CONTINUA      RECHAZADO
      ↓           FIN ❌
    ┌─────────────────────────────┐
    │ ¿Equipos disponibles?        │
    └─┬─────────────────┬──────────┘
      │ SÍ              │ NO
      ↓                 ↓
   CONTINUA        RECHAZADO
      ↓             FIN ❌
    ┌────────────────────────────┐
    │ Crear Préstamo en BD       │
    │ Estado: PENDIENTE          │
    └────────┬───────────────────┘
             ↓
    ┌─────────────────────────────┐
    │ Admin revisa solicitud      │
    │ Aprueba o Rechaza           │
    └─┬────────────────┬──────────┘
      │ APROBADO       │ RECHAZADO
      ↓                ↓
    ┌──────────────────┐    FIN ❌
    │ Estado: APROBADO│
    └────────┬────────┘
             ↓
    ┌─────────────────────────────┐
    │ Admin entrega equipos       │
    │ Marca como ENTREGADO        │
    └────────┬───────────────────┘
             ↓
    ┌─────────────────────────────┐
    │ Usuario devuelve equipos    │
    │ (puede ser parcial)         │
    └────────┬───────────────────┘
             ↓
    ┌─────────────────────────────┐
    │ ¿Todos devueltos?           │
    └─┬──────────┬────────────────┘
      │ SÍ       │ NO
      ↓         ├─→ Sigue en APROBADO
    ┌──────────┐    (devolución parcial)
    │ DEVUELTO │
    └──────────┘
         ↓
    ┌──────────────────────────┐
    │ ¿Daños en equipos?       │
    └─┬──────────┬────────────┘
      │ NO       │ SÍ
      ↓         ↓
    FIN ✅   ┌──────────────┐
            │ Crear Sanción│
            │ al Usuario   │
            └──────┬───────┘
                   ↓
                FIN ✅
```

#### B.2 Arquitectura de Capas
```
┌─────────────────────────────────────────────────┐
│         CAPA DE PRESENTACIÓN (API HTTP)         │
│  Routes (/api/prestamos) →                      │
│    ParseRequest, ValidateToken, CheckRole      │
└──────────────────┬──────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────┐
│    CAPA DE LÓGICA DE NEGOCIO (Services)        │
│  PrestamoService, SancionService,              │
│  EquipoService, AuthService                    │
│  - Validaciones de negocio                     │
│  - Transacciones                               │
│  - Orquestación de modelos                     │
└──────────────────┬──────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────┐
│    CAPA DE ACCESO A DATOS (Repositories)       │
│  (Abstraídos mediante modelos Eloquent)        │
│  - Queries optimizadas                         │
│  - Eager loading                               │
│  - Caché                                        │
└──────────────────┬──────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────┐
│  CAPA DE PERSISTENCIA (Models/Database)        │
│  Eloquent Models:                              │
│  - Prestamo, User, Equipo, observacion         │
│  - Validaciones de atributos (Casts)           │
│  - Relaciones entre modelos                    │
└──────────────────┬──────────────────────────────┘
                   ↓
           ┌───────┴───────┐
           ↓               ↓
       ┌────────┐    ┌──────────────┐
       │ MySQL  │    │ Redis Cache  │
       │   BD   │    │  (opcional)  │
       └────────┘    └──────────────┘
```

### C. Configuración y Setup

#### C.1 Instrucciones de Instalación del Backend

```bash
# 1. Clonar repositorio
git clone https://github.com/usuario/Sistema-de-Reserva-Diseno-multimedia.git
cd Backend

# 2. Instalar dependencias PHP
composer install

# 3. Configurar archivo .env
cp .env.example .env
# Editar .env con credenciales locales

# 4. Generar application key
php artisan key:generate

# 5. Crear base de datos y ejecutar migraciones
php artisan migrate

# 6. (Opcional) Poblar con datos de prueba
php artisan db:seed

# 7. Iniciar servidor
php artisan serve

# Backend disponible en http://localhost:8000/api
```

#### C.2 Variables de Entorno (.env)
```env
APP_NAME="Sistema Préstamo Equipos"
APP_ENV=local
APP_KEY=base64:...
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=prestamos_db
DB_USERNAME=root
DB_PASSWORD=

SANCTUM_STATEFUL_DOMAINS=localhost:4200
SESSION_DOMAIN=localhost

MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_USERNAME=...
MAIL_PASSWORD=...

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

QUEUE_CONNECTION=database
```

### D. Documentación de API Completa

#### D.1 Endpoint: Crear Préstamo
```http
POST /api/prestamos HTTP/1.1
Host: localhost:8000
Authorization: Bearer {token}
Content-Type: application/json

{
  "equipos": [1, 2, 3],
  "fecha_entrega_estimada": "2026-03-15",
  "evento_id": 5,
  "ubicacion": "Sala A",
  "motivo": "Producción académica"
}

--- Response (201 Created) ---

{
  "success": true,
  "data": {
    "idPrestamo": 42,
    "idUser": 5,
    "estado": "PENDIENTE",
    "fecha_inicio": "2026-03-04",
    "fecha_entrega_estimada": "2026-03-15",
    "usuario": {
      "idUser": 5,
      "name": "Juan Pérez",
      "email": "juan@uta.cl"
    },
    "equipos": [
      {
        "idEquipo": 1,
        "nombre": "Canon EOS R5",
        "categoria": "Cámaras",
        "estado": "disponible"
      }
    ],
    "created_at": "2026-03-04T10:30:00Z",
    "updated_at": "2026-03-04T10:30:00Z"
  },
  "message": "Préstamo creado exitosamente"
}

--- Response (422 Unprocessable Entity) ---

{
  "success": false,
  "errors": {
    "equipos": [
      "Equipo 1 no está disponible",
      "El máximo de equipos por solicitud es 5"
    ],
    "fecha_entrega_estimada": [
      "La fecha debe ser mayor que hoy"
    ]
  },
  "message": "Validación fallida"
}
```

### E. Ejemplos de Reportes Generados

#### E.1 Screenshot: Dashboard Ejecutivo (JSON)
```json
{
  "generado_en": "2026-03-04T15:30:00Z",
  "periodo": "Marzo 2026",
  "resumen": {
    "total_prestamos": 245,
    "prestamos_activos": 32,
    "prestamos_vencidos": 3,
    "equipos_en_riesgo": 5,
    "usuarios_sancionados": 3
  },
  "kpis": {
    "tasa_devolucion": "87.5%",
    "tiempo_promedio_prestamo": "4.2 días",
    "equipo_mas_solicitado": "Canon EOS R5",
    "usuario_mas_activo": "Juan Pérez (12 prestamod"
  },
  "alertas": [
    "Equipo ID#3 lleva 8 días sin ser devuelto",
    "Usuario ID#7 acumula 3 sanciones",
    "10 equipos requieren mantenimiento"
  ],
  "datos_por_categoria": [
    {
      "categoria": "Cámaras",
      "total_equipos": 12,
      "en_stock": 8,
      "tasa_disponibilidad": "67%"
    }
  ]
}
```

### F. Pruebas Realizadas

#### F.1 Test Suite Ejemplo

Ejecutar tests:
```bash
php artisan test

# Con cobertura
php artisan test --coverage
```

Resultados:
```
PASS Tests\Feature\PrestamoControllerTest
  ✓ usuario_puede_crear_prestamo
  ✓ usuario_sancionado_no_puede_crear_prestamo
  ✓ admin_puede_aprobar_prestamo
  ✓ admin_puede_rechazar_prestamo
  ✓ usuario_puede_listar_sus_prestamos
  ✓ usuario_no_puede_ver_prestamos_ajenos

PASS Tests\Unit\PrestamoServiceTest
  ✓ calcula_correctamente_devoluciones_parciales
  ✓ valida_disponibilidad_de_equipos
  ✓ registra_auditoria_en_cada_cambio

Tests: 60 passed (45ms)
Code Coverage: 87%
```

### G. Cronograma y Planificación

#### G.1 Gantt de Sprints

```
SPRINT 1 (Sem 1-2): Análisis y Diseño
├─ Entrevistas y requisitos       [===========    ]
├─ Diseño de BD                   [            ==]
├─ Configuración de proyecto      [           ===]
└─ Setup inicial                  [          ====]

SPRINT 2 (Sem 3-4): Fundamentos de Backend
├─ Migraciones de BD              [===============]
├─ Autenticación                  [==============]
├─ Modelos y relaciones           [===============]
└─ Testing setup                  [============]

SPRINT 3 (Sem 5-6): APIs Core
├─ Endpoints de préstamos         [===============]
├─ Endpoints de equipos           [==============]
├─ Validaciones                   [===============]
└─ Error handling                 [============]

SPRINT 4 (Sem 7-8): Funcionalidades Avanzadas
├─ Sanciones                      [==============]
├─ Reportes & Analytics           [==============]
├─ Auditoría                      [===============]
└─ Optimizaciones                 [===========]

SPRINT 5 (Sem 9-10): Cierre
├─ Testing final                  [==============]
├─ Documentación                  [==============]
├─ Deployment a producción        [===========]
└─ Handoff y capacitación         [=======]

═══════════════════════════════════════════════════
```

#### G.2 Distribución de Horas

| Tarea | Horas | % |
|-------|-------|---|
| Análisis y Diseño | 40 | 13% |
| Implementación Backend | 180 | 59% |
| Testing | 50 | 16% |
| Documentación | 30 | 10% |
| Meetings y Comunicación | 10 | 2% |
| **TOTAL** | **310** | **100%** |

---

**FIN DEL INFORME**

Realizado en: Marzo 4, 2026
Revisado por: [Profesor Guía]
Aprobado: [Fecha]

