export interface GrupoIntegrante {
  id: number;
  nombre: string;
  rut?: string;
  email?: string;
  agregado_en?: string;
}

export interface Grupo {
  id?: number;
  nombre: string;
  descripcion?: string;
  asignatura_id?: number;
  asignatura_nombre?: string;
  bloque_id?: number;
  bloque_label?: string;
  docente_id?: number;
  docente_nombre?: string;
  estado?: 'ACTIVO' | 'CERRADO';
  anio?: number;
  semestre?: number;
  periodo_inicio?: string;
  periodo_fin?: string;
  integrantes?: GrupoIntegrante[];
  usuarios?: any[]; // Compatibilidad con respuesta raw del backend
  integrantes_count?: number;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  reglas?: any[];
  historial?: any[];
}
