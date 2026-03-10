# ✅ GUÍA DE PRUEBA - Sistema SSE en Tiempo Real

**Fecha**: 9 de Marzo de 2026  
**Status**: ✅ LISTO PARA TESTEAR

---

## 🚀 PASOS PARA VERIFICAR

### 1. Iniciar Backend
```bash
cd Backend
php artisan serve
# Deberías ver: "Laravel development server started at http://127.0.0.1:8000"
```

### 2. Iniciar Frontend (Nueva terminal)
```bash
cd Frontend
npm start
# Deberías ver: "✔ Compiled successfully" 
# Accede a: http://localhost:4200
```

### 3. Abrir DevTools en Navegador
```
F12 → Console
```

---

## 🧪 FLUJO DE PRUEBA COMPLETO

### Paso A: Iniciar Sesión 
1. Ir a `http://localhost:4200/auth/login`
2. Ingresar credenciales (email + password)
3. Click "Iniciar Sesión"

**En Console, deberías ver:**
```
✅ [LoginComponent] Guardado apiBaseUrl: http://localhost:3000/api
```

---

### Paso B: Ir al Dashboard Admin
1. Si eres ADMIN,  se redirige a: `/admin/dashboard`
2. Click en la sección "Solicitudes Pendientes"
3. **Abre DevTools → Console** (esto es IMPORTANTE)

**En Console, deberías ver INMEDIATAMENTE:**
```
[SolicitudesPendientesComponent] 🔗 Conectando a SSE con token...
[RealtimeSyncService] 🔌 Conectando a SSE: http://localhost:8000/api/admin/stream/cambios?token=XXXX...
✅ SSE CONECTADO - Escuchando eventos en tiempo real
```

Si ves esto, **¡la conexión SSE está funcionando!** ✅

---

### Paso C: Verificar Conexión en Network Tab
1. DevTools → Network
2. Filtrar por "stream"
3. Deberías ver una request GET a `/api/admin/stream/cambios?token=...`
4. El status debe ser `200` y el Content-Type debe ser `text/event-stream`
5. La conexión debe mantenerse abierta (spinning circle)

---

### Paso D: Crear un Préstamo Desde Otra Sesión
1. Abre una **nueva pestaña/navegador** (para simular otro usuario)
2. Inicia sesión como ALUMNO
3. Ve a "Solicitar Equipos"
4. Crea una solicitud de préstamo

**En la PRIMERA pestaña (Admin Dashboard):**
- En Console deberías ver:
```
[PrestamoStateService] 🔔 Préstamo actualizado vía SSE: 123
```

- **La lista de solicitudes DEBE actualizar automáticamente SIN overlay darkening**
- Verifica que NO ves el overlay gris semitransparente

---

### Paso E: Aprobar el Préstamo
1. En el Dashboard Admin, click "Aprobar" en la solicitud
2. Confirma la acción

**En Console:**
```
[PrestamoStateService] 🔔 Préstamo actualizado vía SSE: 123
```

**El estado debe cambiar a APROBADO instantáneamente**

---

## 🔍 INFORMACIÓN DE DEBUG

### Ver Token Guardado
En Console:
```javascript
sessionStorage.getItem('token')
// Deberías ver un string largo comenzando con eyJhbGc...

localStorage.getItem('apiBaseUrl')
// Deberías ver: http://localhost:8000/api
```

### Ver Estado de SSE
En Console:
```javascript
// Inyectar servicio (si estás en admin dashboard)
ng.getComponent(document.querySelector('app-solicitudes-pendientes')).realtimeSync.conectado$.subscribe(x => console.log('SSE:', x))
// Deberías ver: SSE: true
```

### Ver Eventos en Network
1. DevTools → Network
2. Click en la conexión `stream/cambios`
3. Click en tab "Response"
4. Deberías ver eventos como:
```
: SSE conectado - esperando eventos...

id: 1
event: PRESTAMO_ACTUALIZADO
data: {"tipo":"PRESTAMO_ACTUALIZADO",...}

: keep-alive
```

---

## ❌ PROBLEMAS COMUNES Y SOLUCIONES

### Problema 1: "No hay token disponible, reintentando en 2s..."
**Causa**: El token no se guardó en sessionStorage durante login

**Solución**:
```javascript
// En Console:
sessionStorage.getItem('token')
// Si es null, El login falló

// Verifica en Network → Login request → Response
// Debe tener un campo "token"
```

---

### Problema 2: "Error al conectar a SSE" o "401 Unauthorized"
**Causa**: Token es inválido o expiró

**Solución**:
```javascript
// En Backend logs (storage/logs/laravel.log)
// Busca: "Token inválido o expirado"

// Intenta re-login:
sessionStorage.clear()
localStorage.clear()
// Recarga la página y vuelve a iniciar sesión
```

---

### Problema 3: SSE se conecta pero NO hay eventos
**Causa**: Los eventos no se están creando en la BD

**Solución**:
```bash
# En terminal Backend:
php artisan tinker
>>> DB::table('sistema_eventos')->count()
// Deberías ver un número > 0

>>> DB::table('sistema_eventos')->latest()->limit(3)->get()
// Deberías ver eventos recientes
```

---

### Problema 4: Overlay darkening sigue apareciendo
**Causa**: LoadingInterceptor no está skippeando SSE streams correctamente

**Solución**:
```javascript
// En Console, verifica que la URL contiene /stream/cambios:
document.location.origin + '/api/admin/stream/cambios'
// Debe ser: http://localhost:8000/api/admin/stream/cambios

// Verifica que el interceptor está removiendo loading:
// En Network → aprob request → Headers
// Debe TENER algún loading visual, pero "stream" no
```

---

## ✅ CHECKLIST DE VALIDACIÓN

- [ ] Backend inicia sin errores: `php artisan serve`
- [ ] Frontend compila sin errores: `npm start`
- [ ] Puedo iniciar sesión
- [ ] `apiBaseUrl` se guarda en localStorage
- [ ] `token` se guarda en sessionStorage
- [ ] SSE se conecta: ves "✅ SSE CONECTADO" en Console
- [ ] Network tab muestra `/stream/cambios` con status 200
- [ ] Conexión SSE se mantiene abierta (spinning)
- [ ] Crear préstamo genera evento SSE
- [ ] Dashboard se actualiza sin overlay darkening
- [ ] Console NO tiene errores de CORS
- [ ] `sistema_eventos` tabla tiene registros

---

## 🐛 ÚLTIMO RECURSO: LOGS

### Backend Logs
```bash
cd Backend
tail -f storage/logs/laravel.log
# Crea un préstamo y observa los logs
# Deberías ver: "SSE conectado" y después "PRESTAMO_ACTUALIZADO"
```

### Frontend Console (DevTools)
```
F12 → Console → Filtrar por "SSE"  o "Realtime"
```

### Check Database
```bash
cd Backend
php artisan tinker

# Ver eventos creados:
>>> DB::table('sistema_eventos')->latest()->limit(10)->get();

# Ver si tabla tiene datos:
>>> DB::table('prestamos')->count()
```

---

## 📞 SI ALGO NO FUNCIONA

1. **Abre DevTools Console ANTES de cualquier acción**
2. **Copia TODO lo que ves en la console** (rojo + amarillo + azul)
3. **Verifica storage/logs/laravel.log** en el backend
4. **Verifica Network tab** para ver requests/responses

Con eso podemos debuguear de verdad.

