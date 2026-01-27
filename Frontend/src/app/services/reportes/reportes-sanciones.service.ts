import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReportesSancionesService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api/reportes/sanciones`;

  constructor(private http: HttpClient) {}

  getKpis(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/kpis`);
  }

  getMotivos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/motivos`);
  }

  getReincidencia(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/reincidencia`);
  }

  getBloqueos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/bloqueos`);
  }

  getRelacionAtrasos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/relacion-atrasos`);
  }
}
