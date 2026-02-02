export interface Grupo {
  id?: number;
  nombre: string;
  asignatura_id?: number;
  docente_id?: number;
  usuarios?: any[];
  prestamos?: any[];
  asignatura?: any;
  docente?: any;
}
