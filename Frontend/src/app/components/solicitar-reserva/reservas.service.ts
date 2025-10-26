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

  // ✅ Aquí van los equipos simulados (8 en total)
  private equipos: Equipo[] = [
    // 🎥 AUDIOVISUAL
    {
      idEquipo: 1,
      nombre: 'Proyector Epson X2000',
      categoria: 'Audiovisual',
      descripcion: 'Proyector Full HD ideal para presentaciones o clases en sala.',
      estado: 'DISPONIBLE',
      codigo: 'AV-001',
      disponible: true
    },
    {
      idEquipo: 2,
      nombre: 'Micrófono Shure SM58',
      categoria: 'Audiovisual',
      descripcion: 'Micrófono dinámico con alta sensibilidad para eventos o grabaciones.',
      estado: 'OCUPADO',
      codigo: 'AV-002',
      disponible: false
    },

    // 📸 FOTOGRAFÍA
    {
      idEquipo: 3,
      nombre: 'Cámara Canon EOS Rebel T7',
      categoria: 'Fotografía',
      descripcion: 'Cámara réflex digital con lente 18-55mm ideal para sesiones o proyectos.',
      estado: 'DISPONIBLE',
      codigo: 'FOT-001',
      disponible: true
    },
    {
      idEquipo: 4,
      nombre: 'Trípode Manfrotto Compact',
      categoria: 'Fotografía',
      descripcion: 'Trípode profesional de aluminio con ajuste de altura y rotación.',
      estado: 'MANTENCION',
      codigo: 'FOT-002',
      disponible: true
    },

    // 💻 EQUIPO COMPUTACIONAL
    {
      idEquipo: 5,
      nombre: 'Notebook HP ProBook 450',
      categoria: 'Equipo Computacional',
      descripcion: 'Notebook de 15” con procesador Intel i7 y 16GB RAM, ideal para desarrollo.',
      estado: 'OCUPADO',
      codigo: 'COMP-001',
      disponible: false
    },
    {
      idEquipo: 6,
      nombre: 'Monitor Dell 24” LED',
      categoria: 'Equipo Computacional',
      descripcion: 'Pantalla Full HD con excelente reproducción de color.',
      estado: 'DISPONIBLE',
      codigo: 'COMP-002',
      disponible: true
    },

    // 💡 ILUMINACIÓN
    {
      idEquipo: 7,
      nombre: 'Panel LED Neewer 660',
      categoria: 'Iluminación',
      descripcion: 'Panel LED ajustable con temperatura de color y soporte de estudio.',
      estado: 'DISPONIBLE',
      codigo: 'ILUM-001',
      disponible: true
    },
    {
      idEquipo: 8,
      nombre: 'Aro de Luz 18” RGB',
      categoria: 'Iluminación',
      descripcion: 'Aro de luz regulable en intensidad y color.',
      estado: 'OCUPADO',
      codigo: 'ILUM-002',
      disponible: false
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
