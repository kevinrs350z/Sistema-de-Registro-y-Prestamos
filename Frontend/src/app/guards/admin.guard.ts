import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

/**
 * ISO 27001 — A.9.4.1
 * Restringe rutas de administración exclusivamente a usuarios con rol ADMIN.
 * Verifica token + rol almacenado en sessionStorage.
 */
export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = sessionStorage.getItem('token');

  if (!token) {
    router.navigate(['/auth/login'], { replaceUrl: true });
    return false;
  }

  const rol = getRol();
  if (rol.toUpperCase() === 'ADMIN') {
    return true;
  }

  // Usuario autenticado pero sin privilegios de admin → catálogo
  router.navigate(['/equipos/catalogo'], { replaceUrl: true });
  return false;
};

function getRol(): string {
  const rol = sessionStorage.getItem('rol');
  if (rol) return rol;

  const user = sessionStorage.getItem('user');
  if (user) {
    try {
      const obj = JSON.parse(user);
      if (obj.rol?.nombre) return obj.rol.nombre;
    } catch { /* ignore */ }
  }
  return '';
}
