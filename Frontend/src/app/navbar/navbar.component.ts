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
    // Evitamos confirm() (modal del navegador). Cerramos sesión y avisamos con toast.
    this.auth.logout();
    sessionStorage.clear();
    this.notify.info('Sesión cerrada.');
    this.router.navigate(['/auth/login']);
  }

}
