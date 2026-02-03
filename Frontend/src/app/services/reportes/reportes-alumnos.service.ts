import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReportFilter } from '../report-filters.service';

@Injectable({ providedIn: 'root' })
export class ReportesAlumnosService {
  // Corrige la baseUrl para que coincida con las rutas del backend
  private readonly baseUrl = `${environment.apiBaseUrl}/api/reportes/alumnos`;

  constructor(private http: HttpClient) {}

  /**
   * Construir parámetros desde ReportFilter del servicio centralizado
   * Incluye filtros BI: from, to, granularity, uso, anioIngreso
   */
  private buildParamsFromFilter(filter: ReportFilter): HttpParams {
    let params = new HttpParams();
    // Fechas (formato BI: from/to)
    params = params.set('from', filter.from);
    params = params.set('to', filter.to);
    params = params.set('granularity', filter.granularity);
    
    // Filtro de tipo de uso (interno/externo/ambos)
    if (filter.tipoUso) {
      params = params.set('uso', filter.tipoUso);
    }
    
    // Filtro de año de ingreso
    if (filter.anioIngreso) {
      params = params.set('anioIngreso', filter.anioIngreso.toString());
    }
    
    return params;
  }

  // Las rutas del backend están definidas en ReportesAlumnosAdminController
  getKPIsAlumnos(fechaInicio?: string, fechaFin?: string, periodo?: string): Observable<any> {
    const params: any = {};
    if (fechaInicio) params.fecha_inicio = fechaInicio;
    if (fechaFin) params.fecha_fin = fechaFin;
    if (periodo) params.periodo = periodo;
    return this.http.get<any>(`${this.baseUrl}/kpis`, { params });
  }

  getKPIsAlumnosWithFilter(filter: ReportFilter): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/kpis`, { 
      params: this.buildParamsFromFilter(filter) 
    });
  }

  getPrestamosPorCarrera(fechaInicio?: string, fechaFin?: string, periodo?: string): Observable<any[]> {
    const params: any = {};
    if (fechaInicio) params.fecha_inicio = fechaInicio;
    if (fechaFin) params.fecha_fin = fechaFin;
    if (periodo) params.periodo = periodo;
    return this.http.get<any[]>(`${this.baseUrl}/prestamos-carrera`, { params });
  }

  getPrestamosPorCarreraWithFilter(filter: ReportFilter): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/prestamos-carrera`, { 
      params: this.buildParamsFromFilter(filter) 
    });
  }

  getSancionesPorNivel(fechaInicio?: string, fechaFin?: string, periodo?: string): Observable<any[]> {
    const params: any = {};
    if (fechaInicio) params.fecha_inicio = fechaInicio;
    if (fechaFin) params.fecha_fin = fechaFin;
    if (periodo) params.periodo = periodo;
    return this.http.get<any[]>(`${this.baseUrl}/sanciones-nivel`, { params });
  }

  getSancionesPorNivelWithFilter(filter: ReportFilter): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/sanciones-nivel`, { 
      params: this.buildParamsFromFilter(filter) 
    });
  }

  getEvolucionPrestamosAlumnos(fechaInicio?: string, fechaFin?: string, periodo?: string): Observable<any[]> {
    const params: any = {};
    if (fechaInicio) params.fecha_inicio = fechaInicio;
    if (fechaFin) params.fecha_fin = fechaFin;
    if (periodo) params.periodo = periodo;
    return this.http.get<any[]>(`${this.baseUrl}/evolucion-prestamos`, { params });
  }

  getEvolucionPrestamosAlumnosWithFilter(filter: ReportFilter): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/evolucion-prestamos`, { 
      params: this.buildParamsFromFilter(filter) 
    });
  }

  getRankingAlumnos(fechaInicio?: string, fechaFin?: string, periodo?: string): Observable<any[]> {
    const params: any = {};
    if (fechaInicio) params.fecha_inicio = fechaInicio;
    if (fechaFin) params.fecha_fin = fechaFin;
    if (periodo) params.periodo = periodo;
    return this.http.get<any[]>(`${this.baseUrl}/ranking`, { params });
  }

  getRankingAlumnosWithFilter(filter: ReportFilter): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/ranking`, { 
      params: this.buildParamsFromFilter(filter) 
    });
  }
}
