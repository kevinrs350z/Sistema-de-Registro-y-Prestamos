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

  private auth = inject(AuthService);
  private notify = inject(NotificationService);

  constructor(private router: Router) {}

  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }

  navegarInterno(seccion: string) {
    this.menuAbierto = false;

    window.dispatchEvent(
      new CustomEvent('admin-navegacion', { detail: seccion })
    );
  }

  /** 📊 IR A REPORTES (ruta real) */
  irReportes() {
    this.menuAbierto = false;
    this.router.navigate(['/admin/reportes']);
  }

  cerrarSesion() {
    // Evitamos confirm() (modal del navegador). Cerramos sesión y avisamos con toast.
    this.auth.logout();
    sessionStorage.clear();
    this.notify.info('Sesión cerrada.');
    this.router.navigate(['/auth/login']);
  }
}
