import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, interval, of } from 'rxjs';
import { takeUntil, switchMap, tap, catchError, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PrestamosAdminService } from './prestamos-admin.service';
import { DataSyncService } from './data-sync.service';
import { RealtimeSyncService } from './realtime-sync.service';

/**
 * Servicio de estado reactivo para préstamos
 * 
 * Mantiene estado centralizado de:
 * - Solicitudes pendientes
 * - Préstamos aprobados
 * - Préstamos finalizados
 * 
 * Sincroniza automáticamente con polling inteligente.
 * 
 * @example
 * // En componente
 * constructor(private prestamoState: PrestamoStateService) {}
 * 
 * ngOnInit() {
 *   this.solicitudes$ = this.prestamoState.solicitudes$;
 *   this.prestamoState.iniciarPolling();
 * }
 */
@Injectable({
  providedIn: 'root'
})
export class PrestamoStateService implements OnDestroy {

  // ─────────────────────────────────────────────────────────
  // Configuración
  // ─────────────────────────────────────────────────────────
  private readonly POLL_INTERVAL_MS = 5000; // 5 segundos
  private readonly FAST_POLL_INTERVAL_MS = 2000; // 2 segundos después de un cambio

  // ─────────────────────────────────────────────────────────
  // Estado interno (privado)
  // ─────────────────────────────────────────────────────────
  private solicitudesSubject = new BehaviorSubject<any[]>([]);
  private historialSubject = new BehaviorSubject<any[]>([]);
  private pollingActivoSubject = new BehaviorSubject<boolean>(false);
  private cargandoSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  private destroy$ = new Subject<void>();
  private pollingInterval$ = new Subject<number>();

  // ─────────────────────────────────────────────────────────
  // Observables públicos (lectura)
  // ─────────────────────────────────────────────────────────
  solicitudes$: Observable<any[]> = this.solicitudesSubject.asObservable().pipe(
    distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
  );

  historial$: Observable<any[]> = this.historialSubject.asObservable();

  cargando$: Observable<boolean> = this.cargandoSubject.asObservable();

  error$: Observable<string | null> = this.errorSubject.asObservable();

  pollingActivo$: Observable<boolean> = this.pollingActivoSubject.asObservable();

  // ─────────────────────────────────────────────────────────
  // Dependencias
  // ─────────────────────────────────────────────────────────
  constructor(
    private prestamosApi: PrestamosAdminService,
    private dataSync: DataSyncService,
    private realtimeSync: RealtimeSyncService
  ) {
    // Escuchar invalidaciones de otras partes del sistema
    this.dataSync.cambiosPrestamos$
      .pipe(
        debounceTime(500), // Agrupar múltiples cambios rápidos
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.refrescar(true); // Refresh de una vez
      });

    // 🔔 ESCUCHAR EVENTOS SSE EN TIEMPO REAL
    // Cuando un préstamo se actualiza en el servidor, refrescar inmediatamente
    this.realtimeSync.onPRESTAMO_ACTUALIZADO$
      .pipe(
        tap(evento => {
          console.log('[PrestamoStateService] 🔔 Préstamo actualizado vía SSE:', evento.datos.id);
          // Actualizar localmente si existe, sino refrescar todo
          const solicitud = this.obtenerSolicitud(evento.datos.id);
          if (solicitud) {
            this.actualizarEstadoLocal(evento.datos.id, evento.datos.estado);
          }
          // Refrescar después de 500ms para consolidar múltiples cambios
          setTimeout(() => this.refrescar(false), 500);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();

    // Cuando se crea un nuevo préstamo
    this.realtimeSync.onPRESTAMO_CREADO$
      .pipe(
        tap(evento => {
          console.log('[PrestamoStateService] 🔔 Nuevo préstamo vía SSE:', evento.datos.id);
          this.refrescar(false); // Refrescar sin loading ya que fue el usuario quien creó
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();

    // 🔗 GESTIÓN INTELIGENTE DE POLLING
    // Si SSE está conectado → pausar polling (más eficiente)
    // Si SSE se desconecta → reiniciar polling como fallback
    this.realtimeSync.conectado$
      .pipe(
        tap(conectado => {
          if (conectado) {
            console.log('[PrestamoStateService] SSE conectado, pausando polling');
            this.detenerPolling(); // Detener polling mientras SSE está activo
          } else {
            console.log('[PrestamoStateService] SSE desconectado, iniciando polling fallback');
            this.iniciarPolling(); // Usar polling como fallback si SSE falla
          }
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();

    // Configurar polling con intervalo dinámico
    this.pollingInterval$
      .pipe(
        switchMap(intervalMs => 
          intervalMs > 0 
            ? interval(intervalMs)
            : of(null) // Detener polling
        ),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.refrescar(false);
      });
  }

  // ─────────────────────────────────────────────────────────
  // Métodos públicos
  // ─────────────────────────────────────────────────────────

  /**
   * Iniciar polling automático
   * Llama al API cada POLL_INTERVAL_MS
   */
  iniciarPolling(): void {
    if (this.pollingActivoSubject.value) {
      console.warn('[PrestamoStateService] Polling ya está activo');
      return;
    }

    console.log('[PrestamoStateService] Iniciando polling cada', this.POLL_INTERVAL_MS, 'ms');
    
    this.pollingActivoSubject.next(true);
    this.refrescar(true); // Primera carga inmediata
    this.pollingInterval$.next(this.POLL_INTERVAL_MS); // Iniciar intervalo
  }

  /**
   * Detener polling
   */
  detenerPolling(): void {
    console.log('[PrestamoStateService] Deteniendo polling');
    this.pollingActivoSubject.next(false);
    this.pollingInterval$.next(-1); // Detener
  }

  /**
   * Refrescar datos una sola vez
   * @param mostrarLoading - Si mostrar indicador de carga
   */
  refrescar(mostrarLoading: boolean = true): void {
    if (mostrarLoading) {
      this.cargandoSubject.next(true);
    }

    // Cargar solicitudes pendientes + aprobadas para entrega
    this.prestamosApi.getPendientes()
      .pipe(
        tap(data => {
          this.solicitudesSubject.next(data || []);
          this.errorSubject.next(null);
          this.dataSync.limpiarInvalidacionesPrestamos();
        }),
        catchError(err => {
          console.error('[PrestamoStateService] Error refrescando solicitudes:', err);
          this.errorSubject.next('Error al sincronizar solicitudes');
          return of([]);
        }),
        tap(() => {
          if (mostrarLoading) {
            this.cargandoSubject.next(false);
          }
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  /**
   * Obtener solicitud por ID (del estado actual)
   */
  obtenerSolicitud(id: number): any {
    return this.solicitudesSubject.value.find((s: any) => s.idPrestamo === id);
  }

  /**
   * Actualizar localmente el estado de una solicitud (optimista)
   * Se usa para feedback inmediato mientras se refrescan datos
   */
  actualizarEstadoLocal(id: number, estado: "PENDIENTE" | "APROBADO" | "ENTREGADO" | "RECHAZADO"): void {
    const solicitudes = this.solicitudesSubject.value;
    const index = solicitudes.findIndex((s: any) => s.idPrestamo === id);
    
    if (index !== -1) {
      const actualizada = { ...solicitudes[index], estado };
      const nuevas = [...solicitudes];
      nuevas[index] = actualizada;
      this.solicitudesSubject.next(nuevas);
    }
  }

  /**
   * Remover solicitud del estado local
   * Se usa cuando se elimina o finaliza una solicitud
   */
  removerSolicitud(id: number): void {
    const nuevas = this.solicitudesSubject.value.filter((s: any) => s.idPrestamo !== id);
    this.solicitudesSubject.next(nuevas);
  }

  /**
   * Agregar nueva solicitud al estado local
   * Se usa cuando el usuario actual crea una nueva
   */
  agregarSolicitud(solicitud: any): void {
    const actuales = this.solicitudesSubject.value;
    this.solicitudesSubject.next([solicitud, ...actuales]);
  }

  ngOnDestroy(): void {
    this.detenerPolling();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
