import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SolicitudEquipo } from '../../../shared/models'; // ✅ Usa tu archivo models.ts
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notificaciones.component.html',
  styleUrls: ['./notificaciones.component.css'] 
})
export class NotificacionesComponent implements OnInit {
  
  solicitudes: SolicitudEquipo[] = [
    {
      id: 1,
      estudiante: 'María González',
      email: 'maria.gonzalez@estudiante.com',
      equipos: ['Cámara Sony A6400', 'Trípode Manfrotto'],
      fechaInicio: '2024-01-15',
      fechaFin: '2024-01-20',
      fechaSolicitud: '2024-01-10',
      estado: 'PENDIENTE'
    },
    {
      id: 2,
      estudiante: 'Carlos Rodríguez',
      email: 'carlos.rodriguez@estudiante.com',
      equipos: ['Laptop MacBook Pro', 'Micrófono Rode'],
      fechaInicio: '2024-01-18',
      fechaFin: '2024-01-25',
      fechaSolicitud: '2024-01-12',
      estado: 'PENDIENTE'
    },
    {
      id: 3,
      estudiante: 'Ana Martínez',
      email: 'ana.martinez@estudiante.com',
      equipos: ['Tablet iPad Pro'],
      fechaInicio: '2024-01-20',
      fechaFin: '2024-01-22',
      fechaSolicitud: '2024-01-14',
      estado: 'PENDIENTE'
    }
  ];

  solicitudesPendientes: SolicitudEquipo[] = [];
  solicitudesProcesadas: SolicitudEquipo[] = [];
  mostrarModalRechazo = false;
  mostrarModalDetalle = false;
  solicitudSeleccionada: SolicitudEquipo | null = null;
  solicitudDetalle: SolicitudEquipo | null = null;
  motivoRechazo = '';

  private notify = inject(NotificationService);

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.actualizarListas();
  }

  actualizarListas(): void {
    this.solicitudesPendientes = this.solicitudes.filter(s => s.estado === 'PENDIENTE');
    this.solicitudesProcesadas = this.solicitudes.filter(s => s.estado !== 'PENDIENTE');
  }

  aprobarSolicitud(solicitud: SolicitudEquipo): void {
    if (confirm(`¿Estás seguro de aprobar la solicitud de ${solicitud.estudiante}?`)) {
      solicitud.estado = 'APROBADA';
      this.actualizarListas();
      this.notify.success('Solicitud aprobada exitosamente.');
    }
  }

  rechazarSolicitud(solicitud: SolicitudEquipo): void {
    this.solicitudSeleccionada = solicitud;
    this.motivoRechazo = '';
    this.mostrarModalRechazo = true;
  }

  confirmarRechazo(): void {
    if (!this.motivoRechazo.trim()) {
      this.notify.warning('Por favor, ingresa el motivo del rechazo.');
      return;
    }

    if (this.solicitudSeleccionada) {
      this.solicitudSeleccionada.estado = 'RECHAZADA';
      this.solicitudSeleccionada.motivoRechazo = this.motivoRechazo;
      this.actualizarListas();
      this.cerrarModal();
      this.notify.info('Solicitud rechazada exitosamente.');
    }
  }

  cerrarModal(): void {
    this.mostrarModalRechazo = false;
    this.solicitudSeleccionada = null;
    this.motivoRechazo = '';
  }

  abrirDetalleSolicitud(solicitud: SolicitudEquipo): void {
    this.solicitudDetalle = solicitud;
    this.mostrarModalDetalle = true;
  }

  cerrarModalDetalle(): void {
    this.mostrarModalDetalle = false;
    this.solicitudDetalle = null;
  }

  irAlDashboard(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  obtenerEstadoClass(estado: string): string {
    switch (estado) {
      case 'PENDIENTE': return 'estado-pendiente';
      case 'APROBADA': return 'estado-aprobada';
      case 'RECHAZADA': return 'estado-rechazada';
      default: return '';
    }
  }

  obtenerEstadoTexto(estado: string): string {
    switch (estado) {
      case 'PENDIENTE': return 'Pendiente';
      case 'APROBADA': return 'Aprobada';
      case 'RECHAZADA': return 'Rechazada';
      default: return estado;
    }
  }
}
