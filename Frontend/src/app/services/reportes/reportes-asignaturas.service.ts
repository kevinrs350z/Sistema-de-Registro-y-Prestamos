import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ReportFilter } from '../report-filters.service';

@Injectable({ providedIn: 'root' })
export class ReportesAsignaturasService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api/reportes/asignaturas`;

  constructor(private http: HttpClient) {}

  // Helper para construir params desde filtro BI
  private buildParamsFromFilter(filter: ReportFilter): HttpParams {
    return new HttpParams()
      .set('fecha_inicio', filter.from)
      .set('fecha_fin', filter.to)
      .set('granularidad', filter.granularity);
  }

  getUso(fechaInicio?: string, fechaFin?: string, periodo?: string): Observable<any[]> {
    const params: any = {};
    if (fechaInicio) params.fecha_inicio = fechaInicio;
    if (fechaFin) params.fecha_fin = fechaFin;
    if (periodo) params.periodo = periodo;
    return this.http.get<any[]>(`${this.baseUrl}/uso`, { params });
  }

  getUsoWithFilter(filter: ReportFilter): Observable<any[]> {
    const params = this.buildParamsFromFilter(filter);
    return this.http.get<any[]>(`${this.baseUrl}/uso`, { params });
  }

  getTendencia(fechaInicio?: string, fechaFin?: string, periodo?: string): Observable<any[]> {
    const params: any = {};
    if (fechaInicio) params.fecha_inicio = fechaInicio;
    if (fechaFin) params.fecha_fin = fechaFin;
    if (periodo) params.periodo = periodo;
    return this.http.get<any[]>(`${this.baseUrl}/tendencia`, { params });
  }

  getTendenciaWithFilter(filter: ReportFilter): Observable<any[]> {
    const params = this.buildParamsFromFilter(filter);
    return this.http.get<any[]>(`${this.baseUrl}/tendencia`, { params });
  }

  getEquiposPorAsignatura(page = 1, perPage = 10, search = '', fechaInicio?: string, fechaFin?: string, periodo?: string): Observable<any> {
    let params: any = { page, per_page: perPage };
    if (search) params.search = search;
    if (fechaInicio) params.fecha_inicio = fechaInicio;
    if (fechaFin) params.fecha_fin = fechaFin;
    if (periodo) params.periodo = periodo;
    return this.http.get<any>(`${this.baseUrl}/equipos`, { params });
  }

  getEquiposPorAsignaturaWithFilter(filter: ReportFilter, page = 1, perPage = 10, search = ''): Observable<any> {
    let params = this.buildParamsFromFilter(filter)
      .set('page', page.toString())
      .set('per_page', perPage.toString());
    if (search) params = params.set('search', search);
    return this.http.get<any>(`${this.baseUrl}/equipos`, { params });
  }
}
