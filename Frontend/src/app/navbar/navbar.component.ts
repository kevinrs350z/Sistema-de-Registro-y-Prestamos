import { Component, inject } from '@angular/core';
import { Router, NavigationEnd, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

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

  private auth = inject(AuthService);
  private notify = inject(NotificationService);

  constructor(private router: Router) {
    // Detectar rol inicial
    this.esAdmin = this.auth.isAdmin() || this.auth.isSuperUsuario();

    // Escuchar cambios en la URL
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.esAdmin = this.auth.isAdmin() || this.auth.isSuperUsuario();
        this.menuAbierto = false;
      });
  }

  toggleMenu() {
    if (this.esAdmin) {
      return;
    }
    this.menuAbierto = !this.menuAbierto;
  }

  irCatalogo() {
    this.menuAbierto = false;
    this.router.navigate(['/equipos/catalogo']);
  }

  irHome() {
    this.menuAbierto = false;
    const destino = this.esAdmin ? '/admin/dashboard' : '/equipos/catalogo';
    this.router.navigate([destino]);
  }

  getUserId(): string {
    try {
      const raw = sessionStorage.getItem('user');
      if (raw) {
        const user = JSON.parse(raw);
        return user?.rut || user?.codigo || user?.email?.split('@')[0] || 'Usuario';
      }
    } catch {
      // ignore
    }
    return 'Usuario';
  }

  cerrarSesion() {
    this.menuAbierto = false;
    this.auth.logout();
    sessionStorage.clear();
    this.notify.info('Sesión cerrada.');
    this.router.navigate(['/auth/login']);
  }

}
