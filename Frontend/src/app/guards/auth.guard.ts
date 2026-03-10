import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

/**
 * ISO 27001 — A.9.4.1 / A.9.4.2
 * Restringe el acceso a rutas protegidas.
 * Si no hay token en sessionStorage, redirige al login.
 */
export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = sessionStorage.getItem('token');

  if (token) {
    return true;
  }

  router.navigate(['/auth/login'], { replaceUrl: true });
  return false;
};
