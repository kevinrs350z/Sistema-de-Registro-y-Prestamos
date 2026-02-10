import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SolicitudEquipo } from '../../../shared/models';
import { PrestamosAdminService } from '../../../services/prestamos-admin.service';
import { NotificationService } from '../../../services/notification.service';
import { ImagenService } from '../../../services/image.service';
import { MotivosRechazoService } from '../../../services/motivos-rechazo.service';

type AdminSolicitud = Omit<SolicitudEquipo, 'estado'> & {
  tipo?: 'DENTRO' | 'FUERA';
  bloque?: string;
  periodo?: string;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  observacion?: string;
  equipos?: { codigo: string; nombre: string; imagen?: string }[];
  integrantes?: { idUser: number; nombre: string; email: string }[];
  motivoAprobacion?: string;
  estudiante?: string;
  email?: string;
  estado: 'PENDIENTE' | 'APROBADO' | 'ENTREGADO' | 'RECHAZADO';
};

@Component({
  selector: 'app-solicitudes-pendientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './solicitudes-pendientes.component.html',
  styleUrls: ['./solicitudes-pendientes.component.css']
})
export class SolicitudesPendientesComponent implements OnInit {

  private notify = inject(NotificationService);
  private imagenSrv = inject(ImagenService);

  solicitudes: AdminSolicitud[] = [];
  solicitudSeleccionada: AdminSolicitud | null = null;

  motivoRechazo = '';
  motivoObservacion = '';
  mostrarModal = false;
  motivos: any[] = [];
  loadingRechazo = false;
  errorRechazo = '';
  filtroBusqueda = '';
  orden: 'recientes' | 'antiguas' = 'recientes';
  paginaPendientes = 1;
  paginaPendientesEntrega = 1;
  tamanioPagina = 6;

  constructor(
    private prestamosAdmin: PrestamosAdminService,
    private motivosSrv: MotivosRechazoService
  ) {}

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  cargarSolicitudes() {
    this.prestamosAdmin.getPendientes().subscribe({
      next: (data) => {
        this.solicitudes = data.map((p: any) => {
          const esExterno = p.tipo === 'FUERA';

          const equipos = Array.isArray(p.equipos)
            ? p.equipos.map((eq: any) => {
                if (typeof eq === 'string') {
                  return { codigo: '—', nombre: eq, imagen: null };
                }
                return {
                  codigo: eq.codigo_activo ?? eq.codigo ?? '—',
                  nombre: eq.nombre ?? eq.tipo?.nombre ?? 'Equipo',
                  imagen: this.imagenSrv.getStorageImage(eq.imagen) ?? null
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
            integrantes: Array.isArray(p.integrantes) ? p.integrantes : [],
            observacion: p.observacion ?? 'Sin observación',
            fechaSolicitud: p.created_at,
            fechaInicio: p.fecha_inicio ?? null,
            fechaFin: p.fecha_fin ?? null,
            periodo: esExterno ? `${p.fecha_inicio ?? '—'} - ${p.fecha_fin ?? '—'}` : '—',
            estado: p.estado

          };
        });
        this.paginaPendientes = 1;
        this.paginaPendientesEntrega = 1;
        this.solicitudSeleccionada = null;
      },
      error: (err) => console.error('Error al cargar préstamos pendientes:', err)
    });
  }

  get solicitudesFiltradas(): AdminSolicitud[] {
    const texto = this.filtroBusqueda.toLowerCase().trim();

    let resultado = this.solicitudes.filter((s) => {
      // Mostrar PENDIENTE y APROBADO en solicitudes pendientes
      if (s.estado !== 'PENDIENTE' && s.estado !== 'APROBADO') return false;

      const coincideEst = (s.estudiante ?? '').toLowerCase().includes(texto);

      const coincideEq =
        Array.isArray(s.equipos) &&
        s.equipos.some((eq: any) => {
          if (typeof eq === 'string') return eq.toLowerCase().includes(texto);
          return (
            (eq.nombre ?? '').toLowerCase().includes(texto) ||
            (eq.codigo ?? '').toLowerCase().includes(texto)
          );
        });

      const coincideObs = (s.observacion ?? '').toLowerCase().includes(texto);

      return coincideEst || coincideEq || coincideObs;
    });

    resultado.sort((a, b) => {
      const A = new Date(a.fechaSolicitud!).getTime();
      const B = new Date(b.fechaSolicitud!).getTime();
      return this.orden === 'antiguas' ? A - B : B - A;
    });

    return resultado;
  }

  get pendientes(): AdminSolicitud[] {
    return this.solicitudesFiltradas.filter((s) => s.estado === 'PENDIENTE');
  }

  get pendientesEntrega(): AdminSolicitud[] {
    return this.solicitudesFiltradas.filter((s) => s.estado === 'APROBADO');
  }

  get totalPaginasPendientes(): number {
    return Math.max(1, Math.ceil(this.pendientes.length / this.tamanioPagina));
  }

  get totalPaginasPendientesEntrega(): number {
    return Math.max(1, Math.ceil(this.pendientesEntrega.length / this.tamanioPagina));
  }

  get paginaPendientesLista(): AdminSolicitud[] {
    const inicio = (this.paginaPendientes - 1) * this.tamanioPagina;
    return this.pendientes.slice(inicio, inicio + this.tamanioPagina);
  }

  get paginaPendientesEntregaLista(): AdminSolicitud[] {
    const inicio = (this.paginaPendientesEntrega - 1) * this.tamanioPagina;
    return this.pendientesEntrega.slice(inicio, inicio + this.tamanioPagina);
  }

  seleccionarSolicitud(s: AdminSolicitud) {
    this.solicitudSeleccionada = s;
  }

  irPaginaPendientes(pagina: number) {
    if (pagina < 1 || pagina > this.totalPaginasPendientes) return;
    this.paginaPendientes = pagina;
    this.solicitudSeleccionada = null;
  }

  irPaginaPendientesEntrega(pagina: number) {
    if (pagina < 1 || pagina > this.totalPaginasPendientesEntrega) return;
    this.paginaPendientesEntrega = pagina;
    this.solicitudSeleccionada = null;
  }

  resetPaginacion() {
    this.paginaPendientes = 1;
    this.paginaPendientesEntrega = 1;
    this.solicitudSeleccionada = null;
  }

  cerrarDetalle() {
    this.solicitudSeleccionada = null;
  }

  abrirRechazo() {
    this.mostrarModal = true;
    this.loadingRechazo = true;
    this.errorRechazo = '';
    this.motivosSrv.getMotivos().subscribe({
      next: (data) => {
        this.motivos = data;
        this.loadingRechazo = false;
      },
      error: (err) => {
        this.errorRechazo = 'Error al cargar motivos.';
        this.loadingRechazo = false;
      }
    });
  }

  aprobarSolicitud(id?: number) {
    const solicitudId = id ?? this.solicitudSeleccionada?.id;
    if (!solicitudId) {
      return;
    }

    this.prestamosAdmin
      .aprobarPrestamo(solicitudId, '', 'aprobar')
      .subscribe({
        next: () => {
          this.notify.success('Solicitud aprobada correctamente.');
          this.cargarSolicitudes();
        },
        error: (err) => console.error('Error al aprobar:', err)
      });
  }

  confirmarRechazo() {
    if (!this.solicitudSeleccionada) return;
    if (!this.motivoRechazo) {
      this.notify.warning('Debes seleccionar un motivo para el rechazo.');
      return;
    }
    this.loadingRechazo = true;
    this.errorRechazo = '';
    const motivoFinal = this.motivoRechazo + (this.motivoObservacion ? ' - ' + this.motivoObservacion : '');
    this.prestamosAdmin
      .rechazarPrestamo(
        this.solicitudSeleccionada.id!,
        motivoFinal,
        'rechazar'
      )
      .subscribe({
        next: () => {
          this.notify.success('Solicitud rechazada correctamente.');
          this.cargarSolicitudes();
          this.cerrarModal();
          this.loadingRechazo = false;
        },
        error: (err) => {
          this.errorRechazo = 'Error al rechazar solicitud.';
          this.loadingRechazo = false;
        }
      });
  }


  cerrarModal() {
    this.mostrarModal = false;
    this.motivoRechazo = '';
    this.motivoObservacion = '';
    this.solicitudSeleccionada = null;
    this.loadingRechazo = false;
    this.errorRechazo = '';
  }

  formatearFecha(f: string): string {
    if (!f) return '—';
    const d = new Date(f);
    if (isNaN(d.getTime())) return '—';
    const dia = d.getDate().toString().padStart(2, '0');
    const mes = (d.getMonth() + 1).toString().padStart(2, '0');
    const anio = d.getFullYear();
    return `${dia}/${mes}/${anio}`;
  }

  formatearPeriodo(fechaInicio: string | null, fechaFin: string | null): string {
    const inicio = this.formatearFecha(fechaInicio || '');
    const fin = this.formatearFecha(fechaFin || '');
    if (inicio === '—' && fin === '—') return '—';
    if (inicio === fin) return inicio;
    return `${inicio} - ${fin}`;
  }

  marcarEntregado(id?: number) {
    if (!this.solicitudSeleccionada) return;
    
    // Llamada real a la API
    this.prestamosAdmin.marcarEntregado(id || this.solicitudSeleccionada.id!).subscribe({
      next: () => {
        this.notify.success('Préstamo marcado como ENTREGADO correctamente.');
        this.cargarSolicitudes();
      },
      error: (err: any) => console.error('Error al marcar como entregado:', err),
    });
  }

  getEstadoTexto(estado?: string): string {
    switch (estado) {
      case 'PENDIENTE':
        return 'PENDIENTE';
      case 'APROBADO':
        return 'PENDIENTE A ENTREGA';
      case 'ENTREGADO':
        return 'ENTREGADO';
      case 'RECHAZADO':
        return 'RECHAZADO';
      default:
        return 'PENDIENTE';
    }
  }
}

