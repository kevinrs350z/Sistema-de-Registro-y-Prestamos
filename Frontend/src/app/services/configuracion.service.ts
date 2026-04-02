import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Configuracion {
  id: number;
  clave: string;
  valor: string | null;
  descripcion: string | null;
  grupo: string;
  created_at?: string;
  updated_at?: string;
}

@Injectable({ providedIn: 'root' })
export class ConfiguracionService {

  private readonly apiUrl = `${environment.apiBaseUrl}/api`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? '';
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json'
    });
  }

  getConfiguraciones(grupo?: string): Observable<Configuracion[]> {
    let url = `${this.apiUrl}/admin/configuraciones`;
    if (grupo) {
      url += `?grupo=${grupo}`;
    }
    return this.http.get<Configuracion[]>(url, { headers: this.getHeaders() });
  }

  actualizarConfiguraciones(configuraciones: { clave: string; valor: string | null }[]): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/configuraciones`, { configuraciones }, {
      headers: this.getHeaders()
    });
  }

  actualizarUna(clave: string, valor: string | null): Observable<any> {
    return this.http.patch(`${this.apiUrl}/admin/configuraciones/${clave}`, { valor }, {
      headers: this.getHeaders()
    });
  }
}
