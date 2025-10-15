export interface User {
  idUser: number;
  nombre: string;
  email: string;
  rut: string;
  telefono: string;
}

export interface Equipo {
  idEquipo: number;
  nombre: string;
  categoria: string;
  estado: 'DISPONIBLE' | 'OCUPADO' | 'MANTENCION';
  codigo: string;
}

export interface Pack {
  idPack: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  equipos: number[];
}

export type TipoPrestamo = 'INDIVIDUAL' | 'PACK';

export interface PrestamoDraft {
  idUser: number;
  tipo: TipoPrestamo;
  equipos?: number[];
  idPack?: number;
  fecha_inicio: string;
  fecha_fin: string;
  observacion?: string;
  bloque: number; // ✅ AGREGAR ESTA LÍNEA
  estado: string;
}
