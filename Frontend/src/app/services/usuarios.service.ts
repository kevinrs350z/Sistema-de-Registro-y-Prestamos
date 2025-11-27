import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UsuarioResponse {
  data: any[];
  current_page: number;
  last_page: number;
}

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {

    //private apiUrl = 'http://localhost:8000/api/usuarios';
  private apiUrl = 'http://192.168.1.83:8000/api';

  constructor(private http: HttpClient) { }

  // Crear usuario
  crearUsuario(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/usuarios`, data);
  }

  // Listar usuarios con paginación
  obtenerUsuarios(page: number = 1): Observable<UsuarioResponse> {
    return this.http.get<UsuarioResponse>(`${this.apiUrl}/usuarios?page=${page}`);
  }

  // Actualizar usuario
  actualizarUsuario(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/usuarios/${id}`, data);

  }
}
