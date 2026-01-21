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
  /** Cantidad de packs armables según equipos DISPONIBLES en backend */
  disponibles?: number;
  /** Marcador de comodidad para saber si el pack está agotado */
  agotado?: boolean;
  categoria?: string;
  equipos: Equipo[];
  created_at?: string;
}
