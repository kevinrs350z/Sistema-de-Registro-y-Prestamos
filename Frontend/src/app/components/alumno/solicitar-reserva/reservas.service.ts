import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Equipo, Pack, PrestamoDraft, User } from '../../../shared/models';

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

  // ✅ Aquí van los equipos simulados (8 en total)
  private equipos: Equipo[] = [
    // 🎥 AUDIOVISUAL
    {
      idEquipo: 1,
      nombre: 'Proyector Epson X2000',
      categoria: 'Audiovisual',
      estado: 'DISPONIBLE',
      codigo: 'AV-001',
      disponible: true,
      imagen: 'assets/equipos/proyector.jpg'
    },
    {
      idEquipo: 2,
      nombre: 'Micrófono Shure SM58',
      categoria: 'Audiovisual',
      estado: 'DISPONIBLE',
      codigo: 'AV-002',
      disponible: true,
      imagen: 'assets/equipos/microfono.png'
    },
    {
      idEquipo: 3,
      nombre: 'Parlante Amplificado Behringer B108D',
      categoria: 'Audiovisual',
      estado: 'DISPONIBLE',
      codigo: 'AV-003',
      disponible: true,
      imagen: 'assets/equipos/parlante.jpg'
    },

    // 📸 FOTOGRAFÍA
    {
      idEquipo: 4,
      nombre: 'Cámara Canon EOS Rebel T7',
      categoria: 'Fotografía',
      estado: 'DISPONIBLE',
      codigo: 'FOT-001',
      disponible: true,
      imagen: 'assets/equipos/camara.jpeg'
    },
    {
      idEquipo: 5,
      nombre: 'Trípode Manfrotto Compact',
      categoria: 'Fotografía',
      estado: 'DISPONIBLE',
      codigo: 'FOT-002',
      disponible: true,
      imagen: 'assets/equipos/tripode.png'
    },
    {
      idEquipo: 6,
      nombre: 'Flash Godox TT600',
      categoria: 'Fotografía',
      estado: 'DISPONIBLE',
      codigo: 'FOT-003',
      disponible: true,
      imagen: 'assets/equipos/flash.png'
    },

    // 💻 EQUIPO COMPUTACIONAL (solo 1)
    {
      idEquipo: 7,
      nombre: 'Notebook HP ProBook 450',
      categoria: 'Equipo Computacional',
      estado: 'DISPONIBLE',
      codigo: 'COMP-001',
      disponible: true,
      imagen: 'assets/equipos/notebook.jpeg'
    },

    // 💡 ILUMINACIÓN
    {
      idEquipo: 8,
      nombre: 'Panel LED Neewer 660',
      categoria: 'Iluminación',
      estado: 'DISPONIBLE',
      codigo: 'ILUM-001',
      disponible: true,
      imagen: 'assets/equipos/luz.jpg'
    },
    {
      idEquipo: 9,
      nombre: 'Aro de Luz 18” RGB',
      categoria: 'Iluminación',
      estado: 'DISPONIBLE',
      codigo: 'ILUM-002',
      disponible: true,
      imagen: 'assets/equipos/aro.jpeg'
    },
    {
      idEquipo: 10,
      nombre: 'Lámpara Softbox Neewer',
      categoria: 'Iluminación',
      estado: 'DISPONIBLE',
      codigo: 'ILUM-003',
      disponible: true,
      imagen: 'assets/equipos/lampara.jpeg'
    }
  ];



  private packs: Pack[] = [
    {
      idPack: 10,
      nombre: 'Pack Grabación Básico',
      descripcion: 'Cámara + Trípode + Micrófono',
      activo: true,
      equipos: [1, 2, 3]
    }
  ];

  private _borradores$ = new BehaviorSubject<PrestamoDraft[]>([]);
  borradores$ = this._borradores$.asObservable();

  getUsuarios() {
    return this.usuarios;
  }

  // ✅ Ahora los equipos se obtienen de aquí
  getEquiposDisponibles() {
    return this.equipos.filter(e => e.estado === 'DISPONIBLE');
  }

  getPacksActivos() {
    return this.packs.filter(p => p.activo);
  }

  // 🔹 Usuario logueado simulado
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
