import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


import { NavbarAdminComponent } from '../navbar-admin/navbar-admin.component';
import { SolicitudesPendientesComponent } from '../solicitudes-pendientes/solicitudes-pendientes.component';


import { AuthService } from '../../../services/auth.service';

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
  private router = inject(Router);
  private api = inject(AuthService);

  // 🔹 Controla qué sección se muestra
  seccionActiva: string = 'gestionar';

  // 🔹 Datos dinámicos
  totalEquipos: number = 0;

  ngOnInit(): void {
    this.seccionActiva = 'gestionar';
    this.cargarEquipos();

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

  // 🔹 Obtener total de equipos desde el backend
  private cargarEquipos(): void {
    const token = localStorage.getItem('token') ?? '';
    this.api.getEquipos(token).subscribe({
      next: (data) => {
        this.totalEquipos = data.length;
      },
      error: (err) => {
        console.error('Error al cargar equipos:', err);
      }
    });
  }
}
