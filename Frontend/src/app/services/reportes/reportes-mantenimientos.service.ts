import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ReportFilter } from '../report-filters.service';

@Injectable({ providedIn: 'root' })
export class ReportesMantenimientosService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api/reportes/mantenimientos`;

  constructor(private http: HttpClient) {}

  // Helper para construir params desde filtro BI
  private buildParamsFromFilter(filter: ReportFilter): HttpParams {
    return new HttpParams()
      .set('fecha_inicio', filter.from)
      .set('fecha_fin', filter.to)
      .set('granularidad', filter.granularity);
  }

  getAtrasos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/atrasos`);
  }

  getAtrasosWithFilter(filter: ReportFilter): Observable<any[]> {
    const params = this.buildParamsFromFilter(filter);
    return this.http.get<any[]>(`${this.baseUrl}/atrasos`, { params });
  }

  getIncidentes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/incidentes`);
  }

  getIncidentesWithFilter(filter: ReportFilter): Observable<any[]> {
    const params = this.buildParamsFromFilter(filter);
    return this.http.get<any[]>(`${this.baseUrl}/incidentes`, { params });
  }

  getIncidentesEquipo(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/incidentes-equipo`);
  }

  getIncidentesEquipoWithFilter(filter: ReportFilter): Observable<any[]> {
    const params = this.buildParamsFromFilter(filter);
    return this.http.get<any[]>(`${this.baseUrl}/incidentes-equipo`, { params });
  }

  getEquiposMantenimiento(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/equipos-mantenimiento`);
  }

  getEquiposMantenimientoWithFilter(filter: ReportFilter): Observable<any[]> {
    const params = this.buildParamsFromFilter(filter);
    return this.http.get<any[]>(`${this.baseUrl}/equipos-mantenimiento`, { params });
  }
}
