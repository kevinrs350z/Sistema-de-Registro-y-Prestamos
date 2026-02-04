import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, style, transition, animate } from '@angular/animations';
import { AuthService } from '../../../services/auth.service';
import { ImagenService } from '../../../services/image.service';

@Component({
  selector: 'app-mis-solicitudes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mis-solicitudes.component.html',
  styleUrls: ['./mis-solicitudes.component.css'],
  animations: [
    trigger('slideInRight', [
      transition(':enter', [
        style({ transform: 'translateX(40px)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 })),
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateX(40px)', opacity: 0 })),
      ]),
    ]),
  ],
})
export class MisSolicitudesComponent implements OnInit {

  private api = inject(AuthService);
  private imagenSrv = inject(ImagenService);

  solicitudes = signal<any[]>([]);
  estadoFiltro = signal('');
  orden = signal<'asc' | 'desc'>('desc');
  solicitudSeleccionada = signal<any | null>(null);
  pageSize = 10;
  currentPage = signal(1);

  bloques = [
    { id: 1, texto: 'Bloque 1 (08:15 – 09:45)' },
    { id: 2, texto: 'Bloque 2 (09:55 – 11:25)' },
    { id: 3, texto: 'Bloque 3 (11:35 – 13:05)' },
    { id: 4, texto: 'Bloque 4 (14:30 – 16:00)' },
    { id: 5, texto: 'Bloque 5 (16:10 – 17:40)' },
  ];

  /* =============================
     COMPUTED: FILTRO + ORDEN
  ============================= */
  solicitudesFiltradas = computed(() => {
    let lista = [...this.solicitudes()];
    const filtro = this.estadoFiltro();
    const orden = this.orden();

    if (filtro) {
      lista = lista.filter(s => s.estado === filtro);
    }

    const toTime = (s: any) => {
      const base = s.created_at || s.fecha_inicio || s.fecha_fin || null;
      return base ? new Date(base).getTime() : 0;
    };

    lista.sort((a, b) =>
      orden === 'asc' ? toTime(a) - toTime(b) : toTime(b) - toTime(a)
    );

    return lista;
  });

  totalPages = computed(() => {
    const total = this.solicitudesFiltradas().length;
    return Math.max(1, Math.ceil(total / this.pageSize));
  });

  solicitudesPaginadas = computed(() => {
    const page = this.currentPage();
    const start = (page - 1) * this.pageSize;
    return this.solicitudesFiltradas().slice(start, start + this.pageSize);
  });

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  /* =============================
     CARGA DE SOLICITUDES
  ============================= */
  private cargarSolicitudes() {
    const token = sessionStorage.getItem('token') ?? '';

    this.api.getSolicitudesUsuario(token).subscribe({
      next: (data: any[]) => {
        const solicitudesMapeadas = data.map((s) => {

          const bloqueTxt =
            s.bloque_prestamo?.length > 0
              ? s.bloque_prestamo
                  .map((bp: any) => {
                    const nombre = bp.bloque?.nombre || `Bloque ${bp.idBloque}`;
                    const inicio = bp.bloque?.hora_inicio?.slice(0, 5);
                    const fin = bp.bloque?.hora_fin?.slice(0, 5);
                    return inicio && fin ? `${nombre} (${inicio}–${fin})` : nombre;
                  })
                  .join(', ')
              : '—';

          const equipos =
            s.equipos?.length > 0
              ? s.equipos.map((eq: any) => ({
                  codigo: eq.codigo,
                  nombre: eq.tipo?.nombre ?? 'Equipo',
                  imagen: this.imagenSrv.getStorageImage(eq.tipo?.imagen) ?? null,
                }))
              : [];

          return {
            id: s.idPrestamo,
            tipo: s.tipo === 'DENTRO' ? 'Laboratorio' : 'Externo',
            asignatura:
              s.asignatura_nombre ||
              s.asignaturaNombre ||
              s.bloque_prestamo?.[0]?.asignatura?.nombre ||
              (s.otra_motivo ? `OTROS: ${s.otra_motivo}` : '—'),
            fecha_inicio: s.fecha_inicio || null,
            fecha_fin: s.fecha_fin || null,
            created_at: s.created_at || null,
            bloqueTxt,
            equipos,
            observacion: s.observacion ?? 'Sin observación',
            tieneExtension: s.tiene_extension ?? false,
            ultimaExtension: s.ultima_extension ?? null,

            // 🔥 NORMALIZACIÓN CLAVE
            estado: (s.estado ?? 'PENDIENTE').toUpperCase(),
          };
        });

        this.solicitudes.set(solicitudesMapeadas);
        this.currentPage.set(1);
      },
      error: (err) => console.error('Error al cargar solicitudes:', err),
    });
  }

  /* =============================
     CLASE CSS PARA ESTADO
     (conecta directo con tu CSS)
  ============================= */
  getEstadoClass(estado: string): string {
    switch (estado?.toUpperCase()) {
      case 'PENDIENTE':
        return 'pendiente';
      case 'APROBADA':
      case 'APROBADO':
        return 'aprobada';
      case 'ACEPTADA':
      case 'ACEPTADO':
        return 'aceptado';
      case 'RECHAZADA':
      case 'RECHAZADO':
        return 'rechazada';
      case 'DEVUELTO':
        return 'devuelto';
      case 'ENTREGADO':
        return 'entregado';
      case 'PENDIENTE_ENTREGA':
        return 'pendiente-entrega';
      default:
        return '';
    }
  }

  /* =============================
     EVENTOS UI
  ============================= */
  filtrarEstado(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.estadoFiltro.set(value);
    this.currentPage.set(1);
  }

  ordenarPorFecha(event: Event) {
    const value = (event.target as HTMLSelectElement).value as 'asc' | 'desc';
    this.orden.set(value);
    this.currentPage.set(1);
  }

  cambiarPagina(delta: number) {
    const next = this.currentPage() + delta;
    const total = this.totalPages();
    if (next < 1 || next > total) return;
    this.currentPage.set(next);
  }

  seleccionarSolicitud(s: any) {
    this.solicitudSeleccionada.set(s);
  }
}
