import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SancionesService {

  private apiUrl = `${environment.apiBaseUrl}/api/admin/sanciones`;

  constructor(private http: HttpClient) {}

  getSanciones(): Observable<{ sanciones: any[] }> {
    return this.http.get<{ sanciones: any[] }>(`${this.apiUrl}`);
  }

  asignarSancion(data: any) {
    return this.http.post(`${this.apiUrl}/asignar`, data);
  }

  ampliarSancion(id: number, motivo: string) {
    return this.http.patch(`${this.apiUrl}/${id}/ampliar`, { motivo });
  }

  quitarSancion(id: number, motivo?: string) {
    return this.http.patch(`${this.apiUrl}/${id}/quitar`, { motivo });
  }

  prefillSancion(prestamoId: number) {
    return this.http.get(`${this.apiUrl}/prefill`, {
      params: { prestamo_id: prestamoId }
    });
  }

  getCatalogo() {
    return this.http.get<{ sanciones: any[] }>(`${this.apiUrl}/catalogo`);
  }
}
