import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/* ── Params ── */

export interface AuditBaseParams {
  from?: string;
  to?: string;
}

export interface AuditTipoEquipoParams extends AuditBaseParams {
  tipo_equipo_id?: number | null;
}

export interface ThroughputParams extends AuditBaseParams {
  bucket?: 'day' | 'week' | 'month';
}

export interface HuerfanosParams {
  meses?: number;
}

/* ── Response types ── */

export interface KpiCard {
  key: string;
  label: string;
  value: number;
  unit: string | null;
  color: 'green' | 'red' | 'amber' | 'blue';
  tooltip: string;
}

export interface FillRateItem {
  tipo_equipo_id: number;
  modelo: string;
  total: number;
  satisfechas: number;
  rechazadas: number;
  fill_rate: number;
}

export interface AtrasoItem {
  tipo_equipo_id: number;
  modelo: string;
  total: number;
  atrasados: number;
  tasa_atraso: number;
}

export interface ParetoItem {
  motivo: string;
  cantidad: number;
  porcentaje: number;
  acumulado: number;
}

export interface ThroughputPoint {
  periodo: string;
  procesados: number;
  aprobados: number;
  rechazados: number;
  completados: number;
}

export interface HuerfanoItem {
  tipo_equipo_id: number;
  modelo: string;
  unidades: number;
  total_prestamos: number;
  ultimo_prestamo: string | null;
  dias_sin_uso: number | null;
}

export interface ABCItem {
  tipo_equipo_id: number;
  modelo: string;
  prestamos: number;
  porcentaje: number;
  acumulado: number;
  clase: 'A' | 'B' | 'C';
}

export interface ABCResumen {
  A: { modelos: number; prestamos: number; descripcion: string };
  B: { modelos: number; prestamos: number; descripcion: string };
  C: { modelos: number; prestamos: number; descripcion: string };
}

@Injectable({ providedIn: 'root' })
export class AuditDashboardService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api/dashboard/audit`;

  constructor(private http: HttpClient) {}

  private clean(obj: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== null && value !== undefined && value !== '') {
        result[key] = value;
      }
    }
    return result;
  }

  /** Resumen general — 6 KPI cards */
  getResumen(params: AuditBaseParams = {}): Observable<{ cards: KpiCard[]; meta: any }> {
    return this.http.get<any>(`${this.baseUrl}/resumen`, { params: this.clean(params) });
  }

  /** KPI-04: Fill Rate por Tipo Equipo */
  getFillRate(params: AuditTipoEquipoParams = {}): Observable<{
    global_fill_rate: number;
    detalle: FillRateItem[];
    meta: any;
  }> {
    return this.http.get<any>(`${this.baseUrl}/fill-rate`, { params: this.clean(params) });
  }

  /** KPI-10: Tasa de Atraso por Tipo Equipo */
  getTasaAtraso(params: AuditTipoEquipoParams = {}): Observable<{
    global_tasa_atraso: number;
    detalle: AtrasoItem[];
    meta: any;
  }> {
    return this.http.get<any>(`${this.baseUrl}/tasa-atraso`, { params: this.clean(params) });
  }

  /** KPI-16: Pareto de Rechazos */
  getParetoRechazos(params: AuditTipoEquipoParams = {}): Observable<{
    total_rechazos: number;
    pareto: ParetoItem[];
    meta: any;
  }> {
    return this.http.get<any>(`${this.baseUrl}/pareto-rechazos`, { params: this.clean(params) });
  }

  /** KPI-24: Throughput */
  getThroughput(params: ThroughputParams = {}): Observable<{
    promedio_por_periodo: number;
    bucket: string;
    timeseries: ThroughputPoint[];
    meta: any;
  }> {
    return this.http.get<any>(`${this.baseUrl}/throughput`, { params: this.clean(params) });
  }

  /** KPI-26: Equipos Huérfanos */
  getEquiposHuerfanos(params: HuerfanosParams = {}): Observable<{
    total_equipos: number;
    total_huerfanos: number;
    porcentaje: number;
    meses_umbral: number;
    huerfanos: HuerfanoItem[];
  }> {
    return this.http.get<any>(`${this.baseUrl}/equipos-huerfanos`, { params: this.clean(params) });
  }

  /** D.5: Segmentación ABC */
  getSegmentacionABC(params: AuditBaseParams = {}): Observable<{
    total_modelos: number;
    total_prestamos: number;
    resumen: ABCResumen;
    detalle: ABCItem[];
    meta: any;
  }> {
    return this.http.get<any>(`${this.baseUrl}/segmentacion-abc`, { params: this.clean(params) });
  }

  /** KPI-12: Heatmap Bloque × Día */
  getHeatmap(params: AuditTipoEquipoParams = {}): Observable<{
    bloques: string[];
    dias: string[];
    heatmapData: [string, string, number][];
    maxDemanda: number;
    meta: any;
  }> {
    return this.http.get<any>(`${this.baseUrl}/heatmap`, { params: this.clean(params) });
  }
}
