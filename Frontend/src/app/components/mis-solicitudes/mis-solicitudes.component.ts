import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservasService } from '../solicitar-reserva/reservas.service';
import { Equipo, Pack, TipoPrestamo } from '../../shared/models';

@Component({
  selector: 'app-mis-solicitudes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mis-solicitudes.component.html',
  styleUrls: ['./mis-solicitudes.component.css']
})
export class MisSolicitudesComponent implements OnInit {
  private reservas = inject(ReservasService);

  solicitudes: any[] = [];
  equipos: Equipo[] = [];
  packs: Pack[] = [];

  bloques = [
    { id: 1, texto: 'Bloque 1 (08:15 – 09:45)' },
    { id: 2, texto: 'Bloque 2 (09:55 – 11:25)' },
    { id: 3, texto: 'Bloque 3 (11:35 – 13:05)' },
    { id: 4, texto: 'Bloque 4 (14:30 – 16:00)' },
    { id: 5, texto: 'Bloque 5 (16:10 – 17:40)' }
  ];

  ngOnInit() {
    this.solicitudes = this.reservas.getSolicitudesRealizadas().map((s, index) => {
      const bloqueTxt = this.bloques.find(b => b.id === s.bloque)?.texto ?? '—';
      const packNombre = this.packs.find(p => p.idPack === s.idPack)?.nombre ?? '—';
      const estado = ['PENDIENTE', 'APROBADA', 'RECHAZADA'][index % 3]; // Simulado

      return {
        ...s,
        id: index + 1,
        bloqueTxt,
        packNombre,
        estado
      };
    });

    this.equipos = this.reservas.getEquiposDisponibles();
    this.packs = this.reservas.getPacksActivos();
  }
}
