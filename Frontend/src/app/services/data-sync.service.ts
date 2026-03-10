import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * Servicio coordinador de sincronización de datos
 * 
 * Responsabilidades:
 * - Gestionar invalidación de caché por módulo
 * - Coordinar polling inteligente
 * - Emitir eventos de cambio entre servicios
 * - Evitar poll duplicado
 * 
 * @example
 * // Invalidar caché de préstamos después de una acción
 * this.syncService.invalidarCache('PRESTAMOS', prestamoId);
 */
@Injectable({
  providedIn: 'root'
})
export class DataSyncService implements OnDestroy {
  
  private destroy$ = new Subject<void>();

  // ─────────────────────────────────────────────────────
  // Eventos de cambio por módulo
  // ─────────────────────────────────────────────────────
  private cambiosPrestamosSubject = new Subject<{ id?: number; tipo: 'CREAR' | 'ACTUALIZAR' | 'ELIMINAR' }>();
  cambiosPrestamos$ = this.cambiosPrestamosSubject.asObservable();

  private cambiosSancionesSubject = new Subject<{ id?: number; tipo: 'CREAR' | 'ACTUALIZAR' | 'ELIMINAR' }>();
  cambiosSanciones$ = this.cambiosSancionesSubject.asObservable();

  private cambiosInventarioSubject = new Subject<{ id?: number; tipo: 'ACTUALIZAR_STOCK' }>();
  cambiosInventario$ = this.cambiosInventarioSubject.asObservable();

  private cambiosEquiposSubject = new Subject<{ id?: number; tipo: 'CAMBIAR_ESTADO' | 'ACTUALIZAR' }>();
  cambiosEquipos$ = this.cambiosEquiposSubject.asObservable();

  // ─────────────────────────────────────────────────────
  // Estados de invalidación (para evitar polling innecesario)
  // ─────────────────────────────────────────────────────
  private invalidacionesPrestamos = new Set<number | null>();
  private invalidacionesSanciones = new Set<number | null>();
  private invalidacionesInventario = new Set<number | null>();

  constructor() {}

  // ─────────────────────────────────────────────────────
  // Invalidación de caché
  // ─────────────────────────────────────────────────────

  /**
   * Marcar caché de préstamos como inválido
   * @param id - ID del préstamo (null = invalidar todo)
   * @param tipo - Tipo de cambio
   */
  invalidarPrestamos(id: number | null = null, tipo: 'CREAR' | 'ACTUALIZAR' | 'ELIMINAR' = 'ACTUALIZAR'): void {
    this.invalidacionesPrestamos.add(id);
    this.cambiosPrestamosSubject.next({ id: id ?? undefined, tipo });
  }

  /**
   * Marcar caché de sanciones como inválido
   */
  invalidarSanciones(id: number | null = null, tipo: 'CREAR' | 'ACTUALIZAR' | 'ELIMINAR' = 'ACTUALIZAR'): void {
    this.invalidacionesSanciones.add(id);
    this.cambiosSancionesSubject.next({ id: id ?? undefined, tipo });
  }

  /**
   * Marcar caché de inventario como inválido
   */
  invalidarInventario(id: number | null = null): void {
    this.invalidacionesInventario.add(id);
    this.cambiosInventarioSubject.next({ id: id ?? undefined, tipo: 'ACTUALIZAR_STOCK' });
  }

  /**
   * Marcar caché de equipos como inválido
   */
  invalidarEquipos(id: number | null = null, tipo: 'CAMBIAR_ESTADO' | 'ACTUALIZAR' = 'ACTUALIZAR'): void {
    this.cambiosEquiposSubject.next({ id: id ?? undefined, tipo });
  }

  // ─────────────────────────────────────────────────────
  // Métodos de consulta
  // ─────────────────────────────────────────────────────

  /**
   * Verificar si hay invalidaciones pendientes
   */
  hayInvalidacionesPrestamos(): boolean {
    return this.invalidacionesPrestamos.size > 0;
  }

  hayInvalidacionesSanciones(): boolean {
    return this.invalidacionesSanciones.size > 0;
  }

  hayInvalidacionesInventario(): boolean {
    return this.invalidacionesInventario.size > 0;
  }

  /**
   * Limpiar invalidaciones después de refrescar
   */
  limpiarInvalidacionesPrestamos(): void {
    this.invalidacionesPrestamos.clear();
  }

  limpiarInvalidacionesSanciones(): void {
    this.invalidacionesSanciones.clear();
  }

  limpiarInvalidacionesInventario(): void {
    this.invalidacionesInventario.clear();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
