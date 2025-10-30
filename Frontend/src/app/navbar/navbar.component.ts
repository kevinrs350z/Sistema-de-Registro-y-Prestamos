import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
  <nav class="navbar">
    <div class="nav-inner">
      <span class="logo">Registro y Préstamo. Diseño Multimedia</span>
      <ul>
        <li>
          <a routerLink="/equipos/catalogo" routerLinkActive="active">
            Solicitar equipo
          </a>
        </li>
        <li>
          <a routerLink="/mis-solicitudes" routerLinkActive="active">
            Mis solicitudes
          </a>
        </li>
        <li>
          <a routerLink="/login" routerLinkActive="active">
            Cerrar sesión
          </a>
        </li>
      </ul>
    </div>
  </nav>
  `,
  styleUrls: ['./navbar.component.css'] // 🔹 Corregido: era 'styleUrl' (debe ser plural)
})
export class NavbarComponent {}
