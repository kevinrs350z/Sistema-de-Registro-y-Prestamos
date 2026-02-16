export interface Encargado {
  id: number;
  nombre?: string;
  email?: string;
  rut?: string;
  rol?: string;
}

export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string | null;
  icono?: string | null;
  activo: boolean;
  encargados_count?: number;
  encargados?: Encargado[];
}
