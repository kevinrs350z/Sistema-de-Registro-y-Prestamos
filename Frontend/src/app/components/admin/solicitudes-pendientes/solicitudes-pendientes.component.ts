import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SolicitudEquipo } from '../../../shared/models';
import { PrestamosAdminService } from '../../../services/prestamos-admin.service';

type AdminSolicitud = SolicitudEquipo & {
  tipo?: 'DENTRO' | 'FUERA';
  bloque?: string;
  periodo?: string;
  observacion?: string;
  equipos?: { codigo: string; nombre: string; imagen?: string }[];
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
  orden: 'recientes' | 'antiguas' = 'recientes';

  constructor(private prestamosAdmin: PrestamosAdminService) {}

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  // =========================================================
  // 🔹 CARGAR SOLICITUDES PENDIENTES
  // =========================================================
  cargarSolicitudes() {
    this.prestamosAdmin.getPendientes().subscribe({
      next: (data) => {
        this.solicitudes = data.map((p: any) => {
          const esExterno = p.tipo === 'FUERA';
          const periodo = esExterno
            ? `${p.fecha_inicio ?? '—'} - ${p.fecha_fin ?? '—'}`
            : '—';

          // --- EQUIPOS NORMALIZADOS ---
          const equipos =
            Array.isArray(p.equipos)
              ? p.equipos.map((eq: any) => {
                  // Si viene STRING → lo convertimos
                  if (typeof eq === 'string') {
                    return {
                      codigo: '—',
                      nombre: eq,
                      imagen: 'assets/equipos/default.jpg'
                    };
                  }
                  // Si viene OBJETO → normalizamos
                  return {
                    codigo: eq.codigo_activo ?? eq.codigo ?? '—',
                    nombre: eq.nombre ?? eq.tipo?.nombre ?? 'Equipo',
                    imagen: eq.imagen
                      ? `http://localhost:8000/storage/${eq.imagen}`
                      : 'assets/equipos/default.jpg'
                  };
                })
              : [];

          return {
            id: p.idPrestamo,
            estudiante: p.user?.nombre ?? 'Desconocido',
            email: p.user?.email ?? '',
            tipo: p.tipo,
            bloque: p.bloquePrestamo ?? '—',
            equipos,
            observacion: p.observacion ?? 'Sin observación',
            fechaSolicitud: p.created_at,
            fechaInicio: p.fecha_inicio,
            fechaFin: p.fecha_fin,
            periodo,
            estado: p.estado?.toUpperCase()
          };
        });
      },
      error: (err) => console.error('Error al cargar préstamos pendientes:', err)
    });
  }

  // =========================================================
  // 🔹 FILTRO + ORDENAMIENTO
  // =========================================================
  get solicitudesFiltradas(): AdminSolicitud[] {
    const texto = this.filtroBusqueda.toLowerCase().trim();

    let resultado = this.solicitudes.filter((s) => {
      if (s.estado !== 'PENDIENTE') return false;

      const coincideEstudiante =
        (s.estudiante ?? '').toLowerCase().includes(texto);

      const coincideEquipos =
        Array.isArray(s.equipos) &&
        s.equipos.some((eq: any) => {
          // Si eq es STRING
          if (typeof eq === 'string') {
            return eq.toLowerCase().includes(texto);
          }
          // Si eq es OBJETO
          return (
            (eq.nombre ?? '').toLowerCase().includes(texto) ||
            (eq.codigo ?? '').toLowerCase().includes(texto)
          );
        });

      const coincideObservacion =
        (s.observacion ?? '').toLowerCase().includes(texto);

      return coincideEstudiante || coincideEquipos || coincideObservacion;
    });

    resultado.sort((a, b) => {
      const fechaA = new Date(a.fechaSolicitud!).getTime();
      const fechaB = new Date(b.fechaSolicitud!).getTime();

      return this.orden === 'antiguas' ? fechaA - fechaB : fechaB - fechaA;
    });

    return resultado;
  }

  // =========================================================
  // 🔹 SELECCIONAR SOLICITUD
  // =========================================================
  seleccionarSolicitud(s: AdminSolicitud) {
    this.solicitudSeleccionada = s;
  }

  // =========================================================
  // 🔹 APROBAR
  // =========================================================
  abrirAprobacion() {
    this.mostrarModalAprobacion = true;
  }

  confirmarAprobacion() {
    if (!this.solicitudSeleccionada) return;
    if (this.motivoAprobacion.trim() === '') {
      alert('Debes ingresar un motivo de aprobación.');
      return;
    }

    this.prestamosAdmin
      .aprobarPrestamo(this.solicitudSeleccionada.id!, this.motivoAprobacion)
      .subscribe({
        next: () => {
          alert('Solicitud aprobada correctamente.');
          this.cargarSolicitudes();
          this.cerrarModal();
        },
        error: (err) => console.error('Error al aprobar:', err)
      });
  }

  // =========================================================
  // 🔹 RECHAZAR
  // =========================================================
  abrirRechazo() {
    this.mostrarModal = true;
  }

  confirmarRechazo() {
    if (!this.solicitudSeleccionada) return;
    if (this.motivoRechazo.trim() === '') {
      alert('Debes ingresar un motivo.');
      return;
    }

    this.prestamosAdmin
      .rechazarPrestamo(this.solicitudSeleccionada.id!, this.motivoRechazo)
      .subscribe({
        next: () => {
          alert('Solicitud rechazada correctamente.');
          this.cargarSolicitudes();
          this.cerrarModal();
        },
        error: (err) => console.error('Error al rechazar:', err)
      });
  }

  // =========================================================
  // 🔹 CERRAR MODALES
  // =========================================================
  cerrarModal() {
    this.mostrarModal = false;
    this.mostrarModalAprobacion = false;
    this.motivoAprobacion = '';
    this.motivoRechazo = '';
    this.solicitudSeleccionada = null;
  }

  // =========================================================
  // 🔹 FORMATEAR FECHA
  // =========================================================
  formatearFecha(f: string): string {
    if (!f) return '—';
    return new Date(f).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
