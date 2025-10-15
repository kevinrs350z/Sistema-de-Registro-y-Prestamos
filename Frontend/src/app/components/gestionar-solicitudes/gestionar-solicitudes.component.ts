import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservasService } from '../solicitar-reserva/reservas.service';
import { Equipo, Pack, PrestamoDraft } from '../../shared/models';

@Component({
  selector: 'app-gestionar-solicitudes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gestionar-solicitudes.component.html',
  styleUrls: ['./gestionar-solicitudes.component.css']
})
export class GestionarSolicitudesComponent implements OnInit {
  reservas = inject(ReservasService);

  solicitudes: PrestamoDraft[] = [];
  equipos: Equipo[] = [];
  packs: Pack[] = [];

  ngOnInit(): void {
    this.solicitudes = this.reservas.getSolicitudesRealizadas();
    this.equipos = this.reservas.getEquiposDisponibles();
    this.packs = this.reservas.getPacksActivos();
  }

  getNombreEquipo(id: number): string {
    return this.equipos.find(e => e.idEquipo === id)?.nombre ?? '—';
  }

  getNombrePack(id: number | null): string {
    return this.packs.find(p => p.idPack === id)?.nombre ?? '—';
  }

  aceptarSolicitud(index: number) {
    this.solicitudes[index].estado = 'Aceptada';
  }

  rechazarSolicitud(index: number) {
    this.solicitudes[index].estado = 'Rechazada';
  }

  getNombresEquipos(ids: number[] | undefined | null): string {
    if (!ids || ids.length === 0) return '—';
    return ids.map(id => this.getNombreEquipo(id)).join(', ');
  }



}
