import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class EquiposService {

  private apiUrl = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') ?? '';
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    });
  }

  // Obtener todos los equipos (YA VIENEN CON nombre y categoria)
  getEquipos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/equipos`, {
      headers: this.getHeaders()
    });
  }

  // Obtener un equipo por ID
  getEquipo(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/equipos/${id}`, {
      headers: this.getHeaders()
    });
  }

  // Crear un nuevo equipo
  crearEquipo(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/equipos`, data, {
      headers: this.getHeaders()
    });
  }

  // Actualizar equipo
  actualizarEquipo(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/equipos/${id}`, data, {
      headers: this.getHeaders()
    });
  }

  // Eliminar equipo
  eliminarEquipo(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/equipos/${id}`, {
      headers: this.getHeaders()
    });
  }
}
