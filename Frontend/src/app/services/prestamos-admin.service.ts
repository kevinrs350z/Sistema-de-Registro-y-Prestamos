import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PrestamosAdminService {

  private apiUrl = 'http://localhost:8000/api/admin/prestamos';

  constructor(private http: HttpClient) {}

  // Obtener header con token
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') ?? '';
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  // 🔹 1. Obtener solicitudes pendientes
  getPendientes(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/pendientes`,
      { headers: this.getAuthHeaders() }
    );
  }

  // 🔹 2. Obtener historial de préstamos (aceptados/rechazados/finalizados)
  getHistorial(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/historial`,
      { headers: this.getAuthHeaders() }
    );
  }

  // 🔹 3. Aprobar préstamo
  aprobarPrestamo(id: number, motivo: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/aprobar/${id}`,
      { motivo },
      { headers: this.getAuthHeaders() }
    );
  }

  // 🔹 4. Rechazar préstamo
  rechazarPrestamo(id: number, motivo: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/rechazar/${id}`,
      { motivo },
      { headers: this.getAuthHeaders() }
    );
  }
}
