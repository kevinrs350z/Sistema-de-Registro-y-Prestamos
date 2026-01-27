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

  getEquiposMasSolicitados(): Observable<any> {
    return this.http.get(`${this.apiUrl}/equipos-mas-solicitados`);
  }
  getUsoInternoExterno():  Observable<any> {
    return this.http.get(`${this.apiUrl}/uso-interno-externo`);
  }

  getSancionesYRechazos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/sanciones-rechazos`);
  }

  getEquiposDadoDeBaja(): Observable<any> {
    return this.http.get(`${this.apiUrl}/equipos-baja`);
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
