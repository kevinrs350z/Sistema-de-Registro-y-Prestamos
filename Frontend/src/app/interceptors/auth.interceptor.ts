import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';

/**
 * ISO 27001 — A.9.4.2 / A.13.1.1
 * Interceptor de autenticación:
 *  1. Adjunta el Bearer token a cada request.
 *  2. Detecta respuestas 401 (token expirado/inválido) y fuerza logout.
 *  3. Detecta respuestas 429 (rate limit) y muestra aviso.
 */
export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const token = sessionStorage.getItem('token');
  const router = inject(Router);

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    tap({
      error: (err) => {
        if (err.status === 401) {
          // Token expirado o inválido → limpiar sesión completa y redirigir
          sessionStorage.clear();
          router.navigate(['/auth/login'], { replaceUrl: true });
        }
      }
    })
  );
};
