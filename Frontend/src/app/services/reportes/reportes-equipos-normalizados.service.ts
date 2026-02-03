import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReportFilter } from '../report-filters.service';

/**
 * Interfaces para las respuestas de equipos normalizados
 */
export interface EquipoNormalizado {
  id: number;
  nombre: string;
  codigo: string;
  tipo: string;
  categoria: string;
  estado: string;
  fecha_alta: string;
  // Métricas normalizadas
  meses_activos: number;
  dias_disponibles: number;
  total_prestamos: number;
  dias_prestado: number;
  promedio_duracion_dias: number;
  prestamos_por_mes_activo: number;
  utilizacion_porcentaje: number;
  // Desglose
  prestamos_internos: number;
  prestamos_externos: number;
}

export interface KPIsEquipos {
  totalEquipos: number;
  disponibles: number;
  enPrestamo: number;
  enMantenimiento: number;
  totalPrestamos: number;
  equiposPrestados: number;
  tasaUtilizacion: number;
  promedioDuracionDias: number;
  prestamosPorMes: number;
  prestamosInternos: number;
  prestamosExternos: number;
  filtros: {
    from: string;
    to: string;
    uso: string;
  };
}

export interface EvolucionUtilizacion {
  periodo: string;
  prestamos: number;
  equipos_prestados: number;
  utilizacion_porcentaje: number;
  internos: number;
  externos: number;
}

export interface MetricaCategoria {
  id: number;
  nombre: string;
  total_equipos: number;
  equipos_prestados: number;
  total_prestamos: number;
  prestamos_por_mes: number;
  utilizacion_porcentaje: number;
  promedio_duracion_dias: number;
}

export interface ComparacionAntiguedad {
  antiguos: {
    cantidad: number;
    promedio_utilizacion: number;
    promedio_prestamos_mes: number;
    promedio_duracion: number;
  };
  nuevos: {
    cantidad: number;
    promedio_utilizacion: number;
    promedio_prestamos_mes: number;
    promedio_duracion: number;
  };
  resumen: string;
}

@Injectable({ providedIn: 'root' })
export class ReportesEquiposNormalizadosService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api/reportes/equipos-normalizados`;

  constructor(private http: HttpClient) {}

  /**
   * Construir parámetros desde ReportFilter
   * Incluye filtros BI: from, to, uso, granularity
   */
  private buildParamsFromFilter(filter: ReportFilter): HttpParams {
    let params = new HttpParams();
    params = params.set('from', filter.from);
    params = params.set('to', filter.to);
    
    if (filter.granularity) {
      params = params.set('granularity', filter.granularity);
    }
    
    if (filter.tipoUso) {
      params = params.set('uso', filter.tipoUso);
    }
    
    return params;
  }

  /**
   * Obtener KPIs generales de equipos
   */
  getKPIs(filter?: ReportFilter): Observable<KPIsEquipos> {
    const params = filter ? this.buildParamsFromFilter(filter) : new HttpParams();
    return this.http.get<KPIsEquipos>(`${this.baseUrl}/kpis`, { params });
  }

  /**
   * Obtener lista de equipos con métricas normalizadas
   * Evita sesgo por antigüedad
   */
  getEquiposNormalizados(filter?: ReportFilter, limit: number = 20): Observable<{
    data: EquipoNormalizado[];
    total: number;
    filtros: any;
  }> {
    let params = filter ? this.buildParamsFromFilter(filter) : new HttpParams();
    params = params.set('limit', limit.toString());
    return this.http.get<{ data: EquipoNormalizado[]; total: number; filtros: any }>(
      `${this.baseUrl}/lista`, 
      { params }
    );
  }

  /**
   * Obtener top equipos por préstamos por mes activo
   * Comparación justa entre equipos nuevos y antiguos
   */
  getTopPorMesActivo(filter?: ReportFilter, limit: number = 10): Observable<{
    data: EquipoNormalizado[];
    filtros: any;
  }> {
    let params = filter ? this.buildParamsFromFilter(filter) : new HttpParams();
    params = params.set('limit', limit.toString());
    return this.http.get<{ data: EquipoNormalizado[]; filtros: any }>(
      `${this.baseUrl}/top-por-mes`, 
      { params }
    );
  }

  /**
   * Obtener evolución de utilización en el tiempo
   * Retorna 12 meses completos incluyendo períodos con cero
   */
  getEvolucionUtilizacion(filter?: ReportFilter): Observable<{
    data: EvolucionUtilizacion[];
    filtros: any;
  }> {
    const params = filter ? this.buildParamsFromFilter(filter) : new HttpParams();
    return this.http.get<{ data: EvolucionUtilizacion[]; filtros: any }>(
      `${this.baseUrl}/evolucion`, 
      { params }
    );
  }

  /**
   * Obtener métricas agregadas por categoría
   */
  getMetricasPorCategoria(filter?: ReportFilter): Observable<{
    data: MetricaCategoria[];
    filtros: any;
  }> {
    const params = filter ? this.buildParamsFromFilter(filter) : new HttpParams();
    return this.http.get<{ data: MetricaCategoria[]; filtros: any }>(
      `${this.baseUrl}/categorias`, 
      { params }
    );
  }

  /**
   * Comparar rendimiento entre equipos antiguos y nuevos
   * Útil para análisis de ciclo de vida
   */
  getComparacionAntiguedad(filter?: ReportFilter): Observable<ComparacionAntiguedad & { filtros: any }> {
    const params = filter ? this.buildParamsFromFilter(filter) : new HttpParams();
    return this.http.get<ComparacionAntiguedad & { filtros: any }>(
      `${this.baseUrl}/comparacion-antiguedad`, 
      { params }
    );
  }
}
