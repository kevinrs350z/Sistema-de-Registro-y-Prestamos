import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, style, transition, animate } from '@angular/animations';
import { ReservasService } from '../solicitar-reserva/reservas.service';
import { AuthService } from '../../../services/auth.service';
import { Equipo, Pack } from '../../../shared/models';

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
  // --- Inyecciones ---
  private reservas = inject(ReservasService);
  private api = inject(AuthService);

  // --- Signals principales ---
  solicitudes = signal<any[]>([]);
  estadoFiltro = signal('');
  orden = signal<'asc' | 'desc'>('desc');
  solicitudSeleccionada = signal<any | null>(null);

  equipos = signal<Equipo[]>([]);
  packs = signal<Pack[]>([]);

  bloques = [
    { id: 1, texto: 'Bloque 1 (08:15 – 09:45)' },
    { id: 2, texto: 'Bloque 2 (09:55 – 11:25)' },
    { id: 3, texto: 'Bloque 3 (11:35 – 13:05)' },
    { id: 4, texto: 'Bloque 4 (14:30 – 16:00)' },
    { id: 5, texto: 'Bloque 5 (16:10 – 17:40)' },
  ];

  // --- Computed dinámico ---
  solicitudesFiltradas = computed(() => {
    let lista = this.solicitudes();
    const filtro = this.estadoFiltro();
    const orden = this.orden();

    if (filtro) lista = lista.filter(s => s.estado === filtro);
    lista = lista.sort((a, b) =>
      orden === 'asc'
        ? a.fecha_inicio.localeCompare(b.fecha_inicio)
        : b.fecha_inicio.localeCompare(a.fecha_inicio)
    );

    return lista;
  });

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  // --- Cargar solicitudes desde backend ---
  private cargarSolicitudes() {
    const token = localStorage.getItem('token') ?? '';
    this.api.getSolicitudesUsuario(token).subscribe({
      next: (data) => {
        const solicitudesMapeadas = data.map((s: any) => {
          const bloqueTxt =
            s.bloque_prestamo?.length > 0
              ? s.bloque_prestamo
                  .map((bp: any) => bp.bloque?.nombre || `Bloque ${bp.idBloque}`)
                  .join(', ')
              : '—';

          return {
            id: s.idPrestamo,
            tipo: s.tipo === 'DENTRO' ? 'Laboratorio' : 'Externo',
            fecha_inicio: s.fecha_inicio ?? '—',
            fecha_fin: s.fecha_fin ?? '—',
            bloqueTxt,
            equipos: [s.equipo?.nombre || '—'],
            observacion: s.Observacion ?? '',
            estado: s.estado?.toUpperCase() ?? 'PENDIENTE',
          };
        });

        this.solicitudes.set(solicitudesMapeadas);
      },
      error: (err) => console.error('Error al cargar solicitudes:', err),
    });
  }

  // --- Acciones UI ---
  filtrarEstado(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.estadoFiltro.set(value);
  }

  ordenarPorFecha(event: Event) {
    const value = (event.target as HTMLSelectElement).value as 'asc' | 'desc';
    this.orden.set(value);
  }

  seleccionarSolicitud(s: any) {
    this.solicitudSeleccionada.set(s);
  }
}
