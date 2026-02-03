import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import { ReportFilter } from "../report-filters.service";

@Injectable({
  providedIn: "root",
})
export class ReportesProfesoresService {

  private readonly apiUrl = `${environment.apiBaseUrl}/api/reportes/profesores`;

  constructor(private http: HttpClient) {}

  // ================================
  // HELPER - Construir params desde filtro BI
  // ================================
  private buildParamsFromFilter(filter: ReportFilter): HttpParams {
    let params = new HttpParams()
      .set('fecha_inicio', filter.from)
      .set('fecha_fin', filter.to)
      .set('granularidad', filter.granularity);
    return params;
  }

  // ================================
  // TABLA – Equipos por profesor
  // ================================
  getEquiposPorProfesor(page: number, pageSize: number, fechaInicio?: string, fechaFin?: string, periodo?: string): Observable<any> {
    const params: any = { page, per_page: pageSize };
    if (fechaInicio) params.fecha_inicio = fechaInicio;
    if (fechaFin) params.fecha_fin = fechaFin;
    if (periodo) params.periodo = periodo;
    return this.http.get<any>(`${this.apiUrl}/equipos`, { params });
  }

  getEquiposPorProfesorWithFilter(filter: ReportFilter, page: number = 1, pageSize: number = 10): Observable<any> {
    let params = this.buildParamsFromFilter(filter)
      .set('page', page.toString())
      .set('per_page', pageSize.toString());
    return this.http.get<any>(`${this.apiUrl}/equipos`, { params });
  }

  getPrestamosPorProfesor(fechaInicio?: string, fechaFin?: string, periodo?: string): Observable<any[]> {
    const params: any = {};
    if (fechaInicio) params.fecha_inicio = fechaInicio;
    if (fechaFin) params.fecha_fin = fechaFin;
    if (periodo) params.periodo = periodo;
    return this.http.get<any[]>(`${this.apiUrl}/prestamos`, { params });
  }

  getPrestamosPorProfesorWithFilter(filter: ReportFilter): Observable<any[]> {
    const params = this.buildParamsFromFilter(filter);
    return this.http.get<any[]>(`${this.apiUrl}/prestamos`, { params });
  }

  getTendenciaPrestamos(fechaInicio?: string, fechaFin?: string, periodo?: string): Observable<any> {
    const params: any = {};
    if (fechaInicio) params.fecha_inicio = fechaInicio;
    if (fechaFin) params.fecha_fin = fechaFin;
    if (periodo) params.periodo = periodo;
    return this.http.get<any>(`${this.apiUrl}/tendencia`, { params });
  }

  getTendenciaPrestamosWithFilter(filter: ReportFilter): Observable<any> {
    const params = this.buildParamsFromFilter(filter);
    return this.http.get<any>(`${this.apiUrl}/tendencia`, { params });
  }

  // Operative endpoints for a professor
  getPrestamosActivosProfesor(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiBaseUrl}/api/dashboard/operational/profesores/${id}/prestamos-activos`);
  }

  getPrestamosProximosProfesor(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiBaseUrl}/api/dashboard/operational/profesores/${id}/prestamos-proximos`);
  }

  getRiesgosProfesor(id: number): Observable<any> {
    return this.http.get<any>(`${environment.apiBaseUrl}/api/dashboard/operational/profesores/${id}/riesgos`);
  }

  getResponsabilidadProfesor(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiBaseUrl}/api/dashboard/operational/profesores/${id}/responsabilidad`);
  }

  getAlertasProfesor(id: number): Observable<any> {
    return this.http.get<any>(`${environment.apiBaseUrl}/api/dashboard/operational/profesores/${id}/alertas`);
  }
}
