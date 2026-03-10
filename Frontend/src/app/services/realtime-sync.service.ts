import { Injectable, OnDestroy, inject } from '@angular/core';
import { BehaviorSubject, Subject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Servicio de Sincronización en Tiempo Real (SSE)
 * 
 * Responsabilidades:
 * - Mantener conexión EventSource a servidor SSE
 * - Parsear eventos del servidor
 * - Emitir cambios a suscriptores
 * - Reconectar automáticamente tras desconexiones
 * - Gestionar el ciclo de vida de la conexión
 * 
 * @example
 * this.realtime.onPRESTAMO_ACTUALIZADO$.subscribe(evento => {
 *   console.log('Préstamo actualizado:', evento.datos);
 * });
 */
@Injectable({
  providedIn: 'root'
})
export class RealtimeSyncService implements OnDestroy {
  
  private eventSource: EventSource | null = null;
  private destroy$ = new Subject<void>();

  // Eventos de cambios en préstamos
  private prestamoActualizadoSubject = new Subject<any>();
  onPRESTAMO_ACTUALIZADO$ = this.prestamoActualizadoSubject.asObservable();

  private prestamoCreatedSubject = new Subject<any>();
  onPRESTAMO_CREADO$ = this.prestamoCreatedSubject.asObservable();

  // Eventos de cambios en sanciones
  private sancionActualizadoSubject = new Subject<any>();
  onSANCION_ACTUALIZADO$ = this.sancionActualizadoSubject.asObservable();

  private sancionCreatedSubject = new Subject<any>();
  onSANCION_CREADO$ = this.sancionCreatedSubject.asObservable();

  // Estado de conexión
  private conectadoSubject = new BehaviorSubject<boolean>(false);
  conectado$ = this.conectadoSubject.asObservable();

  private intentosReconexion = 0;
  private maxIntentos = 10;
  private delayReconexion = 3000; // 3 segundos inicial

  constructor() {}

  /**
   * Iniciar conexión SSE
   */
  iniciarConexion(token: string): void {
    if (this.eventSource) {
      console.log('[RealtimeSyncService] Ya conectado, ignorando llamada duplicada');
      return; // Ya conectado
    }

    if (!token) {
      console.warn('[RealtimeSyncService] ❌ No hay token disponible, no se puede conectar a SSE');
      return;
    }

    // Construir URL del API
    const apiUrl = this.getApiBaseUrl();
    // ⚠️ IMPORTANTE: Pasar token como query param porque EventSource no soporta headers
    // ⚠️ NOTE: Si apiUrl no incluye /api, agregarlo (ej: http://localhost:8000 → http://localhost:8000/api)
    const baseUrl = apiUrl.endsWith('/api') ? apiUrl : (apiUrl.endsWith('/') ? `${apiUrl}api` : `${apiUrl}/api`);
    const url = `${baseUrl}/admin/stream/cambios?token=${encodeURIComponent(token)}`;

    console.log('[RealtimeSyncService] 🔌 Conectando a SSE:', url);

    this.eventSource = new EventSource(url);

    // ────────────────────────────────────────────
    // EVENTOS DE PRÉSTAMOS
    // ────────────────────────────────────────────
    this.eventSource.addEventListener('PRESTAMO_ACTUALIZADO', (event: Event) => {
      const customEvent = event as MessageEvent;
      try {
        const datos = JSON.parse(customEvent.data);
        this.prestamoActualizadoSubject.next(datos);
      } catch (e) {
        console.warn('Error al parsear evento PRESTAMO_ACTUALIZADO:', e);
      }
    });

    this.eventSource.addEventListener('PRESTAMO_CREADO', (event: Event) => {
      const customEvent = event as MessageEvent;
      try {
        const datos = JSON.parse(customEvent.data);
        this.prestamoCreatedSubject.next(datos);
      } catch (e) {
        console.warn('Error al parsear evento PRESTAMO_CREADO:', e);
      }
    });

    // ────────────────────────────────────────────
    // EVENTOS DE SANCIONES
    // ────────────────────────────────────────────
    this.eventSource.addEventListener('SANCION_ACTUALIZADO', (event: Event) => {
      const customEvent = event as MessageEvent;
      try {
        const datos = JSON.parse(customEvent.data);
        this.sancionActualizadoSubject.next(datos);
      } catch (e) {
        console.warn('Error al parsear evento SANCION_ACTUALIZADO:', e);
      }
    });

    this.eventSource.addEventListener('SANCION_CREADO', (event: Event) => {
      const customEvent = event as MessageEvent;
      try {
        const datos = JSON.parse(customEvent.data);
        this.sancionCreatedSubject.next(datos);
      } catch (e) {
        console.warn('Error al parsear evento SANCION_CREADO:', e);
      }
    });

    // ────────────────────────────────────────────
    // MANEJO DE CONEXIÓN
    // ────────────────────────────────────────────
    this.eventSource.onopen = () => {
      console.log('✅ SSE CONECTADO - Escuchando eventos en tiempo real');
      this.conectadoSubject.next(true);
      this.intentosReconexion = 0;
      this.delayReconexion = 3000;
    };

    this.eventSource.onerror = (error) => {
      console.error('❌ ERROR SSE - Reconectando...', error);
      this.conectadoSubject.next(false);
      this.cerrarConexion();
      this.reconectar(token);
    };
  }

  /**
   * Intentar reconectar con backoff exponencial
   */
  private reconectar(token: string): void {
    if (this.intentosReconexion >= this.maxIntentos) {
      console.error('🔴 Máximo de intentos de reconexión alcanzado');
      return;
    }

    this.intentosReconexion++;
    console.log(`🔄 Reconectando en ${this.delayReconexion}ms (intento ${this.intentosReconexion}/${this.maxIntentos})`);

    setTimeout(() => {
      this.iniciarConexion(token);
      // Backoff exponencial: 3s, 6s, 12s... hasta max 60s
      this.delayReconexion = Math.min(this.delayReconexion * 1.5, 60000);
    }, this.delayReconexion);
  }

  /**
   * Cerrar conexión SSE
   */
  cerrarConexion(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.conectadoSubject.next(false);
      console.log('🛑 SSE desconectado');
    }
  }

  /**
   * Verificar si está conectado
   */
  estaConectado(): boolean {
    return this.conectadoSubject.value;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.cerrarConexion();
  }

  /**
   * Obtener URL base del API desde environment o localStorage
   * (environment es la fuente principal, localStorage es fallback)
   */
  private getApiBaseUrl(): string {
    // Prioridad 1: Usar environment.apiBaseUrl (configuración del proyecto)
    if (environment.apiBaseUrl) {
      return environment.apiBaseUrl;
    }
    
    // Prioridad 2: Intentar obtener de localStorage (guardado en login)
    let apiUrl = localStorage.getItem('apiBaseUrl') || sessionStorage.getItem('apiBaseUrl');
    
    if (apiUrl) {
      return apiUrl;
    }

    // Prioridad 3: Fallback a URL relativa (si frontend y backend están en mismo servidor)
    console.warn('[RealtimeSyncService] ⚠️ No se encontró apiBaseUrl en env ni localStorage, usando fallback');
    return window.location.origin + '/api';
  }
}
