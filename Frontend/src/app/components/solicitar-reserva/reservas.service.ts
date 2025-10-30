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
      disponible: true,
      imagen: 'assets/equipos/proyector.jpg'
    },
    {
      idEquipo: 2,
      nombre: 'Micrófono Shure SM58',
      categoria: 'Audiovisual',
      descripcion: 'Micrófono dinámico de alta calidad para conferencias y grabaciones.',
      estado: 'DISPONIBLE',
      codigo: 'AV-002',
      disponible: true,
      imagen: 'assets/equipos/microfono.png'
    },
    {
      idEquipo: 3,
      nombre: 'Parlante Amplificado Behringer B108D',
      categoria: 'Audiovisual',
      descripcion: 'Parlante activo de 300W ideal para eventos o clases en auditorio.',
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
      descripcion: 'Cámara réflex digital con lente 18-55 mm, ideal para proyectos académicos.',
      estado: 'DISPONIBLE',
      codigo: 'FOT-001',
      disponible: true,
      imagen: 'assets/equipos/camara.jpeg'
    },
    {
      idEquipo: 5,
      nombre: 'Trípode Manfrotto Compact',
      categoria: 'Fotografía',
      descripcion: 'Trípode de aluminio ajustable, ideal para fotografía fija o de producto.',
      estado: 'DISPONIBLE',
      codigo: 'FOT-002',
      disponible: true,
      imagen: 'assets/equipos/tripode.png'
    },
    {
      idEquipo: 6,
      nombre: 'Flash Godox TT600',
      categoria: 'Fotografía',
      descripcion: 'Flash externo con control inalámbrico, compatible con cámaras Canon y Nikon.',
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
      descripcion: 'Notebook de 15” con procesador Intel i7 y 16 GB RAM, ideal para desarrollo y análisis de datos.',
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
      descripcion: 'Panel LED ajustable con control de brillo y temperatura de color.',
      estado: 'DISPONIBLE',
      codigo: 'ILUM-001',
      disponible: true,
      imagen: 'assets/equipos/luz.jpg'
    },
    {
      idEquipo: 9,
      nombre: 'Aro de Luz 18” RGB',
      categoria: 'Iluminación',
      descripcion: 'Aro de luz regulable en intensidad y temperatura, ideal para retratos y video.',
      estado: 'DISPONIBLE',
      codigo: 'ILUM-002',
      disponible: true,
      imagen: 'assets/equipos/aro.jpeg'
    },
    {
      idEquipo: 10,
      nombre: 'Lámpara Softbox Neewer',
      categoria: 'Iluminación',
      descripcion: 'Lámpara profesional con difusor, perfecta para estudios fotográficos.',
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
