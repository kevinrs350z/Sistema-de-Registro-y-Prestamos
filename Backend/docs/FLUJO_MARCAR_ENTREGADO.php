<?php
/**
 * EJEMPLO: FLUJO COMPLETO MARCAR ENTREGADO
 * 
 * Este archivo documenta el flujo end-to-end para marcar un préstamo como ENTREGADO
 * con auditoría completa (quién, cuándo, qué).
 * 
 * ========================================================================
 * 1. FRONTEND (Angular) - REQUEST
 * ========================================================================
 * 
 * // En tu servicio Angular de préstamos:
 * marcarEntregado(idPrestamo: number): Observable<any> {
 *   return this.http.post(
 *     `/api/admin/prestamos/${idPrestamo}/marcar-entregado`,
 *     {},
 *     { headers: { 'Authorization': `Bearer ${token}` } }
 *   );
 * }
 * 
 * // Uso en componente:
 * this.prestamoService.marcarEntregado(123).subscribe(
 *   (response) => {
 *     console.log(response.message); // "Préstamo marcado como ENTREGADO correctamente."
 *     this.actualizarLista(); // Recargar lista de préstamos
 *   },
 *   (error) => {
 *     console.error(error.error.error); // Mostrar error
 *   }
 * );
 * 
 * ========================================================================
 * 2. BACKEND - RUTAS (routes/api.php)
 * ========================================================================
 * 
 * Route::middleware(['auth:sanctum', 'admin'])->group(function () {
 *   Route::post('/admin/prestamos/{id}/marcar-entregado', 
 *       [PrestamoAdminController::class, 'marcarEntregado']
 *   );
 * });
 * 
 * VALIDACIONES EN RUTA:
 * - auth:sanctum → usuario debe estar autenticado
 * - admin → usuario debe ser ADMIN (middleware AdminMiddleware verifica User::isAdmin())
 * - {id} → idPrestamo a procesar
 * 
 * ========================================================================
 * 3. BACKEND - CONTROLADOR (PrestamoAdminController)
 * ========================================================================
 * 
 * public function marcarEntregado(int $id)
 * {
 *   try {
 *     // auth()->user()->idUser obtiene el admin autenticado
 *     $this->service->marcarEntregado(
 *       $id,
 *       auth()->user()->idUser
 *     );
 * 
 *     return response()->json([
 *       'message' => 'Préstamo marcado como ENTREGADO correctamente.'
 *     ]);
 *   } catch (\Exception $e) {
 *     return response()->json([
 *       'error' => $e->getMessage()
 *     ], 400);
 *   }
 * }
 * 
 * ========================================================================
 * 4. BACKEND - SERVICIO (PrestamoAdminService::marcarEntregado)
 * ========================================================================
 * 
 * LÓGICA:
 * 1. Inicia transacción DB
 * 2. Obtiene el préstamo
 * 3. Valida que esté en estado APROBADO (solo ese estado puede pasar a ENTREGADO)
 * 4. Valida que quien ejecuta sea ADMIN
 * 5. Registra:
 *    - admin_entregado_id = id del admin actual
 *    - fecha_entregado = datetime exacto (now())
 *    - estado = ENTREGADO
 * 6. Guarda cambios
 * 7. Registra en log
 * 8. Commit transacción
 * 
 * SI FALLA EN CUALQUIER PUNTO:
 * - Rollback automático
 * - Lanza excepción con mensaje
 * - Controlador captura y devuelve HTTP 400
 * 
 * ========================================================================
 * 5. TABLA prestamos - CAMPOS NUEVOS
 * ========================================================================
 * 
 * ALTER TABLE prestamos ADD COLUMN admin_entregado_id BIGINT UNSIGNED NULL;
 * ALTER TABLE prestamos ADD COLUMN fecha_entregado DATETIME NULL;
 * ALTER TABLE prestamos ADD FOREIGN KEY (admin_entregado_id) 
 *   REFERENCES users(idUser) ON DELETE SET NULL;
 * 
 * VALORES DESPUÉS DE marcarEntregado():
 * - admin_entregado_id = 5 (ejemplo: id del admin que ejecutó)
 * - fecha_entregado = 2026-01-26 14:35:42
 * - estado = ENTREGADO (cambió de APROBADO)
 * - updated_at = 2026-01-26 14:35:42 (automático Laravel)
 * 
 * ========================================================================
 * 6. ENUM EstadoPrestamo - NUEVO ESTADO
 * ========================================================================
 * 
 * const PENDIENTE_ENTREGA = 'PENDIENTE_ENTREGA';
 * 
 * FLUJO DE ESTADOS SOPORTADOS:
 * 
 * PENDIENTE → [APROBADO ó RECHAZADO]
 *              ↓
 *          APROBADO → ENTREGADO → DEVUELTO
 *                         ↓
 *                    (física)
 * 
 * PENDIENTE_ENTREGA es opcional para futuro:
 * - Podría usarse entre APROBADO y ENTREGADO si necesitas intermedio
 * - Hoy en día pasa directo de APROBADO a ENTREGADO
 * 
 * ========================================================================
 * 7. AUDITORÍA COMPLETA
 * ========================================================================
 * 
 * QUIÉN: admin_entregado_id + relación Prestamo::adminEntregado()->persona->Nombre
 * CUÁNDO: fecha_entregado (exacta en datetime)
 * QUÉ: estado cambió a ENTREGADO
 * DONDE: tabla prestamos
 * 
 * CONSULTA PARA AUDITAR:
 * 
 * $prestamo = Prestamo::with('adminEntregado.persona')
 *   ->find($id);
 * 
 * return [
 *   'id' => $prestamo->idPrestamo,
 *   'estado' => $prestamo->estado,
 *   'admin_entregado_por' => $prestamo->adminEntregado?->persona?->Nombre,
 *   'fecha_entregado' => $prestamo->fecha_entregado,
 *   'cambio_registrado_en' => $prestamo->updated_at,
 * ];
 * 
 * ========================================================================
 * 8. VALIDACIONES EN FLUJO
 * ========================================================================
 * 
 * PUNTO 1 - RUTA:
 *   ✅ Solo admins (middleware)
 *   ✅ Solo autenticados (middleware auth:sanctum)
 * 
 * POINT 2 - SERVICIO:
 *   ✅ Préstamo debe existir (findOrFail)
 *   ✅ Estado debe ser APROBADO (sino lanza excepción)
 *   ✅ Usuario debe ser admin (isAdmin() double-check)
 * 
 * PUNTO 3 - TRANSACCIÓN:
 *   ✅ Todo o nada (DB::transaction)
 *   ✅ Si falla, rollback automático
 * 
 * ========================================================================
 * 9. EJEMPLO DE EJECUCIÓN EXITOSA
 * ========================================================================
 * 
 * REQUEST:
 *   POST /api/admin/prestamos/123/marcar-entregado
 *   Headers: Authorization: Bearer token_admin
 * 
 * RESPUESTA 200:
 *   {
 *     "message": "Préstamo marcado como ENTREGADO correctamente."
 *   }
 * 
 * BD ACTUALIZADA:
 *   prestamos.idPrestamo = 123
 *   - estado: APROBADO → ENTREGADO
 *   - admin_entregado_id: NULL → 5 (id del admin)
 *   - fecha_entregado: NULL → 2026-01-26 14:35:42
 *   - updated_at: 2026-01-26 13:20:00 → 2026-01-26 14:35:42
 * 
 * LOG:
 *   [2026-01-26 14:35:42] local.INFO: Préstamo marcado como ENTREGADO {
 *     "idPrestamo": 123,
 *     "admin_id": 5,
 *     "admin_nombre": "Juan Pérez",
 *     "timestamp": "2026-01-26 14:35:42"
 *   }
 * 
 * ========================================================================
 * 10. EJEMPLO DE ERROR
 * ========================================================================
 * 
 * REQUEST:
 *   POST /api/admin/prestamos/456/marcar-entregado
 *   Headers: Authorization: Bearer token_admin
 *   (pero prestamo 456 está en estado PENDIENTE)
 * 
 * RESPUESTA 400:
 *   {
 *     "error": "Solo préstamos en estado APROBADO pueden marcarse como ENTREGADO. Estado actual: PENDIENTE"
 *   }
 * 
 * BD: sin cambios (rollback)
 * 
 * ========================================================================
 */

?>
