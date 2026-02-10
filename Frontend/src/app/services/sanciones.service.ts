import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SancionesService {

  private apiUrl = `${environment.apiBaseUrl}/api/admin/sanciones`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('token') ?? '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  getSanciones(): Observable<{ sanciones: any[] }> {
    return this.http.get<{ sanciones: any[] }>(`${this.apiUrl}`, {
      headers: this.getAuthHeaders()
    });
  }

  asignarSancion(data: any) {
    return this.http.post(`${this.apiUrl}/asignar`, data, {
      headers: this.getAuthHeaders()
    });
  }

  ampliarSancion(id: number, motivo: string) {
    return this.http.patch(`${this.apiUrl}/${id}/ampliar`, { motivo }, {
      headers: this.getAuthHeaders()
    });
  }

  quitarSancion(id: number, motivo?: string) {
    return this.http.patch(`${this.apiUrl}/${id}/quitar`, { motivo }, {
      headers: this.getAuthHeaders()
    });
  }

  prefillSancion(prestamoId: number) {
    return this.http.get(`${this.apiUrl}/prefill`, {
      params: { prestamo_id: prestamoId }
      , headers: this.getAuthHeaders()
    });
  }

  getCatalogo() {
    return this.http.get<{ sanciones: any[] }>(`${this.apiUrl}/catalogo`, {
      headers: this.getAuthHeaders()
    });
  }
}
