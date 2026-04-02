# Sistema de Colas para Emails - Guía de Configuración

## 📋 Resumen

El sistema utiliza **Laravel Queues** para procesar el envío de correos electrónicos en segundo plano, garantizando:

- ⚡ Respuesta inmediata al aprobar/rechazar préstamos (≤300ms)
- 🔄 Reintentos automáticos en caso de fallo SMTP
- 📊 Trazabilidad completa de jobs
- 🛡️ Aislamiento de errores (el email no afecta la operación principal)

---

## 🔧 Configuración Inicial

### 1. Variables de Entorno (.env)

```env
# Cambiar de 'sync' a 'database'
QUEUE_CONNECTION=database

# Configuración SMTP (ya deberías tenerla)
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=tu_email@gmail.com
MAIL_PASSWORD=tu_app_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=tu_email@gmail.com
MAIL_FROM_NAME="Sistema de Préstamos"
```

### 2. Ejecutar Migración

```bash
cd Backend
php artisan migrate
```

Esto creará las tablas:
- `jobs` - Cola de trabajos pendientes
- `failed_jobs` - Trabajos fallidos
- `job_batches` - Lotes de trabajos (opcional)

---

## 🚀 Ejecutar el Worker

### Desarrollo (Manual)

```bash
# Worker básico
php artisan queue:work

# Worker para cola específica de emails
php artisan queue:work --queue=emails

# Con más detalle de logs
php artisan queue:work --queue=emails -v

# Procesar un solo job y salir
php artisan queue:work --once
```

### Producción (Supervisor recomendado)

Crear archivo `/etc/supervisor/conf.d/laravel-worker.conf`:

```ini
[program:laravel-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /ruta/al/proyecto/Backend/artisan queue:work database --queue=emails --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/ruta/al/proyecto/Backend/storage/logs/worker.log
stopwaitsecs=3600
```

Luego:

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start laravel-worker:*
```

### Windows (Desarrollo)

Crear archivo `start-worker.bat`:

```batch
@echo off
cd /d "C:\ruta\al\proyecto\Backend"
php artisan queue:work --queue=emails --sleep=3 --tries=3
pause
```

---

## 📊 Monitoreo

### Ver jobs pendientes

```bash
php artisan queue:monitor emails
```

### Ver jobs fallidos

```bash
php artisan queue:failed
```

### Reintentar job fallido

```bash
# Reintentar uno específico
php artisan queue:retry {id}

# Reintentar todos
php artisan queue:retry all
```

### Limpiar jobs fallidos

```bash
php artisan queue:flush
```

---

## 🔄 Flujo de Datos

```
┌─────────────────────┐
│  Admin aprueba      │
│  préstamo en UI     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  PrestamoAdminService│
│  - Valida           │
│  - Cambia estado BD │
│  - Registra historial│
│  - Dispatch Job ────┼──────┐
│  - Responde 200 OK  │      │ (async)
└─────────────────────┘      │
           │                 │
           ▼                 ▼
┌─────────────────────┐  ┌─────────────────────┐
│  UI recibe respuesta│  │  Tabla 'jobs'       │
│  INMEDIATAMENTE     │  │  (cola pendiente)   │
│  (~100-300ms)       │  └──────────┬──────────┘
└─────────────────────┘             │
                                    ▼
                         ┌─────────────────────┐
                         │  queue:work (worker)│
                         │  Procesa job        │
                         │  Envía email SMTP   │
                         └──────────┬──────────┘
                                    │
                          ┌─────────┴─────────┐
                          │                   │
                          ▼                   ▼
                    ┌──────────┐        ┌──────────┐
                    │ Éxito    │        │ Fallo    │
                    │ Log OK   │        │ Reintento│
                    └──────────┘        │ (3 veces)│
                                        └────┬─────┘
                                             │
                                             ▼
                                      ┌──────────┐
                                      │failed_jobs│
                                      │ + Log    │
                                      └──────────┘
```

---

## 🛠️ Jobs Disponibles

| Job | Descripción | Cola |
|-----|-------------|------|
| `SendPrestamoEmailJob` | Correos de aprobación/rechazo | `emails` |
| `SendSancionEmailJob` | Notificaciones de sanción | `emails` |
| `SendGenericEmailJob` | Correo genérico (cualquier Mailable) | `emails` |

### Uso manual

```php
use App\Jobs\SendPrestamoEmailJob;

// Encolar correo de aprobación
SendPrestamoEmailJob::dispatch(
    'aprobado',           // tipo
    'usuario@email.com',  // email
    'Juan Pérez',         // nombre
    123,                  // prestamoId
    '02/02/2026 10:30',  // fechaSolicitud
    'Aprobado sin observaciones', // motivo
    [['nombre' => 'Cámara Canon', 'codigo' => 'CAM-001']] // equipos
);
```

---

## ⚠️ Solución de Problemas

### El worker no procesa jobs

```bash
# Verificar conexión de queue
php artisan queue:work --once -v

# Verificar configuración
php artisan config:cache
php artisan queue:restart
```

### Jobs se marcan como fallidos inmediatamente

1. Verificar credenciales SMTP en `.env`
2. Revisar logs: `storage/logs/laravel.log`
3. Probar envío manual:

```bash
php artisan tinker
>>> Mail::raw('Test', fn($m) => $m->to('tu@email.com'));
```

### Ver contenido de un job fallido

```bash
php artisan queue:failed
php artisan queue:retry {uuid}
```

---

## 📈 Métricas de Rendimiento

| Métrica | Antes | Después |
|---------|-------|---------|
| Tiempo respuesta aprobar | 6-10s | ~200ms |
| Tiempo respuesta rechazar | 6-10s | ~150ms |
| Capacidad simultánea | 1-2 | Ilimitado* |
| Recuperación de errores | Manual | Automática |

*Limitado por workers configurados

---

## 🔒 Seguridad

- Los jobs fallidos contienen información sensible (emails)
- Limpiar `failed_jobs` periódicamente en producción
- Configurar `QUEUE_FAILED_DRIVER` si se requiere otro almacenamiento
