import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReportesInventarioService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api/reportes/inventario`;

  constructor(private http: HttpClient) {}

  getEstado(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/estado`);
  }

  getCategorias(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/categorias`);
  }

  getAntiguedad(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/antiguedad`);
  }

  getTopUtilizados(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/top-utilizados`);
  }

  getSubutilizados(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/subutilizados`);
  }
}
