import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

/**
 * ISO 27001 — A.9.4.2
 * Evita que un usuario ya autenticado vuelva al login (back button).
 * Si tiene token, lo redirige a su dashboard correspondiente.
 */
export const noAuthGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = sessionStorage.getItem('token');

  if (!token) {
    return true; // No autenticado → puede ver login
  }

  // Ya autenticado → redirigir según rol
  const rol = (sessionStorage.getItem('rol') ?? '').toUpperCase();
  if (rol === 'ADMIN') {
    router.navigate(['/admin/dashboard'], { replaceUrl: true });
  } else {
    router.navigate(['/equipos/catalogo'], { replaceUrl: true });
  }
  return false;
};
