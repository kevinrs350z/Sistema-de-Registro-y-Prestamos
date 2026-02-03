import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ReportFilter } from '../report-filters.service';

@Injectable({ providedIn: 'root' })
export class ReportesInventarioService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api/reportes/inventario`;

  constructor(private http: HttpClient) {}

  // Helper para construir params desde filtro BI
  private buildParamsFromFilter(filter: ReportFilter): HttpParams {
    return new HttpParams()
      .set('fecha_inicio', filter.from)
      .set('fecha_fin', filter.to)
      .set('granularidad', filter.granularity)
      .set('tipo_uso', filter.tipoUso);
  }

  getEstado(fechaInicio?: string, fechaFin?: string, periodo?: string): Observable<any[]> {
    const params: any = {};
    if (fechaInicio) params.fecha_inicio = fechaInicio;
    if (fechaFin) params.fecha_fin = fechaFin;
    if (periodo) params.periodo = periodo;
    return this.http.get<any[]>(`${this.baseUrl}/estado`, { params });
  }

  getEstadoWithFilter(filter: ReportFilter): Observable<any[]> {
    const params = this.buildParamsFromFilter(filter);
    return this.http.get<any[]>(`${this.baseUrl}/estado`, { params });
  }

  getCategorias(fechaInicio?: string, fechaFin?: string, periodo?: string): Observable<any[]> {
    const params: any = {};
    if (fechaInicio) params.fecha_inicio = fechaInicio;
    if (fechaFin) params.fecha_fin = fechaFin;
    if (periodo) params.periodo = periodo;
    return this.http.get<any[]>(`${this.baseUrl}/categorias`, { params });
  }

  getCategoriasWithFilter(filter: ReportFilter): Observable<any[]> {
    const params = this.buildParamsFromFilter(filter);
    return this.http.get<any[]>(`${this.baseUrl}/categorias`, { params });
  }

  getAntiguedad(fechaInicio?: string, fechaFin?: string, periodo?: string): Observable<any[]> {
    const params: any = {};
    if (fechaInicio) params.fecha_inicio = fechaInicio;
    if (fechaFin) params.fecha_fin = fechaFin;
    if (periodo) params.periodo = periodo;
    return this.http.get<any[]>(`${this.baseUrl}/antiguedad`, { params });
  }

  getAntiguedadWithFilter(filter: ReportFilter): Observable<any[]> {
    const params = this.buildParamsFromFilter(filter);
    return this.http.get<any[]>(`${this.baseUrl}/antiguedad`, { params });
  }

  getTopUtilizados(fechaInicio?: string, fechaFin?: string, periodo?: string): Observable<any[]> {
    const params: any = {};
    if (fechaInicio) params.fecha_inicio = fechaInicio;
    if (fechaFin) params.fecha_fin = fechaFin;
    if (periodo) params.periodo = periodo;
    return this.http.get<any[]>(`${this.baseUrl}/top-utilizados`, { params });
  }

  getTopUtilizadosWithFilter(filter: ReportFilter): Observable<any[]> {
    const params = this.buildParamsFromFilter(filter);
    return this.http.get<any[]>(`${this.baseUrl}/top-utilizados`, { params });
  }

  getSubutilizados(fechaInicio?: string, fechaFin?: string, periodo?: string): Observable<any[]> {
    const params: any = {};
    if (fechaInicio) params.fecha_inicio = fechaInicio;
    if (fechaFin) params.fecha_fin = fechaFin;
    if (periodo) params.periodo = periodo;
    return this.http.get<any[]>(`${this.baseUrl}/subutilizados`, { params });
  }

  getSubutilizadosWithFilter(filter: ReportFilter): Observable<any[]> {
    const params = this.buildParamsFromFilter(filter);
    return this.http.get<any[]>(`${this.baseUrl}/subutilizados`, { params });
  }

  getDemandaVsDisponibilidadWithFilter(filter: ReportFilter, tipoEquipoId?: number): Observable<any> {
    let params = this.buildParamsFromFilter(filter);
    if (tipoEquipoId) {
      params = params.set('tipo_equipo_id', String(tipoEquipoId));
    }
    return this.http.get<any>(`${this.baseUrl}/demanda-vs-disponibilidad`, { params });
  }

  getTiposEquipoRelacionados(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiBaseUrl}/api/tipoEquipo-relacionados`);
  }
}
