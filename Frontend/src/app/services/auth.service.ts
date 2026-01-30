import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

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
    /** Devuelve el rol actual del usuario autenticado */
    getRol(): string {
      // Puede estar en localStorage como 'rol' o en el objeto 'user'
      const rol = localStorage.getItem('rol');
      if (rol) return rol;
      const user = localStorage.getItem('user');
      if (user) {
        try {
          const obj = JSON.parse(user);
          if (obj.rol && obj.rol.nombre) return obj.rol.nombre;
        } catch {}
      }
      return '';
    }

    isAdmin(): boolean {
      return this.getRol().toUpperCase() === 'ADMIN';
    }

    isSuperUsuario(): boolean {
      return this.getRol().toUpperCase() === 'SUPER_USUARIO';
    }
  //private apiUrl = 'https://cofferlike-nonaseptic-stephen.ngrok-free.dev/api'; 
  private readonly apiUrl = `${environment.apiBaseUrl}/api`;
  //private apiUrl = 'http://192.168.1.83:8000/api';


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

  validarMaximoPrestamo(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/prestamos/validar-maximo`, payload, {
      headers: this.getHeaders()
    });
  }
    getPrestamos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/prestamos`, {
      headers: this.getHeaders(),
    });
  }

  /** 🔹 Cambiar estado de una solicitud (aceptar o rechazar) */
    cambiarEstado(id: number, accion: 'aceptar' | 'rechazar' | 'devuelto', motivo: string): Observable<any> {
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
  getSancionesActivas(token: string) {
    return this.http.get<any[]>(`${this.apiUrl}/admin/sanciones/activa`, {
      headers: { Authorization: `Bearer ${token}` }
    });
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
