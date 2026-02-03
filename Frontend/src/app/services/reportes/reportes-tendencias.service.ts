import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ReportFilter } from '../report-filters.service';

@Injectable({ providedIn: 'root' })
export class ReportesTendenciasService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api/reportes/tendencias`;

  constructor(private http: HttpClient) {}

  // Helper para construir params desde filtro BI
  private buildParamsFromFilter(filter: ReportFilter): HttpParams {
    return new HttpParams()
      .set('fecha_inicio', filter.from)
      .set('fecha_fin', filter.to)
      .set('granularidad', filter.granularity)
      .set('uso', filter.tipoUso ?? 'ambos');
  }

  getPrestamosMes(fechaInicio?: string, fechaFin?: string, periodo?: string): Observable<any[]> {
    const params: any = {};
    if (fechaInicio) params.fecha_inicio = fechaInicio;
    if (fechaFin) params.fecha_fin = fechaFin;
    if (periodo) params.periodo = periodo;
    return this.http.get<any[]>(`${this.baseUrl}/prestamos-mes`, { params });
  }

  getPrestamosMesWithFilter(filter: ReportFilter): Observable<any[]> {
    const params = this.buildParamsFromFilter(filter);
    return this.http.get<any[]>(`${this.baseUrl}/prestamos-mes`, { params });
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

  getUsoTipoUsuario(fechaInicio?: string, fechaFin?: string, periodo?: string): Observable<any[]> {
    const params: any = {};
    if (fechaInicio) params.fecha_inicio = fechaInicio;
    if (fechaFin) params.fecha_fin = fechaFin;
    if (periodo) params.periodo = periodo;
    return this.http.get<any[]>(`${this.baseUrl}/uso-tipo-usuario`, { params });
  }

  getUsoTipoUsuarioWithFilter(filter: ReportFilter): Observable<any[]> {
    const params = this.buildParamsFromFilter(filter);
    return this.http.get<any[]>(`${this.baseUrl}/uso-tipo-usuario`, { params });
  }
}
