import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

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
  //private apiUrl = 'http://localhost:8000/api';//}
  private readonly apiUrl = `${environment.apiBaseUrl}/api/auth`;  

  constructor(private http: HttpClient) { }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password });
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot`, { email });
  }


  resetPassword(data: { email: string; password: string; token: string; password_confirmation: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset`, data);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('rol');
  }


  // ============================================================
  // OBTENER TODOS LOS EQUIPOS (PARA INVENTARIO ADMIN)
  // ============================================================
  getEquipos(token: string): Observable<any[]> {
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    };

    return this.http.get<any[]>(`${this.apiUrl}/equipos`, { headers });
  }


}
