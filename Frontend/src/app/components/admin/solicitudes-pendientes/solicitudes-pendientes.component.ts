import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SolicitudEquipo } from '../../../shared/models';
import { PrestamosAdminService } from '../../../services/prestamos-admin.service';
import { NotificationService } from '../../../services/notification.service';
import { ImagenService } from '../../../services/image.service';
import { TipoEquipoService } from '../../../services/tipoEquipo.service';
import { MotivosRechazoService } from '../../../services/motivos-rechazo.service';
import { SancionesService } from '../../../services/sanciones.service';

type AdminSolicitud = Omit<SolicitudEquipo, 'estado'> & {
  tipo?: 'DENTRO' | 'FUERA';
  bloque?: string;
  periodo?: string;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  observacion?: string;
  equipos?: { id?: number; codigo: string; nombre: string; imagen?: string; tipoEquipoId?: number }[];
  integrantes?: { idUser: number; nombre: string; email: string }[];
  motivoAprobacion?: string;
  estudiante?: string;
  email?: string;
  userId?: number;
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
  private tiposSrv = inject(TipoEquipoService);
  private sancionesSrv = inject(SancionesService);

  solicitudes: AdminSolicitud[] = [];
  solicitudSeleccionada: AdminSolicitud | null = null;

  motivoRechazo = '';
  motivoObservacion = '';
  mostrarModal = false;
  mostrarEditarModal = false;
  motivos: any[] = [];
  loadingRechazo = false;
  errorRechazo = '';
  filtroBusqueda = '';
  orden: 'recientes' | 'antiguas' = 'recientes';
  paginaPendientes = 1;
  paginaPendientesEntrega = 1;
  tamanioPagina = 6;
  tiposEquipo: any[] = [];
  editarEquipos: { idTipoEquipo: number; nombre: string; cantidad: number; stock?: number }[] = [];
  tipoAgregar: number | null = null;
  cantidadAgregar = 1;
  motivoAjuste = '';
  sancionesResumen: { activas: number; total: number; items: any[] } | null = null;
  sancionesCargando = false;
  sancionesAbierto = false;

  constructor(
    private prestamosAdmin: PrestamosAdminService,
    private motivosSrv: MotivosRechazoService,
      // private sancionesSrv = inject(SancionesService), // Removed duplicate declaration
  ) {}

  ngOnInit(): void {
    this.cargarTipos();
    this.cargarSolicitudes();
  }

  private cargarTipos() {
    this.tiposSrv.getTipos().subscribe({
          next: (data: any) => {
        this.tiposEquipo = data || [];
        this.tipoAgregar = this.tiposEquipo[0]?.id ?? null;
      },
      error: () => this.notify.error('No se pudieron cargar los tipos de equipo.')
    });
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
                  id: eq.id,
                  codigo: eq.codigo_activo ?? eq.codigo ?? '—',
                  nombre: eq.nombre ?? eq.tipo?.nombre ?? 'Equipo',
                  imagen: this.imagenSrv.getStorageImage(eq.imagen) ?? null,
                  tipoEquipoId: eq.tipo_equipo_id
                };
              })
            : [];

          return {
            id: p.idPrestamo,
            estudiante: p.user?.nombre ?? 'Desconocido',
            email: p.user?.email ?? '',
            userId: p.user?.idUser ?? undefined,
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
    this.sancionesResumen = null;
    this.sancionesAbierto = false;

    if (s.userId) {
      this.cargarSancionesUsuario(s.userId);
    }
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
    this.sancionesResumen = null;
    this.sancionesAbierto = false;
  }

  private cargarSancionesUsuario(idUser: number) {
    this.sancionesCargando = true;
    this.sancionesSrv.getSancionesUsuario(idUser).subscribe({
      next: (data) => {
        this.sancionesResumen = {
          activas: data?.resumen?.activas ?? 0,
          total: data?.resumen?.total ?? 0,
          items: data?.sanciones ?? []
        };
        this.sancionesCargando = false;
      },
      error: () => {
        this.sancionesCargando = false;
        this.sancionesResumen = { activas: 0, total: 0, items: [] };
      }
    });
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

  abrirEditarEquipos() {
    if (!this.solicitudSeleccionada) return;
    if (this.solicitudSeleccionada.estado !== 'PENDIENTE') {
      this.notify.warning('Solo solicitudes pendientes pueden editarse.');
      return;
    }

    const conteo = new Map<number, number>();
    (this.solicitudSeleccionada.equipos || []).forEach((eq: any) => {
      if (!eq.tipoEquipoId) return;
      const actual = conteo.get(eq.tipoEquipoId) ?? 0;
      conteo.set(eq.tipoEquipoId, actual + 1);
    });

    this.editarEquipos = Array.from(conteo.entries()).map(([idTipoEquipo, cantidad]) => {
      const tipo = this.tiposEquipo.find(t => t.id === idTipoEquipo);
      return {
        idTipoEquipo,
        nombre: tipo?.nombre ?? 'Equipo',
        cantidad,
        stock: tipo?.stock ?? undefined
      };
    });

    this.cantidadAgregar = 1;
    this.motivoAjuste = '';
    this.mostrarEditarModal = true;
  }

  cerrarEditarModal() {
    this.mostrarEditarModal = false;
    this.editarEquipos = [];
    this.motivoAjuste = '';
  }

  agregarTipo() {
    if (!this.tipoAgregar || this.cantidadAgregar < 1) return;
    const tipo = this.tiposEquipo.find(t => t.id === this.tipoAgregar);
    if (!tipo) return;

    const existente = this.editarEquipos.find(e => e.idTipoEquipo === tipo.id);
    if (existente) {
      existente.cantidad += this.cantidadAgregar;
    } else {
      this.editarEquipos.push({
        idTipoEquipo: tipo.id,
        nombre: tipo.nombre,
        cantidad: this.cantidadAgregar,
        stock: tipo?.stock ?? undefined
      });
    }
    this.cantidadAgregar = 1;
  }

  quitarEquipo(index: number) {
    this.editarEquipos.splice(index, 1);
  }

  confirmarEditarEquipos() {
    if (!this.solicitudSeleccionada) return;

    const equipos = this.editarEquipos
      .filter(e => e.cantidad > 0)
      .map(e => ({ idTipoEquipo: e.idTipoEquipo, cantidad: e.cantidad }));

    if (equipos.length === 0) {
      this.notify.warning('Debes mantener al menos un equipo.');
      return;
    }

    const excedidos = this.editarEquipos.filter(e =>
      typeof e.stock === 'number' && e.stock >= 0 && e.cantidad > e.stock
    );
    if (excedidos.length > 0) {
      const nombres = excedidos.map(e => e.nombre).join(', ');
      this.notify.error(`Stock insuficiente para: ${nombres}.`);
      return;
    }

    this.prestamosAdmin.actualizarEquiposPrestamo(this.solicitudSeleccionada.id!, {
      equipos,
      motivo: this.motivoAjuste?.trim() || null
    }).subscribe({
      next: () => {
        this.notify.success('Solicitud actualizada correctamente.');
        this.cerrarEditarModal();
        this.cargarSolicitudes();
        this.solicitudSeleccionada = null;
      },
      error: (err: any) => {
        console.error('Error actualizando solicitud:', err);
        this.notify.error(err?.error?.message || 'No se pudo actualizar la solicitud.');
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
          this.solicitudSeleccionada = null;
        },
        error: (err) => console.error('Error al aprobar:', err)
      });
  }
    this.prestamosAdmin
      .rechazarPrestamo(
        this.solicitudSeleccionada.id!,
        this.motivoRechazo,
        'rechazar'
      )
      .subscribe({
        next: () => {
          this.notify.success('Solicitud rechazada correctamente.');
          this.cargarSolicitudes();
          this.cerrarModal();
          this.solicitudSeleccionada = null;
        },
        error: (err) => console.error('Error al rechazar:', err)
      });
    }
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

<<<<<<< HEAD
=======
  this.prestamosAdmin
    .rechazarPrestamo(
      this.solicitudSeleccionada.id!,
      this.motivoRechazo,
      'rechazar'
    )
    .subscribe({
      next: () => {
        this.notify.success('Solicitud rechazada correctamente.');
        this.cargarSolicitudes();
        this.cerrarModal();
        this.solicitudSeleccionada = null;
      },
      error: (err) => console.error('Error al rechazar:', err)
    });
}

>>>>>>> practica1/actualizacion-admin

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

  getStockTipo(idTipoEquipo: number): number | null {
    const tipo = this.tiposEquipo.find(t => t.id === idTipoEquipo);
    return typeof tipo?.stock === 'number' ? tipo.stock : null;
  }

  getNombreTipo(idTipoEquipo: number): string {
    return this.tiposEquipo.find(t => t.id === idTipoEquipo)?.nombre ?? 'Equipo';
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

