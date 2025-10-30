export interface User {
  idUser: number;
  nombre: string;
  email: string;
  rut: string;
  telefono: string;
}

// ✅ Modelo de equipo unificado y correcto
export interface Equipo {
  idEquipo: number;
  nombre: string;
  categoria: string;
  descripcion: string;
  estado: 'DISPONIBLE' | 'OCUPADO' | 'MANTENCION';
  codigo: string;
  disponible: boolean;
  imagen: string;
}


export interface Pack {
  idPack: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  equipos: number[];
}

export type TipoPrestamo = 'INDIVIDUAL' | 'PACK' | 'DENTRO' | 'FUERA';

export interface PrestamoDraft {
  idUser: number;
  tipo: TipoPrestamo;
  equipos?: number[];
  idPack?: number;
  fecha_inicio: string;
  fecha_fin: string;
  observacion?: string;
  bloque: number | string; // ← CAMBIO CLAVE
  estado: string;
  asignatura: string;
  motivo: string;
}
