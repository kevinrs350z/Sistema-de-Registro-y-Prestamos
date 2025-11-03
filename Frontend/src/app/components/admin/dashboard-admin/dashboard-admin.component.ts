import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// 👇 Componentes standalone
import { NavbarAdminComponent } from '../navbar-admin/navbar-admin.component';
import { SolicitudesPendientesComponent } from '../solicitudes-pendientes/solicitudes-pendientes.component';

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    NavbarAdminComponent,
    SolicitudesPendientesComponent
  ],
  templateUrl: './dashboard-admin.component.html',
  styleUrls: ['./dashboard-admin.component.css']
})
export class DashboardAdminComponent implements OnInit {
  // 🔹 Controla qué sección se muestra
  seccionActiva: string = 'gestionar';

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.seccionActiva = 'gestionar';

    // 🔹 Escuchar eventos del navbar admin (hamburguesa)
    window.addEventListener('admin-navegacion', (e: any) => {
      if (e.detail === 'gestionar') this.seccionActiva = 'gestionar';
      if (e.detail === 'solicitudes') this.seccionActiva = 'solicitudes';
    });
  }

  // 🔹 Método general de logout
  cerrarSesion(): void {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      this.router.navigate(['/auth/login']);
    }
  }
}
