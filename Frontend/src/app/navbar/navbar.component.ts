import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink],
  template: `
  <nav class="navbar">
    <div class="nav-inner">
      <span class="logo">Registro y Préstamo</span>
      <ul>
        <li><a routerLink="/reservas/solicitar">Solicitar reserva</a></li>
        <li><a href="#">Mis reservas</a></li>
        <li><a href="#">Cerrar sesión</a></li>
      </ul>
    </div>
  </nav>
  `,
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {}
