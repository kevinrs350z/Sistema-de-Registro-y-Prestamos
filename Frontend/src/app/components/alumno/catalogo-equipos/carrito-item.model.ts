export interface CarritoItem {
  tipo: 'equipo' | 'pack';
  idTipoEquipo?: number;
  idPack?: number;
  nombre?: string;
  categoria?: string;
  cantidad: number;
  modo: 'cualquiera' | 'especifico';
  equiposSeleccionados: number[];
}
