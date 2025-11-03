import { Component } from '@angular/core';
import { Router, NavigationEnd, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  esAdmin = false;
  menuAbierto = false;

  constructor(private router: Router) {
    // Detectar ruta inicial
    this.esAdmin = this.router.url.startsWith('/admin');

    // Escuchar cambios en la URL
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.esAdmin = event.urlAfterRedirects.startsWith('/admin');
        this.menuAbierto = false;
      });
  }

  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }

  cerrarSesion() {
    if (confirm('¿Deseas cerrar sesión?')) {
      // Limpieza de datos locales
      localStorage.clear();
      sessionStorage.clear();

      // Redirigir al login correcto del módulo auth
      this.router.navigate(['/auth/login']);
    }
  }

}
