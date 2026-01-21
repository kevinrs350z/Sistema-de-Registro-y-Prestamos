import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.prod';

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

  // Crear usuario
  crearUsuario(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/usuarios`, data);
  }

  // Listar usuarios con paginación
  obtenerUsuarios(page: number = 1): Observable<UsuarioResponse> {
    return this.http.get<UsuarioResponse>(`${this.apiUrl}/usuarios?page=${page}`);
  }

  // Obtener usuarios con filtro por estado (ACTIVO | INACTIVO | todos omitir)
  obtenerUsuariosPorEstado(page: number = 1, estado?: string): Observable<UsuarioResponse> {
    const qs = `?page=${page}` + (estado ? `&estado=${estado}` : '');
    return this.http.get<UsuarioResponse>(`${this.apiUrl}/usuarios${qs}`);
  }

  // Actualizar usuario
  actualizarUsuario(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/usuarios/${id}`, data);

  }

  // Eliminar usuario
  eliminarUsuario(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/usuarios/${id}`);
  }

  // Reactivar usuario
  reactivarUsuario(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/usuarios/${id}/reactivar`, {});
  }
}
