import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../services/loading.service';

/**
 * Interceptor global de loading.
 *
 * Muestra el overlay "Procesando solicitud…" para requests mutacionales.
 * Se puede omitir enviando el header `X-Skip-Loading: true`
 * (usado por endpoints de lectura BI/reportes y SSE).
 */
export const LoadingInterceptor: HttpInterceptorFn = (req, next) => {

  const loadingService = inject(LoadingService);

  // ── Skip para SSE streams (EventSource) ────────────────────
  // Las conexiones SSE usan GET /admin/stream/cambios y son long-polling
  const isSSEStream = req.url.includes('/stream/cambios');

  if (isSSEStream) {
    return next(req);
  }

  // ── Skip para requests de lectura BI ────────────────────
  const skipLoading = req.headers.has('X-Skip-Loading');

  if (skipLoading) {
    // Quitar el header custom antes de enviar al servidor
    const cleanReq = req.clone({
      headers: req.headers.delete('X-Skip-Loading')
    });
    return next(cleanReq);
  }

  // ── Comportamiento normal: modal bloqueante ─────────────
  loadingService.show();

  return next(req).pipe(
    finalize(() => {
      loadingService.hide();
    })
  );
};
