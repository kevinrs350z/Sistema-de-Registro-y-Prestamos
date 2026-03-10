import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, interval, of } from 'rxjs';
import { takeUntil, switchMap, tap, catchError, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { SancionesService } from './sanciones.service';
import { DataSyncService } from './data-sync.service';
import { RealtimeSyncService } from './realtime-sync.service';

/**
 * Servicio de estado reactivo para sanciones
 * 
 * Mantiene estado centralizado de:
 * - Lista de sanciones activas
 * - Sanciones por usuario
 * 
 * Sincroniza automáticamente con polling inteligente.
 * 
 * @example
 * // En componente admin
 * constructor(private sancionState: SancionStateService) {}
 * 
 * ngOnInit() {
 *   this.sanciones$ = this.sancionState.sanciones$;
 *   this.sancionState.iniciarPolling();
 * }
 */
@Injectable({
  providedIn: 'root'
})
export class SancionStateService implements OnDestroy {

  // ─────────────────────────────────────────────────────────
  // Configuración
  // ─────────────────────────────────────────────────────────
  private readonly POLL_INTERVAL_MS = 5000; // 5 segundos

  // ─────────────────────────────────────────────────────────
  // Estado interno (privado)
  // ─────────────────────────────────────────────────────────
  private sancionesSubject = new BehaviorSubject<any[]>([]);
  private sancionesActivasSubject = new BehaviorSubject<any[]>([]);
  private sancionesPorUsuarioSubject = new BehaviorSubject<Map<number, any[]>>(new Map());
  private pollingActivoSubject = new BehaviorSubject<boolean>(false);
  private cargandoSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  private destroy$ = new Subject<void>();
  private pollingInterval$ = new Subject<number>();

  // ─────────────────────────────────────────────────────────
  // Observables públicos (lectura)
  // ─────────────────────────────────────────────────────────
  sanciones$: Observable<any[]> = this.sancionesSubject.asObservable().pipe(
    distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
  );

  sancionesActivas$: Observable<any[]> = this.sancionesActivasSubject.asObservable();

  sancionesPorUsuario$: Observable<Map<number, any[]>> = this.sancionesPorUsuarioSubject.asObservable();

  cargando$: Observable<boolean> = this.cargandoSubject.asObservable();

  error$: Observable<string | null> = this.errorSubject.asObservable();

  pollingActivo$: Observable<boolean> = this.pollingActivoSubject.asObservable();

  // ─────────────────────────────────────────────────────────
  // Dependencias
  // ─────────────────────────────────────────────────────────
  constructor(
    private sancionesApi: SancionesService,
    private dataSync: DataSyncService,
    private realtimeSync: RealtimeSyncService
  ) {
    // Escuchar invalidaciones de otras partes del sistema
    this.dataSync.cambiosSanciones$
      .pipe(
        debounceTime(500), // Agrupar múltiples cambios rápidos
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.refrescar(true);
      });

    // 🔔 ESCUCHAR EVENTOS SSE EN TIEMPO REAL
    // Cuando una sanción se actualiza en el servidor, refrescar inmediatamente
    this.realtimeSync.onSANCION_ACTUALIZADO$
      .pipe(
        tap(evento => {
          console.log('[SancionStateService] 🔔 Sanción actualizada vía SSE:', evento.datos.id);
          // Refrescar la lista de sanciones
          setTimeout(() => this.refrescar(false), 500);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();

    // Cuando se crea una nueva sanción
    this.realtimeSync.onSANCION_CREADO$
      .pipe(
        tap(evento => {
          console.log('[SancionStateService] 🔔 Nueva sanción vía SSE:', evento.datos.id);
          this.refrescar(false); // Refrescar sin loading
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
            console.log('[SancionStateService] SSE conectado, pausando polling');
            this.detenerPolling(); // Detener polling mientras SSE está activo
          } else {
            console.log('[SancionStateService] SSE desconectado, iniciando polling fallback');
            this.iniciarPolling(); // Usar polling como fallback si SSE falla
          }
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();

    // Configurar polling
    this.pollingInterval$
      .pipe(
        switchMap(intervalMs => 
          intervalMs > 0 
            ? interval(intervalMs)
            : of(null)
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
   */
  iniciarPolling(): void {
    if (this.pollingActivoSubject.value) {
      console.warn('[SancionStateService] Polling ya está activo');
      return;
    }

    console.log('[SancionStateService] Iniciando polling cada', this.POLL_INTERVAL_MS, 'ms');
    
    this.pollingActivoSubject.next(true);
    this.refrescar(true); // Primera carga inmediata
    this.pollingInterval$.next(this.POLL_INTERVAL_MS);
  }

  /**
   * Detener polling
   */
  detenerPolling(): void {
    console.log('[SancionStateService] Deteniendo polling');
    this.pollingActivoSubject.next(false);
    this.pollingInterval$.next(-1);
  }

  /**
   * Refrescar datos
   */
  refrescar(mostrarLoading: boolean = true): void {
    if (mostrarLoading) {
      this.cargandoSubject.next(true);
    }

    this.sancionesApi.getSanciones()
      .pipe(
        tap(res => {
          const sanciones = res?.sanciones || [];
          this.sancionesSubject.next(sanciones);

          // Filtrar sanciones activas
          const activas = sanciones.filter((s: any) => 
            s.estado === 'ACTIVA' || s.estado === 'EN_REVISION_COMITE'
          );
          this.sancionesActivasSubject.next(activas);

          this.errorSubject.next(null);
          this.dataSync.limpiarInvalidacionesSanciones();
        }),
        catchError(err => {
          console.error('[SancionStateService] Error refrescando sanciones:', err);
          this.errorSubject.next('Error al sincronizar sanciones');
          return of(null);
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
   * Refrescar sanciones de un usuario específico
   */
  refrescarPorUsuario(idUser: number): Observable<any> {
    this.cargandoSubject.next(true);
    
    return this.sancionesApi.getSancionesUsuario(idUser)
      .pipe(
        tap(res => {
          const mapActual = this.sancionesPorUsuarioSubject.value;
          mapActual.set(idUser, res?.sanciones || []);
          this.sancionesPorUsuarioSubject.next(new Map(mapActual));
          this.cargandoSubject.next(false);
        }),
        catchError(err => {
          console.error('[SancionStateService] Error refrescando sanciones de usuario:', err);
          this.cargandoSubject.next(false);
          return of(null);
        }),
        takeUntil(this.destroy$)
      );
  }

  /**
   * Obtener sanciones de un usuario (desde caché o refrescar)
   */
  obtenerSancionesUsuario(idUser: number): Observable<any[]> {
    const cached = this.sancionesPorUsuarioSubject.value.get(idUser);
    if (cached) {
      return new BehaviorSubject(cached).asObservable();
    }
    
    // Si no está en caché, refrescar
    return this.refrescarPorUsuario(idUser).pipe(
      switchMap(() => 
        new BehaviorSubject(
          this.sancionesPorUsuarioSubject.value.get(idUser) || []
        ).asObservable()
      )
    );
  }

  /**
   * Actualizar sanción localmente
   */
  actualizarSancionLocal(id: number, cambios: any): void {
    const sanciones = this.sancionesSubject.value.map(s => 
      s.id === id ? { ...s, ...cambios } : s
    );
    this.sancionesSubject.next(sanciones);

    // Actualizar activas
    const activas = sanciones.filter((s: any) => 
      s.estado === 'ACTIVA' || s.estado === 'EN_REVISION_COMITE'
    );
    this.sancionesActivasSubject.next(activas);
  }

  /**
   * Remover sanción del estado
   */
  removerSancion(id: number): void {
    const nuevas = this.sancionesSubject.value.filter((s: any) => s.id !== id);
    this.sancionesSubject.next(nuevas);

    const activas = nuevas.filter((s: any) => 
      s.estado === 'ACTIVA' || s.estado === 'EN_REVISION_COMITE'
    );
    this.sancionesActivasSubject.next(activas);
  }

  /**
   * Agregar sanción al estado
   */
  agregarSancion(sancion: any): void {
    const actuales = this.sancionesSubject.value;
    this.sancionesSubject.next([sancion, ...actuales]);

    if (sancion.estado === 'ACTIVA' || sancion.estado === 'EN_REVISION_COMITE') {
      const activas = this.sancionesActivasSubject.value;
      this.sancionesActivasSubject.next([sancion, ...activas]);
    }
  }

  ngOnDestroy(): void {
    this.detenerPolling();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
