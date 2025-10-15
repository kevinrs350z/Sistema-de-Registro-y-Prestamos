import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Equipo, Pack, PrestamoDraft, User } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class ReservasService {
  private usuarios: User[] = [
    {
      idUser: 1,
      nombre: 'Alumno Demo',
      email: 'alumno@demo.cl',
      rut: '12.345.678-9',
      telefono: '+56 9 8765 4321'
    }
  ];


  private equipos: Equipo[] = [
    { idEquipo: 1, nombre: 'Cámara Canon', categoria: 'Fotografía', estado: 'DISPONIBLE', codigo: 'CAM-001' },
    { idEquipo: 2, nombre: 'Trípode Manfrotto', categoria: 'Accesorios', estado: 'DISPONIBLE', codigo: 'ACC-014' },
    { idEquipo: 3, nombre: 'Micrófono Rode', categoria: 'Audio', estado: 'OCUPADO', codigo: 'AUD-007' }
  ];

  private packs: Pack[] = [
    { idPack: 10, nombre: 'Pack Grabación Básico', descripcion: 'Cámara+Trípode+Micrófono', activo: true, equipos: [1, 2, 3] }
  ];

  private _borradores$ = new BehaviorSubject<PrestamoDraft[]>([]);
  borradores$ = this._borradores$.asObservable();

  getUsuarios() { return this.usuarios; }
  getEquiposDisponibles() { return this.equipos.filter(e => e.estado === 'DISPONIBLE'); }
  getPacksActivos() { return this.packs.filter(p => p.activo); }

  // 🔹 Nuevo: usuario logueado simulado
  getUsuarioActual() {
    return this.usuarios[0];
  }

  crearBorrador(p: PrestamoDraft) {
    const arr = this._borradores$.value;
    this._borradores$.next([...arr, p]);
    localStorage.setItem('reservas_borradores', JSON.stringify(this._borradores$.value));
  }

  getSolicitudesRealizadas(): any[] {
    return JSON.parse(localStorage.getItem('reservas_borradores') ?? '[]');
  }

}
