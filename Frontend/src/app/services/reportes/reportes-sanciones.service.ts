import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ReportFilter } from '../report-filters.service';

@Injectable({ providedIn: 'root' })
export class ReportesSancionesService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api/reportes/sanciones`;

  constructor(private http: HttpClient) {}

  // Helper para construir params desde filtro BI
  private buildParamsFromFilter(filter: ReportFilter): HttpParams {
    return new HttpParams()
      .set('fecha_inicio', filter.from)
      .set('fecha_fin', filter.to)
      .set('granularidad', filter.granularity);
  }

  getKpis(fechaInicio?: string, fechaFin?: string, periodo?: string): Observable<any> {
    const params: any = {};
    if (fechaInicio) params.fecha_inicio = fechaInicio;
    if (fechaFin) params.fecha_fin = fechaFin;
    if (periodo) params.periodo = periodo;
    return this.http.get<any>(`${this.baseUrl}/kpis`, { params });
  }

  getKpisWithFilter(filter: ReportFilter): Observable<any> {
    const params = this.buildParamsFromFilter(filter);
    return this.http.get<any>(`${this.baseUrl}/kpis`, { params });
  }

  getMotivos(fechaInicio?: string, fechaFin?: string, periodo?: string): Observable<any[]> {
    const params: any = {};
    if (fechaInicio) params.fecha_inicio = fechaInicio;
    if (fechaFin) params.fecha_fin = fechaFin;
    if (periodo) params.periodo = periodo;
    return this.http.get<any[]>(`${this.baseUrl}/motivos`, { params });
  }

  getMotivosWithFilter(filter: ReportFilter): Observable<any[]> {
    const params = this.buildParamsFromFilter(filter);
    return this.http.get<any[]>(`${this.baseUrl}/motivos`, { params });
  }

  getReincidencia(fechaInicio?: string, fechaFin?: string, periodo?: string): Observable<any[]> {
    const params: any = {};
    if (fechaInicio) params.fecha_inicio = fechaInicio;
    if (fechaFin) params.fecha_fin = fechaFin;
    if (periodo) params.periodo = periodo;
    return this.http.get<any[]>(`${this.baseUrl}/reincidencia`, { params });
  }

  getReincidenciaWithFilter(filter: ReportFilter): Observable<any[]> {
    const params = this.buildParamsFromFilter(filter);
    return this.http.get<any[]>(`${this.baseUrl}/reincidencia`, { params });
  }

  getBloqueos(fechaInicio?: string, fechaFin?: string, periodo?: string): Observable<any[]> {
    const params: any = {};
    if (fechaInicio) params.fecha_inicio = fechaInicio;
    if (fechaFin) params.fecha_fin = fechaFin;
    if (periodo) params.periodo = periodo;
    return this.http.get<any[]>(`${this.baseUrl}/bloqueos`, { params });
  }

  getBloqueosWithFilter(filter: ReportFilter): Observable<any[]> {
    const params = this.buildParamsFromFilter(filter);
    return this.http.get<any[]>(`${this.baseUrl}/bloqueos`, { params });
  }

  getRelacionAtrasos(fechaInicio?: string, fechaFin?: string, periodo?: string): Observable<any[]> {
    const params: any = {};
    if (fechaInicio) params.fecha_inicio = fechaInicio;
    if (fechaFin) params.fecha_fin = fechaFin;
    if (periodo) params.periodo = periodo;
    return this.http.get<any[]>(`${this.baseUrl}/relacion-atrasos`, { params });
  }

  getRelacionAtrasosWithFilter(filter: ReportFilter): Observable<any[]> {
    const params = this.buildParamsFromFilter(filter);
    return this.http.get<any[]>(`${this.baseUrl}/relacion-atrasos`, { params });
  }
}
