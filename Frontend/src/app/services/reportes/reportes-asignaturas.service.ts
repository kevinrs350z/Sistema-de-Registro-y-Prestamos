import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReportesAsignaturasService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api/reportes/asignaturas`;

  constructor(private http: HttpClient) {}

  getUso(fechaInicio?: string, fechaFin?: string, periodo?: string): Observable<any[]> {
    const params: any = {};
    if (fechaInicio) params.fecha_inicio = fechaInicio;
    if (fechaFin) params.fecha_fin = fechaFin;
    if (periodo) params.periodo = periodo;
    return this.http.get<any[]>(`${this.baseUrl}/uso`, { params });
  }

  getTendencia(fechaInicio?: string, fechaFin?: string, periodo?: string): Observable<any[]> {
    const params: any = {};
    if (fechaInicio) params.fecha_inicio = fechaInicio;
    if (fechaFin) params.fecha_fin = fechaFin;
    if (periodo) params.periodo = periodo;
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
}
