import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DashboardOperationalService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api/dashboard/operational`;

  constructor(private http: HttpClient) {}

  getKPIs(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/kpis`);
  }

  getEstadoInventario(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/inventario`);
  }

  getAlertasCriticas(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/alertas`);
  }

  getActividadReciente(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/actividad-reciente`);
  }

  getSaludSistema(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/salud`);
  }
}
