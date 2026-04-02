import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UsuarioResponse {
  data: any[];
  current_page: number;
  last_page: number;
}

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {

  private apiUrl = `${environment.apiBaseUrl}/api`;
  //private apiUrl = 'http://192.168.1.83:8000/api';

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('token') ?? '';
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    });
  }

  // Crear usuario
  crearUsuario(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/usuarios`, data, {
      headers: this.getHeaders()
    });
  }

  // Listar usuarios con paginación
  obtenerUsuarios(page: number = 1): Observable<UsuarioResponse> {
    return this.http.get<UsuarioResponse>(`${this.apiUrl}/usuarios?page=${page}`, {
      headers: this.getHeaders()
    });
  }

  // Obtener usuarios con filtro por estado (ACTIVO | INACTIVO | todos omitir)
  obtenerUsuariosPorEstado(page: number = 1, estado?: string): Observable<UsuarioResponse> {
    const qs = `?page=${page}` + (estado ? `&estado=${estado}` : '');
    return this.http.get<UsuarioResponse>(`${this.apiUrl}/usuarios${qs}`, {
      headers: this.getHeaders()
    });
  }

  // Búsqueda para autocompletado: devuelve usuarios coincidentes (puede paginar)
  buscarUsuarios(q: string, page: number = 1): Observable<UsuarioResponse> {
    const term = encodeURIComponent(q);
    return this.http.get<UsuarioResponse>(`${this.apiUrl}/usuarios?q=${term}&page=${page}`, {
      headers: this.getHeaders()
    });
  }

  // Actualizar usuario
  actualizarUsuario(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/usuarios/${id}`, data, {
      headers: this.getHeaders()
    });

  }

  // Eliminar usuario
  eliminarUsuario(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/usuarios/${id}`, {
      headers: this.getHeaders()
    });
  }

  // Reactivar usuario
  reactivarUsuario(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/usuarios/${id}/reactivar`, {}, {
      headers: this.getHeaders()
    });
  }

  bloquearAlumno(id: number, motivo: string, fecha?: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/admin/alumnos/${id}/bloquear`, {
      motivo,
      fecha: fecha || null
    }, {
      headers: this.getHeaders()
    });
  }

  desbloquearAlumno(id: number, motivo?: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/admin/alumnos/${id}/desbloquear`, {
      motivo: motivo || null
    }, {
      headers: this.getHeaders()
    });
  }
}
