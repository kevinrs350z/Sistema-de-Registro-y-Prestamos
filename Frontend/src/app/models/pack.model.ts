export interface Equipo {
  id: number;
  nombre: string;
  descripcion?: string | null;
  codigo_activo?: string | null;
}

export interface Pack {
  id: number;
  nombre: string;
  descripcion?: string | null;
  imagen_url?: string | null;
  equipos: Equipo[];
  created_at?: string;
}
