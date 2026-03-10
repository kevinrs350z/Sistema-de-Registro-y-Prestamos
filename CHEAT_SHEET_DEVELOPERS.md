# CHEAT SHEET - INTEGRACIÓN DE SERVICIOS DE SINCRONIZACIÓN

**Imprime esto o ten abierto mientras haces la integración.**

---

## 🎯 LOS 3 SERVICIOS QUE USARÁS

### DataSyncService (Coordinador)
```typescript
// Usar para avisar cambios
this.dataSync.invalidarPrestamos(id?, 'ACTUALIZAR'|'CREAR'|'ELIMINAR');
this.dataSync.invalidarSanciones(id?);

// Usar para saber si hay cambios pendientes
if (this.dataSync.hayInvalidacionesPrestamos()) { ... }
if (this.dataSync.hayInvalidacionesSanciones()) { ... }
```

### PrestamoStateService (Estado de Solicitudes)
```typescript
// Observable con datos frescos
this.prestamoState.solicitudes$.subscribe(datos => { ... });

// Control manual
this.prestamoState.iniciarPolling();      // Empezar sincronización
this.prestamoState.detenerPolling();      // Parar sincronización
this.prestamoState.refrescar(true);       // Forzar refresh ahora

// Updates locales (feedback rápido)
this.prestamoState.actualizarEstadoLocal(id, 'APROBADO');
this.prestamoState.removerSolicitud(id);
this.prestamoState.agregarSolicitud(obj);

// Estados compartidos
this.prestamoState.cargando$;  // boolean Observable
this.prestamoState.error$;     // string Observable
```

### SancionStateService (Estado de Sanciones)
```typescript
// Observables con datos frescos
this.sancionState.sanciones$;              // Todas
this.sancionState.sancionesActivas$;       // Solo ACTIVA/EN_REVISION
this.sancionState.sancionesPorUsuario$;    // Map<idUser, sanciones[]>

// Control
this.sancionState.iniciarPolling();
this.sancionState.detenerPolling();
this.sancionState.refrescar(true);

// Por usuario (para detalles de estudiante)
this.sancionState.refrescarPorUsuario(idUser);
this.sancionState.obtenerSancionesUsuario(idUser);
```

---

## 📝 TEMPLATE DE COMPONENTE REFACTORIZADO

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { PrestamoStateService } from '../services/prestamo-state.service';
import { DataSyncService } from '../services/data-sync.service';

@Component({
  selector: 'app-solicitudes-pendientes',
  template: `...`,
})
export class SolicitudesPendientesComponent implements OnInit, OnDestroy {
  solicitudes: any[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private prestamoState: PrestamoStateService,
    private dataSync: DataSyncService
  ) {}

  ngOnInit(): void {
    // Conectar a Observable
    this.prestamoState.solicitudes$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => (this.solicitudes = data));

    // Escuchar cambios y refrescar rápido
    this.dataSync.cambiosPrestamos$
      .pipe(
        debounceTime(500),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.prestamoState.refrescar(false));

    // Iniciar polling automático
    this.prestamoState.iniciarPolling();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.prestamoState.detenerPolling();
  }

  // Ejemplo de acción
  aprobar(id: number) {
    this.api.aprobar(id).subscribe(() => {
      this.dataSync.invalidarPrestamos(id, 'ACTUALIZAR');
      this.prestamoState.actualizarEstadoLocal(id, 'APROBADO');
    });
  }
}
```

---

## ✅ CHECKLIST POR COMPONENTE

### Paso 1: Imports
- [ ] `import { OnDestroy, Observable, Subject } from '@angular/core'`
- [ ] `import { takeUntil, debounceTime } from 'rxjs/operators'`
- [ ] `import { PrestamoStateService } from '...'`
- [ ] `import { DataSyncService } from '...'`

### Paso 2: Class
- [ ] `implements OnInit, OnDestroy`
- [ ] `private destroy$ = new Subject<void>()`

### Paso 3: Constructor
- [ ] Inyectar `PrestamoStateService`
- [ ] Inyectar `DataSyncService` (si hace cambios)

### Paso 4: ngOnInit()
- [ ] `this.prestamoState.solicitudes$.pipe(...).subscribe(...)`
- [ ] `this.dataSync.cambiosPrestamos$.pipe(...).subscribe(...)`
- [ ] `this.prestamoState.iniciarPolling()`

### Paso 5: ngOnDestroy()
- [ ] `this.destroy$.next()`
- [ ] `this.destroy$.complete()`
- [ ] `this.prestamoState.detenerPolling()`

### Paso 6: En métodos de acción
- [ ] Después de POST exitoso: `this.dataSync.invalidarPrestamos()`
- [ ] Para feedback rápido: `this.prestamoState.actualizarEstadoLocal()`

---

## 🔄 PATRONES DE DATOS

### Crear
```typescript
crear() {
  this.api.crear(data).subscribe(response => {
    // Avisar al sistema
    this.dataSync.invalidarPrestamos(null, 'CREAR');
    
    // O agregar localmente (más rápido)
    this.prestamoState.agregarSolicitud(response);
  });
}
```

### Actualizar
```typescript
actualizar(id: number) {
  this.api.actualizar(id, data).subscribe(response => {
    // Avisar y refrescar rápido
    this.dataSync.invalidarPrestamos(id, 'ACTUALIZAR');
    
    // Feedback inmediato
    this.prestamoState.actualizarEstadoLocal(id, response.estado);
  });
}
```

### Eliminar
```typescript
eliminar(id: number) {
  this.api.eliminar(id).subscribe(() => {
    // Avisar
    this.dataSync.invalidarPrestamos(id, 'ELIMINAR');
    
    // O remover localmente
    this.prestamoState.removerSolicitud(id);
  });
}
```

---

## 🛠️ DEBUGGING RÁPIDO

### "¿Está haciendo polling?"
```javascript
// En DevTools Console:
localStorage.getItem('debug') = 'prestamo-state:*';
// Recarga página, verás logs en console
```

### "¿Qué datos tiene?"
```javascript
// Subscription temporal en console:
window.ng.probe(document.querySelector('app-solicitudes-pendientes')).injector.get(PrestamoStateService).solicitudes$.subscribe(console.log)
```

### "¿Hay memory leaks?"
```
DevTools → Memory → Take heap snapshot (3 veces)
Deberías ver que memoria baja después de detenerPolling()
```

### "¿Por qué no actualiza?"
Checklist:
- [ ] ¿Se inyectó el servicio?
- [ ] ¿Se llamó `iniciarPolling()`?
- [ ] ¿Se implementó `OnDestroy`?
- [ ] ¿Se ve polling en Network tab?
- [ ] ¿Hay cambios en API? (POST debería devolver OK)

---

## 🚨 ERRORES COMUNES

| Error | Causa | Solución |
|-------|-------|----------|
| `Cannot read property 'solicitudes$' of undefined` | `prestamoState` no inyectado | Verificar `constructor(private prestamoState: PrestamoStateService)` |
| `takeUntil is not a function` | Falta import | Agregar `import { takeUntil } from 'rxjs/operators'` |
| Memory leak en DevTools | No llamó `destroy$.next()` | Verificar `ngOnDestroy()` exista y tenga cleanup |
| Polling no aparece | `iniciarPolling()` no llamado | Verificar en `ngOnInit()` existe la llamada |
| Datos no actualizan | No se subscribe a `solicitudes$` | Verificar `subscribe()` en `ngOnInit()` |
| Multi-tab sin sincronización | Cada tab tiene su estado | Normal, sincroniza via API cada 5s |

---

## 📊 MONITOREO

### Métrica: Latencia de sync
```
[Test] Crear solicitud
Tiempo esperado: <5 segundos
Cómo verificar:
  1. Crear en tab A
  2. Cronometrar hasta que aparezca en tab B
  3. Debe ser <5 segundos
```

### Métrica: Requests del API
```
[Test] Contar polls
Tiempo esperado: ~12 requests por minuto (1 cada 5s)
Cómo verificar:
  1. DevTools → Network
  2. Filtrar "prestamos"
  3. Dejar 1 minuto
  4. Contar requests
  5. Debe ser ~12
```

### Métrica: Memory
```
[Test] Sin leaks
Tiempo esperado: Stable
Cómo verificar:
  1. DevTools → Memory
  2. Take snapshot
  3. Navega entre componentes 5 veces
  4. Take snapshot
  5. Memory debería ser similar
```

---

## 🎓 REFERENCIA DE OPERADORES RxJS

```typescript
// Limpiar subscription cuando destruyes componente
.pipe(takeUntil(this.destroy$))

// Esperar 500ms sin nuevos eventos antes de emitir
.pipe(debounceTime(500))

// Solo si es diferente al anterior
.pipe(distinctUntilChanged())

// Transformar datos
.pipe(map(x => x.transformarPrestamo()))

// Ejecutar sin afectar stream
.pipe(tap(x => console.log(x)))

// Manejar errores
.pipe(catchError(err => of([])))
```

---

## 🎯 ORDEN DE IMPLEMENTACIÓN RECOMENDADO

```
1. solicitudes-pendientes (CRÍTICA, veces usada)
   ├─ Simétrica: Si funciona aquí, funciona igual en otras
   ├─ Permite testing temprano
   └─ 30 minutos

2. solicitudes-finalizadas (SIMILAR pero read-only)
   ├─ Mismo patrón que #1
   ├─ Solo .subscribe, no .refrescar()
   └─ 15 minutos

3. gestionar-sanciones (CRÍTICA, SancionStateService)
   ├─ Usa SancionStateService en lugar de PrestamoStateService
   ├─ Mismo flujo que #1
   └─ 20 minutos

4. mis-sanciones (READ-ONLY, Usuario)
   ├─ Solo lectura de sanciones propias
   ├─ Usar refrescarPorUsuario()
   └─ 15 minutos

5. inventario (MENOS CRÍTICA)
   ├─ Puede requerir servicio nuevo
   ├─ Última prioridad
   └─ 20 minutos

TOTAL: ~1.5 horas para 5 componentes
```

---

## 🌍 COMPORTAMIENTO ESPERADO POR ESCENARIO

### Escenario 1: Alumno crea → Admin lo ve
```
T=0s   Alumno: Click en "Crear"
T=1s   Alumno: POST /api/prestamos (200 OK)
T=1-2s Admin: DataSync emite invalidación, refrescar en 2s
T=3s   Admin: GET /api/admin/prestamos (ve solicitud nueva)
T=3s   Admin: Ver en tabla la solicitud nueva

TIEMPO TOTAL: ~3 segundos (rápido, real-time)
```

### Escenario 2: Admin aprueba → Alumno lo ve
```
T=0s   Admin: Click "Aprobar"
T=1s   Admin: POST /api/prestamos/{id}/aprobar (200 OK)
T=1s   Admin: Actualizar estado local (feedback inmediato)
T=1s   Admin: DataSync invalidación
T=2-3s Admin: GET /api/admin/prestamos (confirmar)
               Alumno: GET /api/mis-prestamos (por polling)
T=3s   Ambos: Ver estado actualizado

TIEMPO TOTAL: ~3 segundos (ambos sincronizan)
```

### Escenario 3: Sin cambios (polling normal)
```
T=0s    GET /api/admin/prestamos → [Lista completa sin cambios]
T=5s    GET /api/admin/prestamos → [Misma lista]
T=10s   GET /api/admin/prestamos → [Misma lista]
...
        (Sin cambios, datos se mantienen igual)

OVERHEAD: 20 req/hora, ~50KB de ancho de banda, <50ms CPU
```

---

## 💻 COMANDOS ÚTILES

```bash
# Compilar y ver errors
ng build

# Servir en desarrollo
ng serve

# Solo typescript sin build
ng serve --configuration development

# Build optimizado (antes de deploy)
ng build --configuration production

# Lint de código
ng lint

# Tests
ng test

# Ver tamaño de bundle
ng build --stats-json
```

---

## 📋 VALIDACIÓN ANTES DE CONSIDERAR "LISTO"

- [ ] Compila sin warnings
- [ ] Network: Polling cada 5s ✅
- [ ] Create: Visible en <5s ✅
- [ ] Update: Visible en <5s ✅
- [ ] Multi-tab: Sincronizado ✅
- [ ] Memory: Stable ✅
- [ ] ngOnDestroy: Se ejecuta ✅
- [ ] Sin console errors ✅
- [ ] Nada roto vs baseline ✅

---

**PRINT THIS PAGE & TEN ABIERTO MIENTRAS INTEGRAS** 📌
