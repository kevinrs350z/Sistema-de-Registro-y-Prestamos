import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

interface LoginResponse {
  token: string;
  user: {
    id: number;
    nombre: string;
    email: string;
    rol: {
      nombre: string;
      descripcion: string;
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  //private apiUrl = 'https://cofferlike-nonaseptic-stephen.ngrok-free.dev/api'; 
  private apiUrl = 'http://localhost:8000/api';
  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
      const token = localStorage.getItem('token') ?? '';
      return new HttpHeaders({
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      });
    }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, {
      email: email, 
      password
    });
  }
  loginWithGoogle(token: string) {
    return this.http.post('http://localhost:8000/api/auth/google', { token });
  }


  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot`, { email });
  }

  resetPassword(data: { email: string; password: string; token: string; password_confirmation: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset`, data);
  }
 //muestra equipos
  getEquipos(token: string) {
    const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
     };
  return this.http.get<any[]>(`${this.apiUrl}/equipos`, { headers });
  }
  
  getDashboardData(): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard`);
  }

  validateToken(token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/password/validate-token/${token}`);
  }

  crearPrestamo(payload: any, token: string) 
  {
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    };

    return this.http.post(`${this.apiUrl}/prestamos`, payload, { headers });
  }
    getPrestamos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/prestamos`, {
      headers: this.getHeaders(),
    });
  }

  /** 🔹 Cambiar estado de una solicitud (aceptar o rechazar) */
    cambiarEstado(id: number, accion: 'aceptar' | 'rechazar', motivo: string): Observable<any> {
      return this.http.post(
        `${this.apiUrl}/prestamos/cambiar-estado`,
        { id, accion, motivo }, // 👈 incluimos el motivo en el body
        { headers: this.getHeaders() }
      );
    }

  getSolicitudesUsuario(token: string)
  {
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    };
    return this.http.get<any[]>(`${this.apiUrl}/prestamos`, { headers });
  }

  //muestra el usuario utenticado
  getUsuario(token: string) {
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    };
    return this.http.get<any>(`${this.apiUrl}/userr`, { headers });
  }

  //**rutas asignaturas */
  getAsignaturas(token: string): Observable<any[]> {
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    };
    return this.http.get<any[]>(`${this.apiUrl}/asignaturas`,{ headers });
  }
  getBloques(token: string): Observable<any[]> 
  {
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    };
    return this.http.get<any[]>(`${this.apiUrl}/bloques`,{ headers });
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('rol');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }
}
