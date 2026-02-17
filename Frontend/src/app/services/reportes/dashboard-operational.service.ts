import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DemandTimeseriesParams {
  tipo: 'FUERA' | 'DENTRO';
  from?: string;
  to?: string;
  bucket?: 'day' | 'week' | 'month';
  categoria?: string | number | null;
  asignatura?: number | null;
  anioIngreso?: number | null;
  estado?: string | null;
}

export interface LoanDurationDistributionParams {
  tipo: 'FUERA' | 'DENTRO';
  from?: string;
  to?: string;
  groupBy?: 'period' | 'categoria' | 'asignatura';
  bucket?: 'week' | 'month';
  categoria?: string | number | null;
  asignatura?: number | null;
  anioIngreso?: number | null;
  estado?: string | null;
}

export interface DemandVsDurationParams {
  tipo: 'FUERA' | 'DENTRO';
  from?: string;
  to?: string;
  groupBy?: 'period' | 'categoria' | 'asignatura';
  bucket?: 'week' | 'month';
  durationMetric?: 'p50' | 'p90';
  drillKey?: string | null;
  categoria?: string | number | null;
  asignatura?: number | null;
  anioIngreso?: number | null;
  estado?: string | null;
}

export interface DemandVsStockParams {
  tipo: 'FUERA' | 'DENTRO';
  from?: string;
  to?: string;
  groupBy?: 'tipo_equipo' | 'categoria';
  categoria?: string | number | null;
  asignatura?: number | null;
  anioIngreso?: number | null;
  estado?: string | null;
}

export interface TopRequestedParams {
  tipo: 'FUERA' | 'DENTRO';
  from?: string;
  to?: string;
  groupBy?: 'equipo' | 'categoria' | 'asignatura';
  topN?: 10 | 20;
  bucket?: 'week' | 'month';
  drillKey?: string | null;
  categoria?: string | number | null;
  asignatura?: number | null;
  anioIngreso?: number | null;
  estado?: string | null;
}

export interface DemandHeatmapParams {
  tipo: 'FUERA' | 'DENTRO';
  from?: string;
  to?: string;
  normalizeByWeeks?: boolean;
  categoria?: string | number | null;
  asignatura?: number | null;
  anioIngreso?: number | null;
  estado?: string | null;
}

export interface RejectionsAndStatusParams {
  tipo: 'FUERA' | 'DENTRO';
  view?: 'motivos' | 'estados';
  from?: string;
  to?: string;
  categoria?: string | number | null;
  asignatura?: number | null;
  anioIngreso?: number | null;
  estado?: string | null;
}

export interface DemandForecastParams {
  tipo: 'FUERA' | 'DENTRO';
  bucket?: 'week' | 'month';
  horizon?: number;
  from?: string;
  to?: string;
  categoria?: string | number | null;
  asignatura?: number | null;
  anioIngreso?: number | null;
  estado?: string | null;
}

export interface StatusFlowParams {
  tipo: 'FUERA' | 'DENTRO';
  from?: string;
  to?: string;
  categoria?: string | number | null;
  asignatura?: number | null;
  anioIngreso?: number | null;
  estado?: string | null;
}

export interface ExecutiveKpisParams {
  tipo: 'FUERA' | 'DENTRO';
  from?: string;
  to?: string;
  categoria?: string | number | null;
  asignatura?: number | null;
  anioIngreso?: number | null;
  estado?: string | null;
}

@Injectable({ providedIn: 'root' })
export class DashboardOperationalService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api/dashboard/operational`;
  private readonly analyticsUrl = `${environment.apiBaseUrl}/api/analytics`;

  constructor(private http: HttpClient) {}

  /** Elimina claves con valor null o undefined para que no lleguen como "null" string al backend. */
  private clean(obj: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== null && value !== undefined && value !== '') {
        result[key] = value;
      }
    }
    return result;
  }

  getKPIs(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/kpis`);
  }

  getEstadoInventario(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/inventario`);
  }

  getAlertasCriticas(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/alertas`);
  }

  getActividadReciente(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/actividad-reciente`);
  }

  getSaludSistema(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/salud`);
  }

  // KPIs de inventario, mantenimientos y sanciones
  getKPIsInventario(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/kpis-inventario`);
  }

  getKPIsMantenimientos(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/kpis-mantenimientos`);
  }

  getKPIsSanciones(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/kpis-sanciones`);
  }

  getDemandTimeseries(params: DemandTimeseriesParams): Observable<any> {
    return this.http.get<any>(`${this.analyticsUrl}/demand-timeseries`, { params: this.clean(params) });
  }

  getLoanDurationDistribution(params: LoanDurationDistributionParams): Observable<any> {
    return this.http.get<any>(`${this.analyticsUrl}/loan-duration-distribution`, { params: this.clean(params) });
  }

  getDemandVsDuration(params: DemandVsDurationParams): Observable<any> {
    return this.http.get<any>(`${this.analyticsUrl}/demand-vs-duration`, { params: this.clean(params) });
  }

  getDemandVsStock(params: DemandVsStockParams): Observable<any> {
    return this.http.get<any>(`${this.analyticsUrl}/demand-vs-stock`, { params: this.clean(params) });
  }

  getTopRequested(params: TopRequestedParams): Observable<any> {
    return this.http.get<any>(`${this.analyticsUrl}/top-requested`, { params: this.clean(params) });
  }

  getDemandHeatmap(params: DemandHeatmapParams): Observable<any> {
    return this.http.get<any>(`${this.analyticsUrl}/demand-heatmap`, { params: this.clean(params) });
  }

  getRejectionsAndStatus(params: RejectionsAndStatusParams): Observable<any> {
    return this.http.get<any>(`${this.analyticsUrl}/rejections-and-status`, { params: this.clean(params) });
  }

  getDemandForecast(params: DemandForecastParams): Observable<any> {
    return this.http.get<any>(`${this.analyticsUrl}/demand-forecast`, { params: this.clean(params) });
  }

  getStatusFlow(params: StatusFlowParams): Observable<any> {
    return this.http.get<any>(`${this.analyticsUrl}/status-flow`, { params: this.clean(params) });
  }

  getExecutiveKpis(params: ExecutiveKpisParams): Observable<any> {
    return this.http.get<any>(`${this.analyticsUrl}/executive-kpis`, { params: this.clean(params) });
  }
}
