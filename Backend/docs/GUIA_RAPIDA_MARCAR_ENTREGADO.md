
# 🎯 GUÍA RÁPIDA - FLUJO "MARCAR ENTREGADO"

## 📱 DESDE FRONTEND (Angular/TypeScript)

```typescript
// 1. El admin selecciona un préstamo en estado APROBADO
// 2. Hace click en botón "Marcar como Entregado"
// 3. Componente llama servicio:

prestamoService.marcarEntregado(123).subscribe(
  (response) => {
    alert('Éxito: ' + response.message);
    // "Préstamo marcado como ENTREGADO correctamente."
  },
  (error) => {
    alert('Error: ' + error.error.error);
    // "Solo préstamos en estado APROBADO pueden marcarse..."
  }
);

// Servicio Angular:
marcarEntregado(idPrestamo: number): Observable<any> {
  return this.http.post(
    `/api/admin/prestamos/${idPrestamo}/marcar-entregado`,
    {},
    {
      headers: {
        'Authorization': `Bearer ${this.tokenService.getToken()}`,
        'Content-Type': 'application/json'
      }
    }
  );
}
```

---

## 🔄 DESDE BACKEND - FLUJO INTERNO

```
REQUEST: POST /api/admin/prestamos/123/marcar-entregado
         Headers: Authorization: Bearer token_admin

         ↓

1️⃣ MIDDLEWARE auth:sanctum
   ├─ Valida: token bearer válido
   └─ Extrae: User del token (auth()->user())

         ↓

2️⃣ MIDDLEWARE admin
   ├─ Valida: auth()->user()->isAdmin() == true
   └─ Si no: devuelve 403 "No autorizado"

         ↓

3️⃣ CONTROLADOR PrestamoAdminController::marcarEntregado(123)
   ├─ Captura: auth()->user()->idUser (ej: 5)
   ├─ Llama: $service->marcarEntregado(123, 5)
   └─ Try/Catch para errores

         ↓

4️⃣ SERVICIO PrestamoAdminService::marcarEntregado(123, 5)
   ├─ DB::transaction() ← INICIA TRANSACCIÓN
   │
   ├─ 1. Obtiene: $prestamo = Prestamo::find(123)
   │       - Si no existe → 404 "Not found"
   │
   ├─ 2. Valida estado:
   │       - Si estado != APROBADO → EXCEPCIÓN
   │       - Error: "Solo préstamos APROBADO..."
   │
   ├─ 3. Valida admin:
   │       - Obtiene User(5)
   │       - Si !isAdmin() → EXCEPCIÓN
   │       - Error: "Solo un administrador..."
   │
   ├─ 4. REGISTRA AUDITORÍA:
   │       - $prestamo->admin_entregado_id = 5
   │       - $prestamo->fecha_entregado = now() (2026-01-26 14:35:42)
   │       - $prestamo->estado = ENTREGADO
   │       - $prestamo->save() ← updated_at se actualiza automático
   │
   ├─ 5. LOG:
   │       - Log::info('Préstamo marcado...')
   │       - Registra: id, admin_id, nombre, timestamp
   │
   └─ DB::transaction() ← COMMIT ✅ TODO OK
       O ROLLBACK si error

         ↓

5️⃣ RESPUESTA AL CLIENTE

   ✅ ÉXITO (200 OK):
   {
     "message": "Préstamo marcado como ENTREGADO correctamente."
   }

   ❌ ERROR (400 Bad Request):
   {
     "error": "Solo préstamos en estado APROBADO pueden marcarse como ENTREGADO. Estado actual: PENDIENTE"
   }

         ↓

6️⃣ FRONTEND
   ├─ Recibe respuesta
   ├─ Muestra confirmación o error
   └─ Recarga lista de préstamos
```

---

## 🗄️ CAMBIOS EN BD

### Tabla `prestamos` - ANTES
```sql
SELECT idPrestamo, estado, admin_entregado_id, fecha_entregado, updated_at
FROM prestamos WHERE idPrestamo = 123;

| idPrestamo | estado    | admin_entregado_id | fecha_entregado | updated_at          |
|------------|-----------|-------------------|-----------------|---------------------|
| 123        | APROBADO  | NULL              | NULL            | 2026-01-25 10:00:00 |
```

### Tabla `prestamos` - DESPUÉS DE marcarEntregado()
```sql
| idPrestamo | estado    | admin_entregado_id | fecha_entregado     | updated_at          |
|------------|-----------|-------------------|---------------------|---------------------|
| 123        | ENTREGADO | 5                 | 2026-01-26 14:35:42 | 2026-01-26 14:35:42 |
```

---

## 🔐 VALIDACIONES EN JUEGO

### 1. **QUIÉN puede hacer esto?**
   ```
   ✅ Solo ADMIN (verificado 2 veces: middleware + servicio)
   ❌ No: usuario regular, alumno, profesor
   ```

### 2. **Qué préstamo se puede cambiar?**
   ```
   ✅ Solo APROBADO → ENTREGADO
   ❌ No: PENDIENTE, DEVUELTO, RECHAZADO, etc.
   ```

### 3. **Cuándo se registra?**
   ```
   ✅ Fecha exacta: 2026-01-26 14:35:42 (datetime con segundos)
   ✅ Admin responsable: id del usuario que ejecutó
   ```

### 4. **Integridad de datos?**
   ```
   ✅ Transacción DB: Todo o nada (no datos inconsistentes)
   ✅ Si falla: rollback automático
   ✅ Si éxito: commit automático
   ```

---

## 📊 AUDITORÍA - CÓMO REVISAR

### Query para ver quién entregó qué:

```php
// En controlador o tinker:
$prestamos = Prestamo::with('adminEntregado.persona')
  ->where('estado', 'ENTREGADO')
  ->get();

foreach ($prestamos as $p) {
  echo "Préstamo {$p->idPrestamo}: ";
  echo "Entregado por " . $p->adminEntregado->persona->Nombre;
  echo " el " . $p->fecha_entregado->format('d/m/Y H:i:s');
  echo "\n";
}

// Resultado:
// Préstamo 123: Entregado por Juan Pérez el 26/01/2026 14:35:42
// Préstamo 124: Entregado por María García el 26/01/2026 15:10:20
```

### Ver todos los préstamos que un admin entregó:

```php
$admin = User::find(5);
$entregados = $admin->prestamosEntregados()->get();
echo "Admin entregó: " . $entregados->count() . " préstamos";
```

---

## 🚨 ERRORES POSIBLES Y SOLUCIONES

### Error 1: "401 Unauthorized"
```
Causa: Token no válido o no enviado
Solución: Verificar Authorization: Bearer <token> en headers
```

### Error 2: "403 Forbidden"
```
Causa: Usuario no es ADMIN
Solución: Solo admins pueden ejecutar esta acción
```

### Error 3: "404 Not Found"
```
Causa: Préstamo no existe
Solución: Verificar que idPrestamo sea correcto
```

### Error 4: "400 Bad Request" + mensaje
```
"Solo préstamos en estado APROBADO pueden marcarse..."
Causa: Préstamo no está en APROBADO
Solución: Aprobar el préstamo primero

O:

"Solo un administrador puede marcar..."
Causa: Usuario obtenido no es admin (muy raro, validado en middleware)
Solución: Contactar administrador
```

---

## 📋 CHECKLIST DE PRUEBAS

```
Manual Testing:

[ ] 1. Admin logueado
    [ ] a. Obtiene token válido
    [ ] b. Token tiene info de admin

[ ] 2. Préstamo en estado APROBADO existe
    [ ] a. SELECT * FROM prestamos WHERE estado = 'APROBADO'

[ ] 3. Hacer POST a /admin/prestamos/{id}/marcar-entregado
    [ ] a. Headers con Authorization
    [ ] b. Content-Type: application/json
    [ ] c. Body vacío {}

[ ] 4. Verificar respuesta
    [ ] a. Status 200 OK
    [ ] b. Message correcta

[ ] 5. Verificar BD
    [ ] a. estado = ENTREGADO
    [ ] b. admin_entregado_id = id admin
    [ ] c. fecha_entregado ≠ NULL
    [ ] d. updated_at se actualizó

[ ] 6. Verificar logs
    [ ] a. storage/logs/laravel-YYYY-MM-DD.log
    [ ] b. Buscar "Préstamo marcado como ENTREGADO"

[ ] 7. Intentar marcar igual préstamo de nuevo
    [ ] a. Debe fallar (estado ya es ENTREGADO)
    [ ] b. Error: "Solo préstamos en estado APROBADO..."

[ ] 8. Intentar sin ser admin
    [ ] a. Debe fallar 403
```

---

## 🎬 EJEMPLO DE EJECUCIÓN COMPLETA

```bash
# Terminal 1 - Backend artisan (si tienes watch)
php artisan serve

# Terminal 2 - Cliente (Postman, curl, etc)
curl -X POST http://localhost:8000/api/admin/prestamos/123/marcar-entregado \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..." \
  -H "Content-Type: application/json" \
  -d "{}"

# Respuesta esperada:
{
  "message": "Préstamo marcado como ENTREGADO correctamente."
}

# Verificar en tinker:
php artisan tinker
Prestamo::find(123)->estado; // "ENTREGADO"
Prestamo::find(123)->admin_entregado_id; // 5
Prestamo::find(123)->fecha_entregado; // 2026-01-26 14:35:42
Prestamo::find(123)->adminEntregado->persona->Nombre; // "Juan Pérez"
```

---

✅ **FLUJO COMPLETAMENTE DOCUMENTED Y FUNCIONAL**

