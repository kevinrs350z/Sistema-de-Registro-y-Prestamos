import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReportesAsignaturasService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api/reportes/asignaturas`;

  constructor(private http: HttpClient) {}

  getUso(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/uso`);
  }

  getTendencia(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/tendencia`);
  }

  getEquiposPorAsignatura(page = 1, perPage = 10, search = ''): Observable<any> {
    let params = new HttpParams().set('page', page).set('per_page', perPage);
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<any>(`${this.baseUrl}/equipos`, { params });
  }
}
