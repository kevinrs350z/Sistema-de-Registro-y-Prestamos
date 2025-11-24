import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class EquiposService {

  private apiUrl = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) {}

  // ============================================================
  // GENERAR HEADERS CON TOKEN DEL LOCALSTORAGE
  // ============================================================
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') ?? '';

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    });
  }

  // ============================================================
  // OBTENER LISTA COMPLETA DE EQUIPOS
  // ============================================================
  getEquipos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/equipos`, {
      headers: this.getHeaders()
    });
  }

  // ============================================================
  // ACTUALIZAR UN EQUIPO INDIVIDUAL
  // ============================================================
  actualizarEquipo(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/equipos/${id}`, data, {
      headers: this.getHeaders()
    });
  }
}
