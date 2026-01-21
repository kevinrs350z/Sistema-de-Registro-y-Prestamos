import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrestamosAdminService } from '../../../services/prestamos-admin.service';
import { NavbarAdminComponent } from "../navbar-admin/navbar-admin.component";
import { NotificationService } from '../../../services/notification.service';

type AdminSolicitud = {
  id: number;
  estudiante: string;
  email: string;
  tipo: 'DENTRO' | 'FUERA';
  bloque: string;
  periodo: string;
  observacion: string;

  equiposDetallados: {
    id: number;
    nombre: string;
    codigoActivo: string;
    devuelto: boolean;
  }[];

  fechaSolicitud: string;
  estado: 'APROBADO' | 'DEVUELTO' | 'RECHAZADO';
};

@Component({
  selector: 'app-solicitudes-finalizadas',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarAdminComponent],
  templateUrl: './solicitudes-finalizadas.component.html',
  styleUrls: ['./solicitudes-finalizadas.component.css']
})
export class SolicitudesFinalizadasComponent implements OnInit {

  private notify = inject(NotificationService);

  solicitudes: AdminSolicitud[] = [];
  solicitudSeleccionada: AdminSolicitud | null = null;

  filtroBusqueda = '';
  filtroEstado: 'todos' | 'APROBADO' | 'DEVUELTO' | 'RECHAZADO' = 'todos';
  orden: 'recientes' | 'antiguas' = 'recientes';

  mostrarModal = false;
  motivoFinalizar = '';

  constructor(private api: PrestamosAdminService) {}

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  cargarSolicitudes(): void {
    this.api.getHistorial().subscribe({
      next: (data: any[]) => {
        this.solicitudes = data.map((p): AdminSolicitud => {

          const equiposDetallados = Array.isArray(p.equipos)
            ? p.equipos.map((eq: any) => ({
                id: eq.id,
                nombre: eq.nombre ?? eq.tipo?.nombre ?? 'Equipo',
                codigoActivo: eq.codigo_activo ?? eq.codigo ?? '—',
                devuelto: Boolean(eq.devuelto)

              }))
            : [];

          return {
            id: p.idPrestamo,
            estudiante: p.user?.nombre ?? 'Desconocido',
            email: p.user?.email ?? '',
            tipo: p.tipo,
            bloque: p.bloquePrestamo ?? '—',
            periodo: `${p.fecha_inicio ?? '—'} - ${p.fecha_fin ?? '—'}`,
            equiposDetallados,
            observacion: p.observacion ?? 'Sin observación',
            fechaSolicitud: p.created_at ?? '',
            estado: p.estado as AdminSolicitud['estado']
          };
        });
      },
      error: (err) => console.error('Error al cargar historial:', err)
    });
  }

  get solicitudesFiltradas(): AdminSolicitud[] {
    const term = this.filtroBusqueda.toLowerCase().trim();

    let resultado = this.solicitudes.filter((s) => {

      const texto = `${s.estudiante} ${s.observacion} ${s.equiposDetallados
        .map(e => e.nombre)
        .join(', ')
      }`.toLowerCase();

      const coincideBusqueda = texto.includes(term);

      const coincideEstado =
        this.filtroEstado === 'todos' || s.estado === this.filtroEstado;

      return coincideBusqueda && coincideEstado;
    });

    resultado.sort((a, b) => {
      const fa = new Date(a.fechaSolicitud).getTime();
      const fb = new Date(b.fechaSolicitud).getTime();
      return this.orden === 'antiguas' ? fa - fb : fb - fa;
    });

    return resultado;
  }

  seleccionarSolicitud(s: AdminSolicitud): void {
    this.solicitudSeleccionada = s;
  }

  abrirFinalizar(): void {
    this.mostrarModal = true;
  }

  confirmarFinalizar(): void {
    if (!this.solicitudSeleccionada) return;

    if (this.motivoFinalizar.trim() === '') {
      this.notify.warning('Debes ingresar un motivo para finalizar el préstamo.');
      return;
    }

    this.api.marcarDevuelto(
      this.solicitudSeleccionada.id,
      this.motivoFinalizar
    ).subscribe({
      next: () => {
        this.notify.success('Préstamo marcado como devuelto correctamente.');
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

  devolverEquipo(idPrestamo: number, idEquipo: number): void {

    const motivo = prompt('Motivo de devolución del equipo:');

    if (!motivo || motivo.trim() === '') {
      this.notify.warning('Debes ingresar un motivo para la devolución.');
      return;
    }

    this.api.devolverEquipo(idPrestamo, idEquipo, motivo).subscribe({
      next: () => {

        // ✅ ACTUALIZAR EL EQUIPO EN FRONT
        const solicitud = this.solicitudes.find(s => s.id === idPrestamo);

        if (solicitud) {
          const equipo = solicitud.equiposDetallados.find(e => e.id === idEquipo);
          if (equipo) {
            equipo.devuelto = true;
          }

          // 🔥 si todos están devueltos → préstamo DEVUELTO
          const quedanPendientes = solicitud.equiposDetallados
            .some(e => !e.devuelto);

          if (!quedanPendientes) {
            solicitud.estado = 'DEVUELTO';
          }
        }

        this.notify.success('Equipo devuelto correctamente.');
      },
      error: (err) => {
        console.error('Error al devolver equipo:', err);
        this.notify.error('Ocurrió un error al devolver el equipo.');
      } 
    });
  }

}
