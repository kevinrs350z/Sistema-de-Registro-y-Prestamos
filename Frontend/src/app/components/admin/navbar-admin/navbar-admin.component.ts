import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-navbar-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar-admin.component.html',
  styleUrls: ['./navbar-admin.component.css']
})
export class NavbarAdminComponent {

  menuAbierto = false;

  public auth = inject(AuthService);
  private notify = inject(NotificationService);

  constructor(private router: Router) {}

  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }

  /** Navegar a sección - usa evento si está en dashboard, si no navega por ruta */
  navegarInterno(seccion: string) {
    this.menuAbierto = false;

    // Si estamos en el dashboard, usar eventos
    if (this.router.url === '/admin/dashboard' || this.router.url.startsWith('/admin/dashboard')) {
      window.dispatchEvent(
        new CustomEvent('admin-navegacion', { detail: seccion })
      );
    } else {
      // Si no estamos en dashboard, navegar a la ruta correspondiente
      this.router.navigate(['/admin/dashboard']).then(() => {
        // Pequeño delay para que el dashboard cargue y escuche el evento
        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent('admin-navegacion', { detail: seccion })
          );
        }, 100);
      });
    }
      // Navegación directa para gestionar-grupos
      if (seccion === 'gestionar-grupos') {
        this.router.navigate(['/admin/gestionar-grupos']);
        return;
      }
  }

  /** 📊 IR A REPORTES (ruta real) */
  irReportes() {
    this.menuAbierto = false;
    this.router.navigate(['/admin/reportes']);
  }

  cerrarSesion() {
    this.auth.logout();
    sessionStorage.clear();
    this.notify.info('Sesión cerrada.');
    this.router.navigate(['/auth/login']);
  }
}
