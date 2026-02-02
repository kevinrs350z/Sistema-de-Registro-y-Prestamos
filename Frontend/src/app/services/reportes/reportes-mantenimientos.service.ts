import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReportesMantenimientosService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api/reportes/mantenimientos`;

  constructor(private http: HttpClient) {}

  getAtrasos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/atrasos`);
  }

  getIncidentes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/incidentes`);
  }

  getIncidentesEquipo(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/incidentes-equipo`);
  }

  getEquiposMantenimiento(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/equipos-mantenimiento`);
  }
}
