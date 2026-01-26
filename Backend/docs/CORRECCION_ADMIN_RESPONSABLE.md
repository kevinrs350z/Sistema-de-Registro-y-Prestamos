
# ✅ CORRECCIÓN - ADMIN RESPONSABLE DEL CAMBIO DE ESTADO

## 🔄 CAMBIO REALIZADO

Cambié la lógica de auditoría para que **NO sea solo para ENTREGADO**, sino para registrar **QUIÉN realiza CUALQUIER cambio de estado** importante.

### ANTES:
```php
admin_entregado_id  → Solo para marcar ENTREGADO
fecha_entregado     → Solo para marcar ENTREGADO
```

### AHORA:
```php
admin_responsable_id  → QUIÉN realiza el cambio (APROBADO, RECHAZADO, ENTREGADO, DEVUELTO)
fecha_cambio_estado   → CUÁNDO exacto del cambio
```

---

## 📝 CAMBIOS IMPLEMENTADOS

### 1️⃣ Migraciones
```
✅ 2026_01_26_000001_add_audit_to_prestamos_table.php
   - Renombrado para usar campos genéricos

✅ 2026_01_26_000002_rename_admin_columns_prestamos.php (NUEVA)
   - Renombra admin_entregado_id → admin_responsable_id
   - Renombra fecha_entregado → fecha_cambio_estado
```

### 2️⃣ Modelos
```php
// Prestamo.php
adminResponsable()  ← Relación con el admin responsable

// User.php
prestamosResponsable()  ← Todos los préstamos donde fue responsable del cambio
```

### 3️⃣ Lógica de Negocio (PrestamoAdminService.php)

**cambiarEstado()** (APROBADO / RECHAZADO):
```php
$prestamo->admin_responsable_id = auth()->id() ?? auth('sanctum')->user()?->idUser;
$prestamo->fecha_cambio_estado = now();
$prestamo->save();
```

**marcarDevuelto()** (PENDIENTE → DEVUELTO):
```php
$prestamo->admin_responsable_id = auth()->id() ?? auth('sanctum')->user()?->idUser;
$prestamo->fecha_cambio_estado = now();
$prestamo->save();
```

**devolverEquipo()** (DEVOLUCIÓN PARCIAL → DEVUELTO):
```php
if ($pendientes === 0) {
    $prestamo->admin_responsable_id = auth()->id() ?? auth('sanctum')->user()?->idUser;
    $prestamo->fecha_cambio_estado = now();
    $prestamo->save();
}
```

**marcarEntregado()** (APROBADO → ENTREGADO):
```php
$prestamo->admin_responsable_id = $adminId;
$prestamo->fecha_cambio_estado = now();
$prestamo->estado = EstadoPrestamo::ENTREGADO;
$prestamo->save();
```

---

## 📊 FLUJOS DE CAMBIO DE ESTADO AUDITADOS

```
PENDIENTE
  ↓ (admin aprueba)
APROBADO ← admin_responsable_id registrado + fecha_cambio_estado
  ├─ (admin rechaza)
  │  ↓
  │ RECHAZADO ← admin_responsable_id registrado + fecha_cambio_estado
  │
  ├─ (admin marca ENTREGADO - física)
  │  ↓
  │ ENTREGADO ← admin_responsable_id registrado + fecha_cambio_estado
  │  ↓ (alumno devuelve equipos)
  │  ↓ (admin marca DEVUELTO)
  │  ↓
  │ DEVUELTO ← admin_responsable_id registrado + fecha_cambio_estado
  │
  └─ (admin devuelve equipos parciales)
     ↓
     DEVUELTO ← admin_responsable_id registrado + fecha_cambio_estado (cuando se devuelven todos)
```

---

## 🎯 AUDITORÍA COMPLETA

Ahora puedes saber:

### ✅ QUIÉN aprobó el préstamo:
```php
$prestamo = Prestamo::with('adminResponsable.persona')->find($id);
echo "Aprobado por: " . $prestamo->adminResponsable->persona->Nombre;
```

### ✅ QUIÉN rechazó el préstamo:
```php
$prestamo = Prestamo::where('estado', 'RECHAZADO')->first();
echo "Rechazado por: " . $prestamo->adminResponsable->persona->Nombre;
```

### ✅ QUIÉN marcó ENTREGADO:
```php
$prestamo = Prestamo::where('estado', 'ENTREGADO')->first();
echo "Entregado por: " . $prestamo->adminResponsable->persona->Nombre;
echo "Entregado el: " . $prestamo->fecha_cambio_estado;
```

### ✅ QUIÉN marcó DEVUELTO:
```php
$prestamo = Prestamo::where('estado', 'DEVUELTO')->first();
echo "Devuelto por: " . $prestamo->adminResponsable->persona->Nombre;
echo "Devuelto el: " . $prestamo->fecha_cambio_estado;
```

### ✅ Todos los cambios de un admin:
```php
$admin = User::find(5);
$cambios = $admin->prestamosResponsable()->get();
echo "Este admin hizo " . $cambios->count() . " cambios de estado";
```

---

## 📋 TABLA EN BD

```sql
-- Antes
admin_entregado_id  BIGINT UNSIGNED NULL
fecha_entregado     DATETIME NULL

-- Después (más genérico)
admin_responsable_id  BIGINT UNSIGNED NULL
fecha_cambio_estado   DATETIME NULL

-- Índices
INDEX idx_prestamo_admin_responsable (admin_responsable_id)
INDEX idx_prestamo_fecha_cambio_estado (fecha_cambio_estado)
```

---

## ✅ MIGRACIONES EJECUTADAS

```
✅ 2026_01_26_000002_rename_admin_columns_prestamos
   - Renombrada exitosamente
   - Columnas listas para usar
```

---

## 🚀 ENDPOINT SIGUE IGUAL

```
POST /api/admin/prestamos/{id}/marcar-entregado
```

**Pero ahora:**
- ✅ Registra `admin_responsable_id` (no solo `admin_entregado_id`)
- ✅ Registra `fecha_cambio_estado` (más genérico)
- ✅ Se reutiliza para TODOS los cambios de estado

---

## ✅ SIN ERRORES

```
✅ Prestamo.php       → No errors
✅ User.php           → No errors
✅ PrestamoAdminService.php → No errors
✅ Migraciones ejecutadas exitosamente
```

---

**CAMBIO COMPLETO: Sistema de auditoría genérico para CUALQUIER cambio de estado**
