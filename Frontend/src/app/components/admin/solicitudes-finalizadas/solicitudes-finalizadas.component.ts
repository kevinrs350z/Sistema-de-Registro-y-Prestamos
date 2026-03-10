import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PrestamosAdminService } from '../../../services/prestamos-admin.service';
import { PrestamoStateService } from '../../../services/prestamo-state.service';
import { DataSyncService } from '../../../services/data-sync.service';
import { NavbarAdminComponent } from "../navbar-admin/navbar-admin.component";
import { NotificationService } from '../../../services/notification.service';
import { Router } from '@angular/router';

type AdminSolicitud = {
  id: number;
  estudiante: string;
  email: string;
  tipo: 'DENTRO' | 'FUERA';
  bloque: string;
  periodo: string;
  fechaInicio: string | null;
  fechaFin: string | null;
  observacion: string;

  equiposDetallados: {
    id: number;
    nombre: string;
    codigoActivo: string;
    devuelto: boolean;
  }[];

  fechaSolicitud: string;
  estado: 'APROBADO' | 'DEVUELTO' | 'RECHAZADO' | 'ENTREGADO';
};

type EquipoTarjeta = {
  solicitud: AdminSolicitud;
  equipo: AdminSolicitud['equiposDetallados'][number];
  pendientesRestantes: number;
  devueltosTotales: number;
};

type ExtendModalState = {
  fecha: string;
  comentario: string;
  aplicarATodos: boolean;
  equiposSeleccionados: Record<number, boolean>;
};

@Component({
  selector: 'app-solicitudes-finalizadas',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarAdminComponent],
  templateUrl: './solicitudes-finalizadas.component.html',
  styleUrls: ['./solicitudes-finalizadas.component.css']
})
export class SolicitudesFinalizadasComponent implements OnInit, OnDestroy {

  private notify = inject(NotificationService);
  private prestamoState = inject(PrestamoStateService);
  private dataSync = inject(DataSyncService);
  private destroy$ = new Subject<void>();

  solicitudes: AdminSolicitud[] = [];
  solicitudSeleccionada: AdminSolicitud | null = null;
  equipoSeleccionado: EquipoTarjeta | null = null;

  filtroBusqueda = '';
  orden: 'recientes' | 'antiguas' = 'recientes';
  
  // Paginación
  paginaPendientes = 1;
  paginaDevueltos = 1;
  tamanioPagina = 6;

  mostrarExtendModal = false;
  extendModal: ExtendModalState = {
    fecha: '',
    comentario: '',
    aplicarATodos: true,
    equiposSeleccionados: {}
  };
  readonly hoyISO = new Date().toISOString().split('T')[0];
  private reselectPrestamoId: number | null = null;

  constructor(private api: PrestamosAdminService, private router: Router) {}

  ngOnInit(): void {
    // Conectar a estado reactivo y filtrar solicitudes finalizadas
    this.prestamoState.solicitudes$
      .pipe(takeUntil(this.destroy$))
      .subscribe(allSolicitudes => {
        // Transformar datos de préstamo a formato de solicitudes finalizadas
        this.solicitudes = (allSolicitudes || [])
          .filter(p => ['ENTREGADO', 'DEVUELTO', 'RECHAZADO'].includes(p.estado))
          .map((p): AdminSolicitud => {
            const esDevuelto = p.estado === 'DEVUELTO';
            const equiposDetallados = Array.isArray(p.equipos)
              ? p.equipos.map((eq: any) => ({
                  id: eq.id,
                  nombre: eq.nombre ?? eq.tipo?.nombre ?? 'Equipo',
                  codigoActivo: eq.codigo_activo ?? eq.codigo ?? '—',
                  devuelto: esDevuelto ? true : Boolean(eq.devuelto)
                }))
              : [];

            return {
              id: p.idPrestamo,
              estudiante: p.user?.nombre ?? 'Desconocido',
              email: p.user?.email ?? '',
              tipo: p.tipo,
              bloque: p.bloquePrestamo ?? '—',
              periodo: `${p.fecha_inicio ?? '—'} - ${p.fecha_fin ?? '—'}`,
              fechaInicio: p.fecha_inicio ?? null,
              fechaFin: p.fecha_fin ?? null,
              equiposDetallados,
              observacion: p.observacion ?? 'Sin observación',
              fechaSolicitud: p.created_at ?? '',
              estado: p.estado as AdminSolicitud['estado']
            };
          });

        if (this.reselectPrestamoId !== null) {
          const seleccionada = this.solicitudes.find((s) => s.id === this.reselectPrestamoId) ?? null;
          this.solicitudSeleccionada = seleccionada;

          if (seleccionada) {
            const equipoBaseId = this.equipoSeleccionado?.equipo?.id ?? null;
            const equipoReselect = equipoBaseId
              ? seleccionada.equiposDetallados.find((eq) => eq.id === equipoBaseId)
              : seleccionada.equiposDetallados.find((eq) => eq.devuelto) ?? seleccionada.equiposDetallados[0];

            this.equipoSeleccionado = equipoReselect
              ? this.crearTarjeta(seleccionada, equipoReselect)
              : null;
          } else {
            this.equipoSeleccionado = null;
          }

          this.reselectPrestamoId = null;
        }
      });

    // Iniciar polling automático
    this.prestamoState.iniciarPolling();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.prestamoState.detenerPolling();
  }

  cargarSolicitudes(): void {
    // Trigger cache invalidation to refresh data from API
    this.dataSync.invalidarPrestamos();
  }

  get solicitudesFiltradas(): AdminSolicitud[] {
    const term = this.filtroBusqueda.toLowerCase().trim();

    let resultado = this.solicitudes.filter((s) => {

      const texto = `${s.estudiante} ${s.observacion} ${s.equiposDetallados
        .map(e => e.nombre)
        .join(', ')
      }`.toLowerCase();

      const coincideBusqueda = texto.includes(term);

      return coincideBusqueda;
    });

    resultado.sort((a, b) => {
      const fa = new Date(a.fechaSolicitud).getTime();
      const fb = new Date(b.fechaSolicitud).getTime();
      return this.orden === 'antiguas' ? fa - fb : fb - fa;
    });

    return resultado;
  }

  private crearTarjeta(
    solicitud: AdminSolicitud,
    equipo: AdminSolicitud['equiposDetallados'][number]
  ): EquipoTarjeta {
    const pendientesRestantes = solicitud.equiposDetallados.filter((eq) => !eq.devuelto).length;
    const devueltosTotales = solicitud.equiposDetallados.length - pendientesRestantes;

    return { solicitud, equipo, pendientesRestantes, devueltosTotales };
  }

  private construirTarjetas(predicate: (equipo: AdminSolicitud['equiposDetallados'][number]) => boolean): EquipoTarjeta[] {
    return this.solicitudesFiltradas.flatMap((solicitud) =>
      solicitud.equiposDetallados
        .filter(predicate)
        .map((equipo) => this.crearTarjeta(solicitud, equipo))
    );
  }

  get equiposPendientes(): EquipoTarjeta[] {
    return this.construirTarjetas((equipo) => !equipo.devuelto);
  }

  get equiposDevueltos(): EquipoTarjeta[] {
    return this.construirTarjetas((equipo) => equipo.devuelto);
  }

  get prestamosPendientes(): AdminSolicitud[] {
    return this.solicitudesFiltradas.filter((solicitud) => solicitud.estado === 'ENTREGADO');
  }

  get prestamosDevueltos(): AdminSolicitud[] {
    return this.solicitudesFiltradas.filter((solicitud) => solicitud.estado === 'DEVUELTO');
  }

  // === Paginación ===
  get totalPaginasPendientes(): number {
    return Math.max(1, Math.ceil(this.prestamosPendientes.length / this.tamanioPagina));
  }

  get totalPaginasDevueltos(): number {
    return Math.max(1, Math.ceil(this.prestamosDevueltos.length / this.tamanioPagina));
  }

  get paginaPendientesLista(): AdminSolicitud[] {
    const inicio = (this.paginaPendientes - 1) * this.tamanioPagina;
    return this.prestamosPendientes.slice(inicio, inicio + this.tamanioPagina);
  }

  get paginaDevueltosLista(): AdminSolicitud[] {
    const inicio = (this.paginaDevueltos - 1) * this.tamanioPagina;
    return this.prestamosDevueltos.slice(inicio, inicio + this.tamanioPagina);
  }

  irPaginaPendientes(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginasPendientes) return;
    this.paginaPendientes = pagina;
  }

  irPaginaDevueltos(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginasDevueltos) return;
    this.paginaDevueltos = pagina;
  }

  resetPaginacion(): void {
    this.paginaPendientes = 1;
    this.paginaDevueltos = 1;
  }

  // Formatear fecha para mostrar dd/MM/yyyy
  formatearFecha(fecha: string | null): string {
    if (!fecha) return '—';
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return '—';
    const dia = d.getDate().toString().padStart(2, '0');
    const mes = (d.getMonth() + 1).toString().padStart(2, '0');
    const anio = d.getFullYear();
    return `${dia}/${mes}/${anio}`;
  }

  // Formatear periodo con fechas legibles
  formatearPeriodo(fechaInicio: string | null, fechaFin: string | null): string {
    const inicio = this.formatearFecha(fechaInicio);
    const fin = this.formatearFecha(fechaFin);
    if (inicio === '—' && fin === '—') return '—';
    if (inicio === fin) return inicio;
    return `${inicio} - ${fin}`;
  }

  equiposPendientesDe(solicitud: AdminSolicitud): AdminSolicitud['equiposDetallados'] {
    return solicitud.equiposDetallados.filter((equipo) => !equipo.devuelto);
  }

  equiposDevueltosDe(solicitud: AdminSolicitud): AdminSolicitud['equiposDetallados'] {
    return solicitud.equiposDetallados.filter((equipo) => equipo.devuelto);
  }

  seleccionarEquipo(item: EquipoTarjeta): void {
    this.solicitudSeleccionada = item.solicitud;
    this.equipoSeleccionado = item;
  }

  seleccionarSolicitud(solicitud: AdminSolicitud): void {
    this.solicitudSeleccionada = solicitud;
    this.equipoSeleccionado = null;
  }

  cerrarDetalle(): void {
    this.solicitudSeleccionada = null;
    this.equipoSeleccionado = null;
  }

  resetFiltros(): void {
    this.filtroBusqueda = '';
    this.orden = 'recientes';
    this.solicitudSeleccionada = null;
    this.equipoSeleccionado = null;
  }

  irASanciones(prestamoId: number): void {
    this.router.navigate(['/admin/sanciones'], {
      queryParams: { prestamoId }
    });
  }

  devolverPrestamoDirecto(): void {
    if (!this.solicitudSeleccionada) {
      return;
    }

    if (!this.puedeDevolver(this.solicitudSeleccionada)) {
      this.notify.info('Este préstamo ya fue devuelto completamente.');
      return;
    }

    const prestamoId = this.solicitudSeleccionada.id;
    const motivo = 'Préstamo devuelto por administración.';

    this.api.marcarDevuelto(prestamoId, motivo).subscribe({
      next: () => {
        const solicitud = this.solicitudes.find((s) => s.id === prestamoId) ?? null;

        if (solicitud) {
          solicitud.equiposDetallados = solicitud.equiposDetallados.map((equipo) => ({
            ...equipo,
            devuelto: true
          }));

          solicitud.estado = 'DEVUELTO';
          this.solicitudes = [...this.solicitudes];

          const primerDevuelto = solicitud.equiposDetallados.find((eq) => eq.devuelto) ?? null;
          this.solicitudSeleccionada = solicitud;
          this.equipoSeleccionado = primerDevuelto
            ? this.crearTarjeta(solicitud, primerDevuelto)
            : null;
        } else {
          this.solicitudSeleccionada = null;
          this.equipoSeleccionado = null;
        }

        this.reselectPrestamoId = prestamoId;
        this.notify.success('Préstamo marcado como devuelto correctamente.');
        this.cargarSolicitudes();
      },
      error: (err) => console.error('Error al finalizar préstamo:', err),
    });
  }

  abrirExtender(): void {
    if (!this.solicitudSeleccionada) {
      return;
    }

    if (!this.puedeExtender(this.solicitudSeleccionada)) {
      this.notify.info('No hay equipos pendientes para extender.');
      return;
    }

    this.extendModal = this.crearEstadoExtendModal(this.solicitudSeleccionada);
    this.mostrarExtendModal = true;
  }

  cerrarExtendModal(): void {
    this.mostrarExtendModal = false;
    this.extendModal = this.crearEstadoExtendModal();
  }


  confirmarExtension(): void {
    if (!this.solicitudSeleccionada) {
      return;
    }

    const fecha = this.extendModal.fecha?.trim();
    if (!fecha) {
      this.notify.warning('Selecciona la nueva fecha límite.');
      return;
    }

    const equiposDisponibles = this.solicitudSeleccionada.equiposDetallados.filter((eq) => !eq.devuelto);

    if (equiposDisponibles.length === 0) {
      this.notify.info('No quedan equipos pendientes para extender.');
      this.cerrarExtendModal();
      return;
    }

    let equiposIds: number[] = [];
    if (this.extendModal.aplicarATodos) {
      equiposIds = equiposDisponibles.map((eq) => eq.id);
    } else {
      equiposIds = equiposDisponibles
        .filter((eq) => this.extendModal.equiposSeleccionados[eq.id])
        .map((eq) => eq.id);

      if (equiposIds.length === 0) {
        this.notify.warning('Selecciona al menos un equipo para extender.');
        return;
      }
    }

    const payload = {
      fecha: fecha,
      comentario: this.extendModal.comentario?.trim() ?? '',
      equiposIds
    };

    this.api.extenderPrestamo(this.solicitudSeleccionada.id, payload).subscribe({
      next: () => {
        this.notify.success('Plazo del préstamo extendido correctamente.');
        this.reselectPrestamoId = this.solicitudSeleccionada?.id ?? null;
        this.cerrarExtendModal();
        this.cargarSolicitudes();
      },
      error: (err) => {
        console.error('Error al extender préstamo:', err);
        this.notify.error('No fue posible extender el préstamo.');
      }
    });
  }


  devolverEquipo(idPrestamo: number, idEquipo: number): void {
    const motivoPorDefecto = 'Devolución registrada desde el panel administrativo.';

    // Aplicar optimismo: marcar como devuelto antes de la respuesta
    const solicitudLocal = this.solicitudes.find((s) => s.id === idPrestamo);
    let revertir = false;

    if (solicitudLocal) {
      const equipoLocal = solicitudLocal.equiposDetallados.find((eq) => eq.id === idEquipo);
      if (equipoLocal && !equipoLocal.devuelto) {
        equipoLocal.devuelto = true;
        revertir = true;
      }
    }

    this.api.devolverEquipo(idPrestamo, idEquipo, motivoPorDefecto).subscribe({
      next: () => {

        // ✅ ACTUALIZAR EL EQUIPO EN FRONT
        const solicitud = this.solicitudes.find(s => s.id === idPrestamo);
        let equipoActualizado: AdminSolicitud['equiposDetallados'][number] | undefined;

        if (solicitud) {
          equipoActualizado = solicitud.equiposDetallados.find(e => e.id === idEquipo);
          if (equipoActualizado) {
            equipoActualizado.devuelto = true;
          }

          // 🔥 si todos están devueltos → préstamo DEVUELTO
          const quedanPendientes = solicitud.equiposDetallados
            .some(e => !e.devuelto);

          if (!quedanPendientes) {
            solicitud.estado = 'DEVUELTO';
          }
        }

        this.notify.success('Equipo devuelto correctamente.');
        this.solicitudSeleccionada = solicitud ?? this.solicitudSeleccionada;
        this.solicitudes = [...this.solicitudes];

        if (this.equipoSeleccionado) {
          const actualizado = [...this.equiposPendientes, ...this.equiposDevueltos]
            .find((item) => item.solicitud.id === idPrestamo && item.equipo.id === idEquipo);

          this.equipoSeleccionado = actualizado ?? this.equipoSeleccionado;
        }
      },
      error: (err) => {
        console.error('Error al devolver equipo:', err);
        this.notify.error('Ocurrió un error al devolver el equipo.');

        if (revertir && solicitudLocal) {
          const equipoLocal = solicitudLocal.equiposDetallados.find((eq) => eq.id === idEquipo);
          if (equipoLocal) {
            equipoLocal.devuelto = false;
          }
        }
      } 
    });
  }

  private crearEstadoExtendModal(solicitud?: AdminSolicitud): ExtendModalState {
    const seleccion: Record<number, boolean> = {};

    solicitud?.equiposDetallados
      .filter((equipo) => !equipo.devuelto)
      .forEach((equipo) => {
        seleccion[equipo.id] = true;
      });

    return {
      fecha: '',
      comentario: '',
      aplicarATodos: true,
      equiposSeleccionados: seleccion
    };
  }

  puedeDevolver(solicitud: AdminSolicitud): boolean {
    return solicitud.estado === 'APROBADO' || solicitud.estado === 'ENTREGADO';
  }

  puedeExtender(solicitud: AdminSolicitud): boolean {
    if (!(solicitud.estado === 'APROBADO' || solicitud.estado === 'ENTREGADO')) {
      return false;
    }

    return solicitud.equiposDetallados.some((equipo) => !equipo.devuelto);
  }

}
