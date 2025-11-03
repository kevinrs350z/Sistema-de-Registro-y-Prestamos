import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, style, transition, animate } from '@angular/animations';

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
export class MisSolicitudesComponent {
  solicitudes = signal([
    {
      id: 1,
      tipo: 'DENTRO',
      fecha: '2025-10-10',
      periodo: '→',
      bloque: 'Bloque 1 y 2',
      equipos: ['Cámara Canon', 'Micrófono Shure'],
      observacion: 'Grabación proyecto final',
      estado: 'PENDIENTE',
    },
    {
      id: 2,
      tipo: 'FUERA',
      fecha: '2025-09-15',
      periodo: '15/09 - 18/09',
      bloque: '—',
      equipos: ['Proyector Epson', 'Trípode Manfrotto'],
      observacion: 'Presentación externa',
      estado: 'APROBADA',
    },
  ]);

  estadoFiltro = signal('');
  orden = signal<'asc' | 'desc'>('desc');
  solicitudSeleccionada: any = null;

  solicitudesFiltradas = computed(() => {
    let lista = this.solicitudes();
    if (this.estadoFiltro()) {
      lista = lista.filter((s) => s.estado === this.estadoFiltro());
    }
    lista = lista.sort((a, b) =>
      this.orden() === 'asc'
        ? a.fecha.localeCompare(b.fecha)
        : b.fecha.localeCompare(a.fecha)
    );
    return lista;
  });

  filtrarEstado(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.estadoFiltro.set(value);
  }

  ordenarPorFecha(event: Event) {
    const value = (event.target as HTMLSelectElement).value as 'asc' | 'desc';
    this.orden.set(value);
  }

  seleccionarSolicitud(s: any) {
    this.solicitudSeleccionada = s;
  }
}
