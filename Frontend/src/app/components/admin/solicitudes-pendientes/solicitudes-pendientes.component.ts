import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SolicitudEquipo } from '../../../shared/models';
import { AuthService } from '../../../services/auth.service';

type AdminSolicitud = SolicitudEquipo & {
  tipo?: 'DENTRO' | 'FUERA';
  bloque?: string;
  periodo?: string;
  observacion?: string;
  equiposDetallados?: { nombre: string; codigoActivo: string }[];
  motivoAprobacion?: string;
  estudiante?: string;
  email?: string;
};

@Component({
  selector: 'app-solicitudes-pendientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './solicitudes-pendientes.component.html',
  styleUrls: ['./solicitudes-pendientes.component.css']
})
export class SolicitudesPendientesComponent implements OnInit {
  solicitudes: AdminSolicitud[] = [];
  solicitudSeleccionada: AdminSolicitud | null = null;

  motivoRechazo = '';
  motivoAprobacion = '';
  mostrarModal = false;
  mostrarModalAprobacion = false;
  filtroBusqueda = '';
  orden = 'recientes';

  constructor(private api: AuthService) {}

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  cargarSolicitudes() {
    this.api.getPrestamos().subscribe({
      next: (data: any[]) => {
        this.solicitudes = data.map((p: any) => {
          const esExterno = p.tipo === 'FUERA';
          const periodo = esExterno
            ? `${p.fecha_inicio ?? '—'} - ${p.fecha_fin ?? '—'}`
            : '—';

          return {
            id: p.idPrestamo,
            estudiante: p.user?.nombre ?? 'Desconocido',
            email: p.user?.email ?? '',
            tipo: p.tipo,
            bloque: p.bloquePrestamo ?? '—',
            equipos: [p.equipo?.nombre ?? '—'],
            equiposDetallados: [
              {
                nombre: p.equipo?.nombre ?? '—',
                codigoActivo: p.equipo?.codigo_activo ?? '—'
              }
            ],
            observacion: p.observacion ?? p.Observacion ?? 'Sin observación',
            fechaSolicitud: p.created_at ?? '',
            fechaInicio: p.fecha_inicio ?? '',
            fechaFin: p.fecha_fin ?? '',
            periodo,
            estado: p.estado?.toUpperCase() ?? 'PENDIENTE'
          };
        });
      },
      error: (err: any) => console.error('Error al cargar préstamos:', err),
    });
  }

  get solicitudesFiltradas(): AdminSolicitud[] {
    let resultado = this.solicitudes.filter(
      s =>
        s.estado === 'PENDIENTE' &&
        (
          s.estudiante?.toLowerCase().includes(this.filtroBusqueda.toLowerCase()) ||
          s.equipos.join(', ').toLowerCase().includes(this.filtroBusqueda.toLowerCase()) ||
          (s.observacion?.toLowerCase().includes(this.filtroBusqueda.toLowerCase()))
        )
    );

    if (this.orden === 'antiguas') {
      resultado.sort((a, b) => new Date(a.fechaSolicitud).getTime() - new Date(b.fechaSolicitud).getTime());
    } else {
      resultado.sort((a, b) => new Date(b.fechaSolicitud).getTime() - new Date(a.fechaSolicitud).getTime());
    }

    return resultado;
  }

  seleccionarSolicitud(s: AdminSolicitud) {
    this.solicitudSeleccionada = s;
  }

  abrirAprobacion() {
    this.mostrarModalAprobacion = true;
  }

  confirmarAprobacion() {
    if (!this.solicitudSeleccionada) return;
    if (this.motivoAprobacion.trim() === '') {
      alert('Debes ingresar un motivo de aprobación.');
      return;
    }

    this.api.cambiarEstado(this.solicitudSeleccionada.id!, 'aceptar', this.motivoAprobacion).subscribe({
      next: () => {
        alert(' Solicitud aprobada correctamente.');
        this.cargarSolicitudes();
        this.cerrarModal();
      },
      error: (err: any) => console.error('Error al aprobar:', err),
    });
  }

  abrirRechazo() {
    this.mostrarModal = true;
  }

  confirmarRechazo() {
    if (!this.solicitudSeleccionada) return;
    if (this.motivoRechazo.trim() === '') {
      alert('Debes ingresar un motivo.');
      return;
    }

    this.api.cambiarEstado(this.solicitudSeleccionada.id!, 'rechazar', this.motivoRechazo).subscribe({
      next: () => {
        alert(' Solicitud rechazada correctamente.');
        this.cargarSolicitudes();
        this.cerrarModal();
      },
      error: (err: any) => console.error('Error al rechazar:', err),
    });
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.mostrarModalAprobacion = false;
    this.motivoAprobacion = '';
    this.motivoRechazo = '';
    this.solicitudSeleccionada = null;
  }

  formatearFecha(f: string): string {
    if (!f) return '—';
    return new Date(f).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
