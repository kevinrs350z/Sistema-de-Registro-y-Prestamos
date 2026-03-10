# VALIDACIÓN Y CHECKLIST DE PRUEBAS FINALES

**Sistema**: Sistema de Reserva y Préstamo de Equipos  
**Fase**: Post-implementación de sincronización reactiva  
**Objetivo**: Verificar que la solución funciona correctamente sin regresiones  

---

## PARTE 1: VALIDACIÓN TÉCNICA

### 1.1 Verificación de Servicios

#### ✅ DataSyncService
```bash
Ubicación: Frontend/src/app/services/data-sync.service.ts

[ ] Archivo existe y compila sin errores
[ ] Métodos públicos disponibles:
    [ ] invalidarPrestamos()
    [ ] invalidarSanciones()
    [ ] invalidarInventario()
    [ ] cambiosPrestamos$ observable accesible
    [ ] cambiosSanciones$ observable accesible
```

#### ✅ PrestamoStateService
```bash
Ubicación: Frontend/src/app/services/prestamo-state.service.ts

[ ] Archivo existe y compila
[ ] Métodos públicos:
    [ ] iniciarPolling() - Inicia polling cada 5s
    [ ] detenerPolling() - Detiene polling
    [ ] refrescar(mostrarLoading) - Refresco manual
    [ ] obtenerSolicitud(id) - Busca por ID
    [ ] actualizarEstadoLocal(id, estado) - Update local
    [ ] removerSolicitud(id) - Elimina del estado
    [ ] agregarSolicitud(solicitud) - Agrega nuevo
[ ] Observable solcitides$ emite cambios
[ ] Se suscribe a DataSyncService.cambiosPrestamos$
[ ] Implementa OnDestroy correctamente
```

#### ✅ SancionStateService
```bash
Ubicación: Frontend/src/app/services/sancion-state.service.ts

[ ] Archivo existe y compila
[ ] Métodos públicos (ídem PrestamoStateService):
    [ ] iniciarPolling()
    [ ] detenerPolling()
    [ ] refrescar()
    [ ] obtenerSancionesUsuario(idUser)
    [ ] actualizarSancionLocal(id, cambios)
    [ ] removerSancion()
    [ ] agregarSancion()
[ ] Observables emiten cambios
[ ] Filtra activas vs todas
```

---

## PARTE 2: VALIDACIÓN FUNCIONAL

### 2.1 Caso de Uso: Crear Solicitud + Admin Aprueba

**Precondiciones**:
- ✅ Alumno logueado en navegador A
- ✅ Admin logueado en navegador B / pestaña B
- ✅ Admin tiene "Solicitudes Pendientes" abierto
- ✅ Consola abierta en ambos

**TEST: Alumno crea solicitud**
```
Paso 1: Alumno navega a "Solicitar Equipo"
  [ ] Formulario carga sin errores

Paso 2: Alumno completa y envía solicitud
  [ ]  Form valida correctamente
  [ ]  POST /api/prestamos enviado (Network tab)
  [ ]  Notificación "Solicitud enviada" ✓
  [ ]  Alumno redirigido a catálogo

Admin sin recargar:
  [ ]  En Network: Ver GET /api/admin/prestamos/pendientes (5s después)
  [ ]  Consola: "[PrestamoStateService] Refrescando solicitudes"
  [ ]  En UI: Nueva solicitud aparece en listado
  [ ]  Estado: PENDIENTE ✓

RESULTADO: ✅ PASS si aparece en <10s sin recargar
           ❌ FAIL si Admin necesita F5
```

**TEST: Admin aprueba solicitud**
```
Paso 1: Admin selecciona la solicitud creada
  [ ] Detalle carga correctamente
  [ ] Botón "APROBAR" disponible

Paso 2: Admin hace click en "APROBAR"
  [ ] POST /api/admin/prestamos/{id}/aprobar enviado
  [ ] Notificación "Aprobado" ✓
  [ ] En UI Admin: Estado cambia a "APROBADO" (inmediato)

Alumno sin recargar:  
  [ ] En Network: Ver GET /api/prestamos (5s después)
  [ ] En lista de solicitudes: "PENDIENTE A ENTREGA" ✓
  [ ] Cambio es visible en <10s

RESULTADO: ✅ PASS si cambio reflejado en ambas sesiones <10s
          ❌ FAIL si uno necesita recargar
```

---

### 2.2 Caso de Uso: Multi-Admin Concurrencia

**Precondiciones**:
- ✅ Admin A en navegador A
- ✅ Admin B en navegador B
- ✅ Ambos en "Solicitudes Pendientes"

**TEST**  
```
Paso 1: Admin A rechaza una solicitud
  [ ] Selecciona solicitud X
  [ ] Click "Rechazar"
  [ ] POST /api/admin/prestamos/{id}/rechazar enviado
  [ ] En UI A: Estado cambia a "RECHAZADO" (immediatamente)

Paso 2: Admin B sin hacer nada
  [ ] En Network B: Ver GET /api/admin/prestamos/pendientes (5s después)
  [ ] En UI B: Solicitud X ya no tiene estado "PENDIENTE"
  [ ] En UI B: Estado es "RECHAZADO"

RESULTADO: ✅ PASS si B ve cambio sin hacer F5
          ❌ FAIL si necesita refrescar manualmente
```

---

### 2.3 Caso de Uso: Sanciones

**TEST: Admin asigna sanción, alumno la ve**
```
Precondiciones:
  [ ] Admin en "Gestionar Sanciones"
  [ ] Alumno en "Mis Sanciones" (otra pestaña)

Paso 1: Admin asigna sanción a alumno X
  [ ] POST /api/admin/sanciones/asignar enviado
  [ ] Confirmación ✓

Alumno (sin recargar):
  [ ] En Network: GET /api/admin/sanciones (5s después)
  [ ] En UI: Nueva sanción aparece en listado
  [ ] Estado: ACTIVA ✓
  [ ] Cambio visible en <10s

RESULTADO: ✅ PASS si sanción visible en <10s
          ❌ FAIL si necesita F5
```

---

### 2.4 Caso de Uso: Entrega de Equipo

**TEST**:
```
Precondiciones:
  [ ] Admin en "Solicitudes Pendientes"
  [ ] Alumno en "Mis Solicitudes"
  [ ] Una solicitud en estado "PENDIENTE A ENTREGA"

Paso 1: Admin marca como ENTREGADO
  [ ] Click "MARCAR ENTREGADO"
  [ ] Notificación ✓
  [ ] En UI Admin: Estado -> "ENTREGADO"

Paso 2: Alumno navega sin recargar a "Mis Solicitudes"
  [ ] Polling UPDATE: GET /api/prestamos (5s después)
  [ ] Estado cambió a "ENTREGADO" ✓

RESULTADO: ✅ PASS si actualización automática
          ❌ FAIL si estado viejo persiste
```

---

## PARTE 3: VALIDACIÓN DE PERFORMANCE Y RECURSOS

### 3.1 Network - Polling No Debe Ser Excesivo

```bash
[ ] Abrir DevTools > Network
[ ] Filtrar a "admin/prestamos/pendientes"
[ ] Dejar página abierta 30 segundos

VERIFICAR:
[ ] Requests cada ~5 segundos (no cada segundo)
[ ] Size de cada request: <50KB
[ ] Response time: <500ms
[ ] No hay requests duplicados (coincidentes)

RESULTADO: ✅ PASS si ~6-7 requests en 30s
          ⚠️ WARNING si >10 requests
          ❌ FAIL si >20 requests (polling excesivo)
```

### 3.2 Memory - Sin Memory Leaks

```bash
[ ] Abrir DevTools > Memory > Take Heap Snapshot (BASELINE)
[ ] Dejar página abierta 2 minutos
[ ] Navegar entre componentes 10 veces
[ ] Take Heap Snapshot (FINAL)

VERIFICAR:
[ ] diferencia memory < 10MB
[ ] No eventos 'detached DOM nodes' acumulándose
[ ] Suscripciones se limpian (ngOnDestroy llamado)

RESULTADO: ✅ PASS si memory estable
          ❌ FAIL si memory crece >20MB
```

### 3.3 CPU - Sin Sobrecarga

```bash
[ ] Abrir DevTools > Performance
[ ] Start recording
[ ] Dejar página 10 segundos
[ ] Stop recording

VERIFICAR:
[ ] CPU spikes no > 50% en polling
[ ] No eventos de "long task" (>50ms)
[ ] Frames mantenidos (FPS estable)

RESULTADO: ✅ PASS si CPU < 50%, FPS >30
          ❌ FAIL si CPU >70% o FPS drops
```

---

## PARTE 4: VALIDACIÓN DE SEGURIDAD

### 4.1 Autenticación Prevalece

```bash
[ ] Cerrar sesión (logout)
[ ] Verificar que polling se DETIENE
[ ] Network: GET /api/admin/prestamos/pendientes NO enviado
  
RESULTADO: ✅ PASS si polling se detiene post-logout
          ❌ FAIL si sigue haciendo requests
```

### 4.2 Permisos Respetados

```bash
[ ] Usuario ALUMNO intenta abrir URL: /admin/solicitudes
[ ]  Guard bloquea acceso (router)
  
RESULTADO: ✅ PASS si access denied
          ❌ FAIL si llega al componente
```

### 4.3 Datos Expuestos Correctamente

```bash
[ ] Admin ve solo solicitudes (no privados de otros)
[ ] Alumno ve solo sus solicitudes
[ ] Sanciones visibles solo a interesados
  
[ ] Network tab: Verificar JSON response
  [ ] No hay campos sensibles de más
  [ ] No hay datos de otros usuarios
  [ ] Estructura correcta

RESULTADO: ✅ PASS si datos correctamente filtrados
          ❌ FAIL si data leakage
```

---

## PARTE 5: COMPATIBILITY AND REGRESSION

### 5.1 Funcionalidad Existente Intacta

```bash
[ ] Crear solicitud (mismo formulario) ✓
[ ] Veráprobación manual (misma UI) ✓
[ ] Notificaciones funcionan (toast/alerts) ✓
[ ] Paginación en listados (misma) ✓
[ ] Búsqueda/filtro (mismo) ✓
[ ] Modal de rechazo (mismo) ✓
[ ] Editar equipos (mismo) ✓
```

### 5.2 Validaciones de Negocio

```bash
[ ] No se puede crear solicitud si: bloqueado ✓
[ ] No se puede crear si: sancionado grave ✓
[ ] Solo admin puede aprobar ✓
[ ] Solo admin puede rechazar ✓
[ ] Solo admin puede marcar entregado ✓
[ ] Stock validado (no over-request) ✓
[ ] Bloqueos horarios respetados ✓
```

---

## PARTE 6: NAVEGADORES Y DISPOSITIVOS

### 6.1 Desktop

```bash
[ ] Chrome (versión actual) - ✓ / ❌
[ ] Firefox (versión actual) - ✓ / ❌
[ ] Safari (si aplica) - ✓ / ❌
[ ] Edge - ✓ / ❌
```

### 6.2 Mobile (si aplica)

```bash
[ ] Polling consume batería razonable - ✓ / ❌
[ ] Network requests en 4G/5G óptimos - ✓ / ❌
[ ] Sin issues de conexión intermitente - ✓ / ❌
```

---

## PARTE 7: MATRIX DE ACEPTACIÓN

| Caso | Criterio | Estado | Notas |
|------|----------|--------|-------|
| Solicitud | Admin ve en <10s sin F5 | [ ] ✓ | |
| Aprobación | Alumno ve en <10s sin F5 | [ ] ✓ | |
| Rechazo | Ambos sincronizados | [ ] ✓ | |
| Entrega | Estados actualizados | [ ] ✓ | |
| Multisesión | Cambios mutuos visibles | [ ] ✓ | |
| Sanciones | Similar a solicitudes | [ ] ✓ | |
| Polling | ~5s, <50KB, óptimo | [ ] ✓ | |
| Memory | Estable, <10MB delta | [ ] ✓ | |
| Seguridad | No leaks, permisos OK | [ ] ✓ | |
| Funcional | Negocio intacto | [ ] ✓ | |

**RESULTADO FINAL**:
- ✅ **8+/10**: APROBADO - Listo para producción
- ⚠️ **6-7/10**: CONDICIONAL - Fixes menores necesarios
- ❌ **<6/10**: RECHAZADO - Rework requerido

---

## PARTE 8: NOTIFICACIÓN A USUARIOS

Una vez implementado, comunicar:

```
📢 MEJORA DE SISTEMA

Implementamos sincronización en tiempo real para:
- Solicitudes de préstamo
- Aprobaciones
- Devoluciones
- Sanciones

✨ Beneficios:
- No requiere refrescar la página (F5)
- Datos siempre actualizados
- Mejor experiencia
- Flujo más profesional

⏱️ Actualización cada ~5 segundos
```

---

## PARTE 9: LOGS ESPERADOS EN CONSOLA

### Inicio correcto:
```
[PrestamoStateService] Iniciando polling cada 5000 ms
[PrestamoStateService] Refrescando solicitudes...
```

### Cambios detectados:
```
[DataSyncService] Invalidando préstamo #42 (ACTUALIZAR)
[PrestamoStateService] Refrescando solicitudes...
```

### Limpieza:
```
[PrestamoStateService] Deteniendo polling
```

---

## CONCLUSIÓN

Este checklist asegura:
- ✅ Funcionalidad correcta
- ✅ Sin regresiones
- ✅ Performance aceptable
- ✅ Seguridad mantenida
- ✅ UX mejorada

**Después de completar todos los checks**, el sistema está listo para:
1. ✅ Integración en staging
2. ✅ Testing con usuarios reales
3. ✅ Deployment a producción
4. ✅ Monitoreo en vivo
