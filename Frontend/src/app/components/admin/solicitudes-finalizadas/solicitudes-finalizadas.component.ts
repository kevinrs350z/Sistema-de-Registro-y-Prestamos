import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrestamosAdminService } from '../../../services/prestamos-admin.service';
import { NavbarAdminComponent } from "../navbar-admin/navbar-admin.component";

type AdminSolicitud = {
  id: number;
  estudiante: string;
  email: string;
  tipo: string;
  periodo: string;
  observacion: string;

  equiposDetallados: {
    id: number;
    nombre: string;
    codigoActivo: string;
  }[];

  fechaSolicitud: string;
  estado: 'aceptado' | 'prestado' | 'devuelto' | 'rechazado';
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
  filtroEstado: 'todos' | 'aceptado' | 'prestado' | 'devuelto' | 'rechazado' = 'todos';
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

        this.solicitudes = data
          .map((p) => {
            const estadoNormalizado = (p.estado ?? '')
              .toString()
              .trim()
              .toLowerCase();

            return { ...p, estadoNormalizado };
          })
          .filter(p =>
            ['aceptado', 'prestado', 'devuelto', 'rechazado'].includes(p.estadoNormalizado)
          )
          .map((p): AdminSolicitud => {

            const equiposDetallados = Array.isArray(p.equipos)
              ? p.equipos.map((eq: any) => ({
                  id: eq.id,  // 👈 IMPORTANTE PARA DEVOLVER EQUIPO
                  nombre: eq.nombre ?? eq.tipo?.nombre ?? 'Equipo',
                  codigoActivo: eq.codigo_activo ?? eq.codigo ?? '—'
                }))
              : [];

            return {
              id: p.idPrestamo,
              estudiante: p.user?.nombre ?? 'Desconocido',
              email: p.user?.email ?? '',
              tipo: p.tipo ?? '',
              periodo: `${p.fecha_inicio ?? '—'} - ${p.fecha_fin ?? '—'}`,
              equiposDetallados,
              observacion: p.observacion ?? 'Sin observación',
              fechaSolicitud: p.created_at ?? '',
              estado: p.estadoNormalizado as AdminSolicitud["estado"]
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
        this.filtroEstado === 'todos' ||
        s.estado === this.filtroEstado.toLowerCase();

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
      alert('Debes ingresar un motivo.');
      return;
    }

    this.api.marcarDevuelto(
      this.solicitudSeleccionada.id,
      this.motivoFinalizar
    ).subscribe({
      next: () => {
        alert('Préstamo marcado como devuelto correctamente.');
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

    const motivo = prompt("Motivo de devolución del equipo:");

    if (!motivo || motivo.trim() === "") {
      alert("Debes ingresar un motivo.");
      return;
    }

    this.api.devolverEquipo(idPrestamo, idEquipo, motivo).subscribe({
      next: () => {
        alert("Equipo devuelto correctamente.");
        this.cargarSolicitudes(); // recargar datos
      },
      error: (err) => {
        console.error("Error al devolver equipo:", err);
        alert("Error al devolver equipo.");
      }
    });
  }
}
