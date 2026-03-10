import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, fromEvent, merge, Subscription } from 'rxjs';
import { throttleTime } from 'rxjs/operators';
import { NotificationService } from './notification.service';

/**
 * ISO 27001 — A.11.2.8 / A.9.4.2
 * Control de sesión por inactividad.
 *
 * - Cierra la sesión automáticamente tras IDLE_TIMEOUT minutos sin interacción.
 * - Muestra advertencia WARNING_BEFORE minutos antes del cierre.
 * - Eventos monitoreados: mouse, teclado, touch, scroll.
 */
@Injectable({ providedIn: 'root' })
export class SessionService implements OnDestroy {

  /** Minutos de inactividad antes de cerrar sesión */
  private readonly IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 min

  /** Minutos antes del cierre para mostrar advertencia */
  private readonly WARNING_BEFORE_MS = 2 * 60 * 1000; // 2 min antes

  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private warningTimer: ReturnType<typeof setTimeout> | null = null;
  private activitySub: Subscription | null = null;
  private warningShown = false;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private zone: NgZone,
    private notification: NotificationService
  ) {}

  /**
   * Inicia el monitoreo de inactividad.
   * Llamar después del login exitoso.
   */
  start(): void {
    this.stop(); // Limpiar cualquier timer anterior

    // Escuchar eventos de usuario (throttled para no sobrecargar)
    this.zone.runOutsideAngular(() => {
      const events$ = merge(
        fromEvent(document, 'mousemove'),
        fromEvent(document, 'mousedown'),
        fromEvent(document, 'keydown'),
        fromEvent(document, 'touchstart'),
        fromEvent(document, 'scroll', { capture: true })
      ).pipe(throttleTime(15_000)); // cada 15s máximo

      this.activitySub = events$.subscribe(() => {
        this.resetTimers();
      });
    });

    this.resetTimers();
  }

  /**
   * Detiene el monitoreo (llamar en logout).
   */
  stop(): void {
    if (this.idleTimer) { clearTimeout(this.idleTimer); this.idleTimer = null; }
    if (this.warningTimer) { clearTimeout(this.warningTimer); this.warningTimer = null; }
    this.activitySub?.unsubscribe();
    this.activitySub = null;
    this.warningShown = false;
  }

  ngOnDestroy(): void {
    this.stop();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private resetTimers(): void {
    // Limpiar timers existentes
    if (this.idleTimer) clearTimeout(this.idleTimer);
    if (this.warningTimer) clearTimeout(this.warningTimer);
    this.warningShown = false;

    // Timer de advertencia
    this.warningTimer = setTimeout(() => {
      this.zone.run(() => {
        this.warningShown = true;
        this.notification.warning(
          'Tu sesión se cerrará en 2 minutos por inactividad. Interactúa con la página para mantenerla activa.'
        );
      });
    }, this.IDLE_TIMEOUT_MS - this.WARNING_BEFORE_MS);

    // Timer de cierre
    this.idleTimer = setTimeout(() => {
      this.zone.run(() => {
        this.forceLogout();
      });
    }, this.IDLE_TIMEOUT_MS);
  }

  private forceLogout(): void {
    this.stop();

    // Limpiar sesión
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('rol');

    this.notification.info('Sesión cerrada por inactividad.');
    this.router.navigate(['/auth/login'], { replaceUrl: true });
  }
}
