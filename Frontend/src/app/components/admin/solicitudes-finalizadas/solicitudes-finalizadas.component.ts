import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { NavbarAdminComponent } from "../navbar-admin/navbar-admin.component";

type AdminSolicitud = {
  id: number;
  estudiante: string;
  email: string;
  tipo: string;
  periodo: string;
  observacion: string;
  equiposDetallados: { nombre: string; codigoActivo: string }[];
  fechaSolicitud: string;
  estado: 'prestado' | 'devuelto' | 'rechazado';
};

@Component({
  selector: 'app-solicitudes-finalizadas',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarAdminComponent],
  templateUrl: './solicitudes-finalizadas.component.html',
  styleUrls: ['./solicitudes-finalizadas.component.css']
})
export class SolicitudesFinalizadasComponent implements OnInit {

  solicitudes: AdminSolicitud[] = [];
  solicitudSeleccionada: AdminSolicitud | null = null;

  filtroBusqueda = '';
  filtroEstado: 'todos' | 'prestado' | 'devuelto' | 'rechazado' = 'todos';
  orden: 'recientes' | 'antiguas' = 'recientes';

  mostrarModal = false;
  motivoFinalizar = '';

  constructor(private api: AuthService) {}

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  // ============================================
  // CARGAR PRÉSTAMOS
  // ============================================
  cargarSolicitudes(): void {
    this.api.getPrestamos().subscribe({
      next: (data: any[]) => {
        this.solicitudes = data
          .filter(p =>
            p.estado === 'prestado' ||
            p.estado === 'devuelto' ||
            p.estado === 'rechazado'
          )
          .map((p): AdminSolicitud => ({
            id: p.idPrestamo,
            estudiante: p.user?.nombre ?? 'Desconocido',
            email: p.user?.email ?? '',
            tipo: p.tipo ?? '',
            periodo: `${p.fecha_inicio ?? '—'} - ${p.fecha_fin ?? '—'}`,
            equiposDetallados: [{
              nombre: p.equipo?.nombre ?? '—',
              codigoActivo: p.equipo?.codigo_activo ?? '—'
            }],
            observacion: p.observacion ?? 'Sin observación',
            fechaSolicitud: p.created_at ?? '',
            estado: p.estado
          }));
      },
      error: (err) => console.error('Error al cargar préstamos finalizados:', err)
    });
  }

  // ============================================
  // FILTRADO + ORDENAMIENTO
  // ============================================
  get solicitudesFiltradas(): AdminSolicitud[] {
    const term = this.filtroBusqueda.toLowerCase().trim();

    let resultado = this.solicitudes.filter((s) => {
      const texto =
        `${s.estudiante} ${s.observacion} ${s.equiposDetallados.map(e => e.nombre).join(', ')}`.toLowerCase();

      const coincideBusqueda = texto.includes(term);
      const coincideEstado = this.filtroEstado === 'todos' || s.estado === this.filtroEstado;

      return coincideBusqueda && coincideEstado;
    });

    resultado.sort((a, b) => {
      const fa = new Date(a.fechaSolicitud).getTime();
      const fb = new Date(b.fechaSolicitud).getTime();
      return this.orden === 'antiguas' ? fa - fb : fb - fa;
    });

    return resultado;
  }

  // ============================================
  // SELECCIONAR SOLICITUD
  // ============================================
  seleccionarSolicitud(s: AdminSolicitud): void {
    this.solicitudSeleccionada = s;
  }

  // ============================================
  // FINALIZAR → ESTADO devuelto
  // ============================================
  abrirFinalizar(): void {
    this.mostrarModal = true;
  }

  confirmarFinalizar(): void {
    if (!this.solicitudSeleccionada) return;

    if (this.motivoFinalizar.trim() === '') {
      alert('Debes ingresar un motivo.');
      return;
    }

    this.api.cambiarEstado(
      this.solicitudSeleccionada.id,
      'devuelto',
      this.motivoFinalizar
    ).subscribe({
      next: () => {
        alert('Préstamo finalizado correctamente.');
        this.cargarSolicitudes();
        this.cerrarModal();
      },
      error: (err) => console.error('Error al finalizar préstamo:', err),
    });
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.motivoFinalizar = '';
  }
}
