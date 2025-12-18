import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar-admin.component.html',
  styleUrls: ['./navbar-admin.component.css']
})
export class NavbarAdminComponent {

  menuAbierto = false;

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
    if (confirm('¿Deseas cerrar sesión?')) {
      this.router.navigate(['/auth/login']);
    }
  }
}
