import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReportesService {

  private readonly apiUrl = `${environment.apiBaseUrl}/api/reportes`;

  constructor(private http: HttpClient) {}

  getEquiposMasSolicitados(fechaInicio?: string, fechaFin?: string, periodo?: string): Observable<any> {
    const params: any = {};
    if (fechaInicio) params.fecha_inicio = fechaInicio;
    if (fechaFin) params.fecha_fin = fechaFin;
    if (periodo) params.periodo = periodo;
    return this.http.get(`${this.apiUrl}/equipos-mas-solicitados`, { params });
  }
  getUsoInternoExterno(fechaInicio?: string, fechaFin?: string, periodo?: string):  Observable<any> {
    const params: any = {};
    if (fechaInicio) params.fecha_inicio = fechaInicio;
    if (fechaFin) params.fecha_fin = fechaFin;
    if (periodo) params.periodo = periodo;
    return this.http.get(`${this.apiUrl}/uso-interno-externo`, { params });
  }

  getSancionesYRechazos(fechaInicio?: string, fechaFin?: string, periodo?: string): Observable<any> {
    const params: any = {};
    if (fechaInicio) params.fecha_inicio = fechaInicio;
    if (fechaFin) params.fecha_fin = fechaFin;
    if (periodo) params.periodo = periodo;
    return this.http.get(`${this.apiUrl}/sanciones-rechazos`, { params });
  }

  getEquiposDadoDeBaja(fechaInicio?: string, fechaFin?: string, periodo?: string): Observable<any> {
    const params: any = {};
    if (fechaInicio) params.fecha_inicio = fechaInicio;
    if (fechaFin) params.fecha_fin = fechaFin;
    if (periodo) params.periodo = periodo;
    return this.http.get(`${this.apiUrl}/equipos-baja`, { params });
  }

  // Operative endpoints (equipos)
  getDisponibilidadEquipos(): Observable<any[]> {
    return this.http.get<any[]>(`${(environment.apiBaseUrl)}/api/dashboard/operational/disponibilidad`);
  }

  getEquiposCriticos(): Observable<any[]> {
    return this.http.get<any[]>(`${(environment.apiBaseUrl)}/api/dashboard/operational/criticos`);
  }

  getEquipoUltimoEvento(id: number): Observable<any> {
    return this.http.get<any>(`${(environment.apiBaseUrl)}/api/dashboard/operational/equipos/${id}/ultimo-evento`);
  }

}
